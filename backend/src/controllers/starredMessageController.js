import db from '../../models/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { Op } from 'sequelize';

const MessageStatus = db.MessageStatus;
const RoomMember = db.RoomMember;
const Message = db.Message;

/**
 * @description Helper function untuk mengubah status bintang pada banyak pesan.
 */
const toggleStarStatus = async (req, res, next, starStatus) => {
    const { message_ids } = req.body;
    const memberId = req.user.user_id || req.user.admin_id;
    const memberType = req.userType;

    if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
        return sendError(res, 'message_ids harus berupa array dan tidak boleh kosong.', 400);
    }

    // 1. Dapatkan semua room_member_id milik user
    const userRoomMembers = await RoomMember.findAll({
        where: { member_id: memberId, member_type: memberType },
        attributes: ['room_member_id', 'room_id']
    });
    const userRoomMemberIds = userRoomMembers.map(rm => rm.room_member_id);
    const userRoomMemberMap = new Map(userRoomMembers.map(rm => [rm.room_id, rm.room_member_id]));

    // 2. Dapatkan pesan yang relevan untuk memvalidasi kepemilikan room
    const messages = await Message.findAll({
        where: { message_id: { [Op.in]: message_ids } },
        attributes: ['message_id', 'room_id']
    });

    if (messages.length !== message_ids.length) {
        return sendError(res, 'Satu atau lebih pesan tidak ditemukan.', 404);
    }

    // 3. Buat atau update status untuk setiap pesan
    const statusesToUpdate = [];
    for (const message of messages) {
        const roomMemberId = userRoomMemberMap.get(message.room_id);
        if (!roomMemberId) {
            // Jika user bukan anggota room dari salah satu pesan, batalkan semua
            return sendError(res, `Anda bukan anggota room untuk pesan dengan ID ${message.message_id}.`, 403);
        }
        statusesToUpdate.push({
            message_id: message.message_id,
            room_member_id: roomMemberId,
            is_starred: starStatus
        });
    }

    // 4. Gunakan bulk create dengan opsi update jika sudah ada
    await MessageStatus.bulkCreate(statusesToUpdate, {
        updateOnDuplicate: ['is_starred']
    });
    
    const actionText = starStatus ? 'ditambahkan' : 'dihapus';
    sendSuccess(res, `Bintang pada pesan berhasil ${actionText}.`, { updated_ids: message_ids });
};


/**
 * @description Membintangi satu atau lebih pesan.
 * @route PATCH /messages/star
 * @access Private
 */
export const starMessages = (req, res, next) => toggleStarStatus(req, res, next, true);

/**
 * @description Membatalkan bintang pada satu atau lebih pesan.
 * @route PATCH /messages/unstar
 * @access Private
 */
export const unstarMessages = (req, res, next) => toggleStarStatus(req, res, next, false);


/**
 * @description Menampilkan semua pesan berbintang, bisa difilter per room atau dicari.
 * @route GET /messages/starred
 * @route GET /rooms/:roomId/messages/starred
 * @route GET /messages/starred/search?q={keyword}
 * @access Private
 */
export const getStarredMessages = catchAsync(async (req, res, next) => {
    const { roomId } = req.params;
    const { q: searchQuery } = req.query;
    const memberId = req.user.user_id || req.user.admin_id;
    const memberType = req.userType;

    // Sub-query untuk mendapatkan semua room_member_id milik user
    const userRoomMembers = await RoomMember.findAll({
        where: { member_id: memberId, member_type: memberType },
        attributes: ['room_member_id', 'room_id']
    });
    const userRoomMemberIds = userRoomMembers.map(rm => rm.room_member_id);

    if (userRoomMemberIds.length === 0) {
        return sendSuccess(res, 'Anda belum bergabung di room manapun.', []);
    }

    // Opsi filter
    const statusWhereClause = {
        room_member_id: { [Op.in]: userRoomMemberIds },
        is_starred: true
    };
    const messageWhereClause = {};

    // Filter berdasarkan room ID dari params
    if (roomId) {
        const targetRoomMember = userRoomMembers.find(rm => rm.room_id == roomId);
        if (targetRoomMember) {
            statusWhereClause.room_member_id = targetRoomMember.room_member_id;
        } else {
            return sendSuccess(res, 'Tidak ada pesan berbintang di room ini atau Anda bukan anggota.', []);
        }
    }

    // Filter berdasarkan query pencarian
    if (searchQuery) {
        messageWhereClause.content = { [Op.like]: `%${searchQuery}%` };
    }

    const starredStatuses = await MessageStatus.findAll({
        where: statusWhereClause,
        include: [{
            model: Message,
            as: 'message',
            where: messageWhereClause,
            required: true,
            include: [ /* Tambahkan include lain jika perlu, misal sender info */ ]
        }],
        order: [[{ model: Message, as: 'message' }, 'createdAt', 'DESC']]
    });

    // Format data sesuai response yang diinginkan
    const formattedData = starredStatuses.map(status => ({
        ...status.message.toJSON(),
        message_status: {
            message_status_id: status.message_status_id,
            is_starred: status.is_starred,
            is_pinned: status.is_pinned,
            is_deleted_for_me: status.is_deleted_for_me
        }
    }));

    sendSuccess(res, 'Pesan berbintang berhasil diambil.', formattedData);
});
