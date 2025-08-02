import db from '../../models/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { Op } from 'sequelize';

const RoomMember = db.RoomMember;

/**
 * @description Helper function untuk mengubah status arsip pada banyak room.
 */
const toggleArchiveStatus = async (req, res, next, archiveStatus) => {
    const { room_member_ids } = req.body;
    const memberId = req.user.user_id || req.user.admin_id;
    const memberType = req.userType;

    if (!room_member_ids || !Array.isArray(room_member_ids) || room_member_ids.length === 0) {
        return sendError(res, 'room_member_ids harus berupa array dan tidak boleh kosong.', 400);
    }

    const [affectedCount] = await RoomMember.update(
        { is_archived: archiveStatus },
        {
            where: {
                room_member_id: { [Op.in]: room_member_ids },
                member_id: memberId, // Security check: pastikan user hanya mengupdate miliknya
                member_type: memberType
            }
        }
    );

    if (affectedCount === 0) {
        return sendError(res, 'Tidak ada chat yang diupdate. Pastikan room_member_id valid dan milik Anda.', 404);
    }

    const statusText = archiveStatus ? 'diarsipkan' : 'dikeluarkan dari arsip';
    sendSuccess(res, `Chat berhasil ${statusText}.`, { updated_count: affectedCount });
};

/**
 * @description Mengarsipkan satu atau lebih chat.
 * @route PATCH /rooms/archive
 * @access Private
 */
export const archiveChats = (req, res, next) => toggleArchiveStatus(req, res, next, true);

/**
 * @description Membatalkan arsip satu atau lebih chat.
 * @route PATCH /rooms/unarchive
 * @access Private
 */
export const unarchiveChats = (req, res, next) => toggleArchiveStatus(req, res, next, false);


/**
 * @description Menampilkan semua chat yang diarsipkan oleh pengguna.
 * @route GET /rooms/archived
 * @access Private
 */
export const getArchivedChats = catchAsync(async (req, res, next) => {
    const memberId = req.user.user_id || req.user.admin_id;
    const memberType = req.userType;

    const archivedRoomMembers = await RoomMember.findAll({
        where: {
            member_id: memberId,
            member_type: memberType,
            is_archived: true
        },
        include: [{
            model: db.Room,
            as: 'room',
            include: [
                {
                    model: db.RoomDescription,
                    as: 'description'
                },
                // Anda mungkin perlu menambahkan include untuk mendapatkan last_message, dll.
                // Ini memerlukan query yang lebih kompleks.
            ]
        }]
    });
    
    // TODO: Transformasikan data `archivedRoomMembers` agar sesuai dengan format response yang diinginkan.
    // Ini mungkin memerlukan query tambahan untuk mendapatkan `last_message`, `unread_count`, dll. untuk setiap room.
    // Contoh transformasi sederhana:
    const formattedData = archivedRoomMembers.map(rm => ({
        room_id: rm.room.room_id,
        room_member_id: rm.room_member_id,
        room_type: rm.room.room_type,
        name: rm.room.description?.name || 'Nama Room',
        url_photo: rm.room.description?.url_photo || '',
        is_archived: rm.is_archived,
        is_pinned: rm.is_pinned,
        // last_message, last_message_time, unread_count perlu diambil secara terpisah
        last_message: "Contoh last message", 
        last_message_time: new Date().toISOString(),
        unread_count: 0
    }));

    sendSuccess(res, 'Semua chat arsip berhasil diambil.', formattedData);
});
