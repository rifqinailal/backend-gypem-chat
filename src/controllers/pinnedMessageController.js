// =================================================================
// File: src/controllers/pinnedMessageController.js (REVISED)
// Tujuan: Menggunakan metode manual untuk mendapatkan data pengirim agar konsisten.
// =================================================================
import db from '../../models/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const MessageStatus = db.MessageStatus;
const Message = db.Message;
const RoomMember = db.RoomMember;
const Admin = db.Admin;
const Peserta = db.Peserta;

/**
 * Menyematkan sebuah pesan.
 */
export const pinMessage = catchAsync(async (req, res, next) => {
  const { messageStatusId } = req.params;

  const userRoomMembers = await RoomMember.findAll({
    where: { member_id: req.userId, member_type: req.userType },
    attributes: ['room_member_id']
  });
  const userRoomMemberIds = userRoomMembers.map(rm => rm.room_member_id);

  const status = await MessageStatus.findOne({
    where: {
      message_status_id: messageStatusId,
      room_member_id: userRoomMemberIds
    }
  });

  if (!status) {
    return sendError(res, 'Pesan tidak ditemukan', 404);
  }

  if (status.is_pinned) {
    return sendError(res, 'Pesan sudah dipin', 409);
  }

  await status.update({ is_pinned: true });

  sendSuccess(res, 'Pesan berhasil disematkan.');
});

/**
 * Membatalkan sematan pada sebuah pesan.
 */
export const unpinMessage = catchAsync(async (req, res, next) => {
  const { messageStatusId } = req.params;

  const userRoomMembers = await RoomMember.findAll({
    where: { member_id: req.userId, member_type: req.userType },
    attributes: ['room_member_id']
  });
  const userRoomMemberIds = userRoomMembers.map(rm => rm.room_member_id);

  const status = await MessageStatus.findOne({
    where: {
      message_status_id: messageStatusId,
      room_member_id: userRoomMemberIds
    }
  });

  if (!status) {
    return sendError(res, 'Pesan tidak ditemukan', 404);
  }

  if (!status.is_pinned) {
    return sendError(res, 'Pesan ini tidak dalam keadaan disematkan.', 409);
  }

  await status.update({ is_pinned: false });

  sendSuccess(res, 'Sematan pada pesan berhasil dibatalkan.');
});

/**
 * Menampilkan semua pesan yang disematkan dalam sebuah room.
 */
export const getPinnedMessagesByRoom = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;

  const userRoomMember = await RoomMember.findOne({
    where: { room_id: roomId, member_id: req.userId, member_type: req.userType }
  });

  if (!userRoomMember) {
    return sendError(res, 'Anda bukan anggota dari room ini.', 403);
  }

  // 1. Ambil semua status pesan yang disematkan, beserta pesan aslinya
  const pinnedStatuses = await MessageStatus.findAll({
    where: {
      room_member_id: userRoomMember.room_member_id,
      is_pinned: true,
      is_deleted_for_me: false //  Sembunyikan jika sudah dihapus untuk saya
    },
    include: [{
      model: Message,
      as: 'message',
      where: {
        is_deleted_globally: false //  Sembunyikan jika sudah dihapus global
      },
      required: true // Gunakan INNER JOIN untuk memastikan pesan ada & tidak dihapus global
    }],
    order: [['updated_at', 'DESC']]
  });
  
  if (!pinnedStatuses.length) {
      return sendSuccess(res, 'Data pesan yang disematkan berhasil didapatkan', []);
  }

  // 2. Kumpulkan ID pengirim (sama seperti di messageController)
  const senderAdminIds = new Set();
  const senderPesertaIds = new Set();

  pinnedStatuses.forEach(status => {
    if (status.message.sender_type === 'admin') {
      senderAdminIds.add(status.message.sender_id);
    } else {
      senderPesertaIds.add(status.message.sender_id);
    }
  });

  // 3. Ambil data pengirim dalam dua query besar
  const [admins, pesertas] = await Promise.all([
    Admin.findAll({ where: { admin_id: [...senderAdminIds] }, attributes: ['admin_id', 'nama_admin'], raw: true }),
    Peserta.findAll({ where: { user_id: [...senderPesertaIds] }, attributes: ['user_id', 'nama_peserta'], raw: true })
  ]);
  
  // 4. Buat Peta (Map) untuk pencarian cepat
  const adminMap = new Map(admins.map(a => [a.admin_id, a.nama_admin]));
  const pesertaMap = new Map(pesertas.map(p => [p.user_id, p.nama_peserta]));
  
  // 5. Format ulang data respons
  const formattedMessages = pinnedStatuses.map(status => {
      const message = status.message.toJSON();
      const senderName = message.sender_type === 'admin'
        ? adminMap.get(message.sender_id)
        : pesertaMap.get(message.sender_id);
      
      return {
          message_id: message.message_id,
          sender_name: senderName,
          content: message.content,
          created_at: message.created_at,
          message_status: {
              message_status_id: status.message_status_id,
              is_starred: status.is_starred,
              is_pinned: status.is_pinned
          }
      };
  });

  sendSuccess(res, 'Data pesan yang disematkan berhasil didapatkan', formattedMessages);
});
