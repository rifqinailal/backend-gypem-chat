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

    // 1. Dapatkan semua room_member_id untuk user ini
    const userRoomMembers = await RoomMember.findAll({
        where: { member_id: memberId, member_type: memberType },
        attributes: ['room_member_id']
    });
    const userRoomMemberIds = userRoomMembers.map(rm => rm.room_member_id);

    // 2. Update status pesan
    const [affectedCount] = await MessageStatus.update(
        { is_starred: starStatus },
        {
            where: {
                message_id: { [Op.in]: message_ids },
                room_member_id: { [Op.in]: userRoomMemberIds } // Security check
            }
        }
    );

    if (affectedCount === 0) {
        return sendError(res, 'Tidak ada pesan yang diupdate. Pastikan message_id valid dan milik Anda.', 404);
    }

    const statusText = starStatus ? 'dibintangi' : 'bintangnya dihapus';
    sendSuccess(res, `${affectedCount} pesan berhasil ${statusText}.`, { updated_count: affectedCount });
};

export const starMessages = catchAsync((req, res, next) => toggleStarStatus(req, res, next, true));
export const unstarMessages = catchAsync((req, res, next) => toggleStarStatus(req, res, next, false));

export const getStarredMessages = catchAsync(async (req, res, next) => {
    const { roomId, q } = req.query;

    // 1. Dapatkan semua room_member_id untuk user ini
    const userRoomMembers = await RoomMember.findAll({
        where: { member_id: req.userId, member_type: req.userType },
        attributes: ['room_member_id', 'room_id']
    });

    const userRoomMemberIds = userRoomMembers.map(rm => rm.room_member_id);

    // 2. Buat kondisi pencarian
    const whereClause = {
        room_member_id: { [Op.in]: userRoomMemberIds },
        is_starred: true
    };

    const includeMessageWhere = {};
    if (roomId) {
        const targetRoomMember = userRoomMembers.find(rm => rm.room_id == roomId);
        if (targetRoomMember) {
            whereClause.room_member_id = targetRoomMember.room_member_id;
        }
    }
    if (q) {
        includeMessageWhere.content = { [Op.like]: `%${q}%` };
    }

    const starredStatuses = await MessageStatus.findAll({
        where: whereClause,
        include: [{ model: Message, as: 'message', where: includeMessageWhere, required: true }],
        order: [['updated_at', 'DESC']]
    });

    sendSuccess(res, 'Daftar pesan berbintang berhasil diambil.', starredStatuses);
});