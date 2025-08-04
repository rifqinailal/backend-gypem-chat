import { Op } from 'sequelize';
import db from '../../models/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const { RoomMember, Room, RoomDescription, Message, Peserta, Admin, MessageStatus } = db;

/**
 * Mengubah status arsip (archive/unarchive) untuk satu atau lebih room.
 */
const updateArchiveStatus = async (req, res, targetStatus) => {
    const { room_member_id } = req.body;
    const { userId, userType } = req;
    
    const members = await RoomMember.findAll({
        where: {
            room_member_id: { [Op.in]: room_member_id },
            member_id: userId,
            member_type: userType
        }
    });

    if (members.length !== room_member_id.length) {
        return sendError(res, 'Satu atau lebih ID room tidak valid atau bukan milik Anda.', 403);
    }
    
    const alreadyInStatus = members.some(member => member.is_archived === targetStatus);
    const messagePart = targetStatus ? 'diarsipkan' : 'dikeluarkan dari arsip';
    if (alreadyInStatus) {
         return sendError(res, `Satu atau lebih room sudah ${messagePart}.`, 409);
    }

    const [updatedCount] = await RoomMember.update(
        { is_archived: targetStatus },
        {
            where: {
                room_member_id: { [Op.in]: room_member_id },
                member_id: userId,
                member_type: userType
            }
        }
    );
    
    if (updatedCount > 0) {
        sendSuccess(res, `Room berhasil ${messagePart}`, null, 200);
    } else {
        sendError(res, 'Gagal mengupdate status arsip room.', 500);
    }

};

/**
 * Controller untuk mengarsipkan chat.
 * PATCH /rooms/archive
 */
export const archiveRooms = catchAsync(async (req, res) => {
    await updateArchiveStatus(req, res, true);
});

/**
 * Controller untuk membatalkan arsip chat.
 * PATCH /rooms/unarchived
 */
export const unarchiveRooms = catchAsync(async (req, res) => {
    await updateArchiveStatus(req, res, false);
});

/**
 * Controller untuk menampilkan semua chat yang diarsipkan oleh user.
 * GET /rooms/archived
 */
export const getArchivedRooms = catchAsync(async (req, res) => {
    const { userId, userType } = req;

    // 1. Ambil semua room member milik user yang diarsipkan
    const archivedMemberships = await RoomMember.findAll({
        where: {
            member_id: userId,
            member_type: userType,
            is_archived: true,
        },
        include: [{
            model: Room,
            as: 'room',
        }],
        order: [['updated_at', 'DESC']]
    });

    if (archivedMemberships.length === 0) {
        return sendSuccess(res, "Data berhasil didapatkan", [], 200);
    }

    const responseData = await Promise.all(
        archivedMemberships.map(async (member) => {
            const room = member.room;
            let name, url_photo;

            if (room.room_type === 'group') {
                const description = await RoomDescription.findOne({ where: { room_id: room.room_id } });
                name = description?.name || 'Grup Tanpa Nama';
                url_photo = description?.url_photo || null;
            } else {
                const otherMember = await RoomMember.findOne({
                    where: {
                        room_id: room.room_id,
                        member_id: { [Op.ne]: userId }
                    }
                });
                
                if (otherMember) {
                    const partner = otherMember.member_type === 'admin' 
                        ? await Admin.findByPk(otherMember.member_id, { attributes: ['nama_admin', 'url_profile_photo'] })
                        : await Peserta.findByPk(otherMember.member_id, { attributes: ['nama_peserta', 'url_profile_photo'] });
                    
                    name = partner?.nama_admin || partner?.nama_peserta || 'User Dihapus';
                    url_photo = partner?.url_profile_photo || null;
                } else {
                    name = 'Chat Kosong';
                }
            }

            // Dapatkan pesan terakhir
            const lastMessage = await Message.findOne({
                where: { room_id: room.room_id },
                order: [['created_at', 'DESC']]
            });

            // Hitung pesan belum dibaca
            const unreadCount = await MessageStatus.count({
                where: {
                    room_member_id: member.room_member_id,
                    read_at: null,
                }
            });

            return {
                room_id: room.room_id,
                room_member_id: member.room_member_id,
                room_type: room.room_type,
                name: name,
                url_photo: url_photo,
                last_message: lastMessage?.content || null,
                last_message_time: lastMessage?.created_at || null,
                unread_count: unreadCount,
                is_pinned: member.is_pinned,
                is_archived: member.is_archived
            };
        })
    );
    
    sendSuccess(res, 'Data berhasil didapatkan', responseData, 200);
});
