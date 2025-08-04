import { Op } from 'sequelize';
import db from '../../models/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const MessageStatus = db.MessageStatus;
const Message = db.Message;
const RoomMember = db.RoomMember;
const Admin = db.Admin;
const Peserta = db.Peserta;
const Attachment = db.Attachment;

// Helper untuk format pesan agar sesuai dokumentasi
const formatStarredMessage = async (status) => {
    const message = status.message;
    let senderName = 'Unknown';

    // Ambil nama pengirim berdasarkan tipe
    if (message.sender_type === 'admin') {
        const sender = await Admin.findByPk(message.sender_id, { attributes: ['nama_admin'] });
        if (sender) senderName = sender.nama_admin;
    } else {
        const sender = await Peserta.findByPk(message.sender_id, { attributes: ['nama_peserta'] });
        if (sender) senderName = sender.nama_peserta;
    }
    
    // Ambil data balasan jika ada
    let repliedTo = null;
    if (message.repliedTo) {
        let repliedSenderName = 'Unknown';
        if (message.repliedTo.sender_type === 'admin') {
            const rSender = await Admin.findByPk(message.repliedTo.sender_id, { attributes: ['nama_admin'] });
            if(rSender) repliedSenderName = rSender.nama_admin;
        } else {
            const rSender = await Peserta.findByPk(message.repliedTo.sender_id, { attributes: ['nama_peserta'] });
            if(rSender) repliedSenderName = rSender.nama_peserta;
        }
        repliedTo = {
            reply_to_message_id: message.repliedTo.message_id,
            sender_name: repliedSenderName,
            content: message.repliedTo.content
        };
    }

    return {
        message_id: message.message_id,
        room_id: message.room_id,
        room_member_id: status.room_member_id,
        sender: senderName,
        content: message.content,
        file_type: message.attachment ? message.attachment.file_type : 'text',
        file_path: message.attachment ? message.attachment.file_path : null,
        created_at: message.created_at,
        reply_to_message: repliedTo,
        message_status: {
            message_status_id: status.message_status_id,
            is_starred: status.is_starred,
            is_pinned: status.is_pinned,
            is_deleted_for_me: status.is_deleted_for_me
        }
    };
};

/**
 * Membintangi satu atau lebih pesan.
 */
export const starMessages = catchAsync(async (req, res, next) => {
    const { message_status_id } = req.body;
    if (!message_status_id || !Array.isArray(message_status_id) || message_status_id.length === 0) {
        return sendError(res, 'message_status_id harus berupa array dan tidak boleh kosong.', 400);
    }
    
    // 1. Dapatkan semua room_member_id milik user yang login
    const userMemberships = await RoomMember.findAll({
        where: { member_id: req.userId, member_type: req.userType },
        attributes: ['room_member_id']
    });
    const userMemberIds = userMemberships.map(m => m.room_member_id);

    // 2. Cek apakah pesan sudah dibintangi
    const existingStarred = await MessageStatus.findAll({
        where: {
            message_status_id: { [Op.in]: message_status_id },
            is_starred: true,
            room_member_id: { [Op.in]: userMemberIds } // Hanya bisa mengubah milik sendiri
        }
    });

    if (existingStarred.length > 0) {
        return sendError(res, 'Satu atau lebih pesan sudah dibintangi.', 409);
    }
    
    // 3. Update status pesan menjadi berbintang
    const [updatedCount] = await MessageStatus.update(
        { is_starred: true },
        { 
            where: { 
                message_status_id: { [Op.in]: message_status_id },
                room_member_id: { [Op.in]: userMemberIds } // Pastikan user hanya mengubah statusnya sendiri
            } 
        }
    );

    if (updatedCount === 0) {
        return sendError(res, 'Pesan tidak ditemukan atau Anda tidak memiliki akses.', 404);
    }

    sendSuccess(res, 'Pesan berhasil ditandai bintang.', null, 200);
});

/**
 * Membatalkan bintang pada satu atau lebih pesan.
 */
export const unstarMessages = catchAsync(async (req, res, next) => {
    const { message_status_id } = req.body;
    if (!message_status_id || !Array.isArray(message_status_id) || message_status_id.length === 0) {
        return sendError(res, 'Pesan belum dipilih.', 400);
    }

    const userMemberships = await RoomMember.findAll({
        where: { member_id: req.userId, member_type: req.userType },
        attributes: ['room_member_id']
    });
    const userMemberIds = userMemberships.map(m => m.room_member_id);

    const [updatedCount] = await MessageStatus.update(
        { is_starred: false },
        { 
            where: { 
                message_status_id: { [Op.in]: message_status_id },
                room_member_id: { [Op.in]: userMemberIds }
            } 
        }
    );

    if (updatedCount === 0) {
        return sendError(res, 'Pesan tidak ditemukan atau sudah tidak dibintangi.', 404);
    }

    sendSuccess(res, 'Bintang pada pesan berhasil dibatalkan.', null, 200);
});


/**
 * Menampilkan semua pesan berbintang milik user yang login.
 */
export const getAllStarred = catchAsync(async (req, res, next) => {
    const userMemberships = await RoomMember.findAll({
        where: { member_id: req.userId, member_type: req.userType },
        attributes: ['room_member_id']
    });
    const userMemberIds = userMemberships.map(m => m.room_member_id);

    const statuses = await MessageStatus.findAll({
        where: {
            room_member_id: { [Op.in]: userMemberIds },
            is_starred: true
        },
        include: [{
            model: Message,
            as: 'message',
            include: [
                { model: Attachment, as: 'attachment' },
                { model: Message, as: 'repliedTo' } // Include untuk data balasan
            ]
        }],
        order: [[{model: Message, as: 'message'}, 'created_at', 'DESC']]
    });

    const formattedData = await Promise.all(statuses.map(formatStarredMessage));

    sendSuccess(res, 'Data berhasil didapatkan', formattedData, 200);
});

/**
 * Menampilkan pesan berbintang dalam room tertentu.
 */
export const getStarredByRoom = catchAsync(async (req, res, next) => {
    const { roomId } = req.params;

    const roomMember = await RoomMember.findOne({
        where: {
            room_id: roomId,
            member_id: req.userId,
            member_type: req.userType
        }
    });

    if (!roomMember) {
        return sendError(res, 'Anda bukan anggota room ini.', 403);
    }

    const statuses = await MessageStatus.findAll({
        where: {
            room_member_id: roomMember.room_member_id,
            is_starred: true
        },
        include: [{
            model: Message,
            as: 'message',
            include: [
                { model: Attachment, as: 'attachment' },
                { model: Message, as: 'repliedTo' }
            ]
        }],
        order: [[{model: Message, as: 'message'}, 'created_at', 'DESC']]
    });
    
    const formattedData = await Promise.all(statuses.map(formatStarredMessage));

    sendSuccess(res, 'Data berhasil didapatkan', formattedData, 200);
});

/**
 * Mencari pesan berbintang berdasarkan keyword.
 */
export const searchStarred = catchAsync(async (req, res, next) => {
    // 1. Ambil keyword dari query URL (?q=...)
    const { q } = req.query;
    if (!q) {
        return sendError(res, 'Keyword pencarian (q) dibutuhkan.', 400);
    }

    // 2. Dapatkan semua ID keanggotaan milik user yang login
    const userMemberships = await RoomMember.findAll({
        where: { member_id: req.userId, member_type: req.userType },
        attributes: ['room_member_id']
    });
    const userMemberIds = userMemberships.map(m => m.room_member_id);

    // 3. Cari status pesan yang:
    //    - Milik user yang login (room_member_id-nya ada di list)
    //    - Sudah dibintangi (is_starred: true)
    //    - Konten pesannya mengandung keyword (via include)
    const statuses = await MessageStatus.findAll({
        where: {
            room_member_id: { [Op.in]: userMemberIds },
            is_starred: true
        },
        include: [{
            model: Message,
            as: 'message',
            where: {
                // Mencocokkan keyword dengan konten pesan
                content: { [Op.like]: `%${q}%` }
            },
            include: [
                { model: Attachment, as: 'attachment' },
                { model: Message, as: 'repliedTo' }
            ]
        }],
        order: [[{model: Message, as: 'message'}, 'created_at', 'DESC']]
    });

    // 4. Format data agar sesuai dengan response yang diinginkan
    const formattedData = await Promise.all(statuses.map(formatStarredMessage));

    sendSuccess(res, 'Data berhasil didapatkan', formattedData, 200);
});
