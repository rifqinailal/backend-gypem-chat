import db from '../../models/index.js';
import { Op } from 'sequelize';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const Message = db.Message;
const MessageStatus = db.MessageStatus;
const RoomMember = db.RoomMember;
const Attachment = db.Attachment;
const Admin = db.Admin; 
const Peserta = db.Peserta; 

export const sendMessage = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;
  const { content } = req.body;
  const senderId = req.userId;
  const senderType = req.userType;

  let messageContent = content;
  let attachmentData = null;

  const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*|www\.[^\s$.?#].[^\s]*)$/i;

 
  if (req.file) {
    messageContent = content || req.file.originalname;
    
    let fileType = 'dokumen';
    if (req.file.mimetype.startsWith('image')) {
      fileType = 'image';
    }
    
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    attachmentData = {
      file_type: fileType,
      file_path: req.file.filename 
    };
  } 
  else if (content && urlRegex.test(content)) {
    messageContent = content;
    attachmentData = {
      file_type: 'tautan',
      file_path: content 
    };
  }


  if (!messageContent && !req.file) {
    return sendError(res, 'Konten pesan tidak boleh kosong', 400);
  }

  const t = await db.sequelize.transaction();
  try {
    const newMessage = await Message.create({
      room_id: roomId,
      sender_id: senderId,
      sender_type: senderType,
      content: messageContent,
      reply_to_message_id: req.body.reply_to_message_id || null
    }, { transaction: t });

    if (attachmentData) {
      await Attachment.create({
        message_id: newMessage.message_id,
        ...attachmentData
      }, { transaction: t });
    }

    const members = await RoomMember.findAll({
      where: { room_id: roomId },
      attributes: ['room_member_id', 'member_id', 'member_type'],
      transaction: t
    });

    const statusesToCreate = members.map(member => {
      const isSender = member.member_id === senderId && member.member_type === senderType;
      return {
        message_id: newMessage.message_id,
        room_member_id: member.room_member_id,
        read_at: isSender ? new Date() : null
      };
    });

    await MessageStatus.bulkCreate(statusesToCreate, { transaction: t });

    await t.commit();
    
    const finalMessage = await Message.findByPk(newMessage.message_id, {
      include: 'attachment'
    });

    sendSuccess(res, 'Pesan berhasil dikirim', finalMessage, 201);
  } catch (error) {
    await t.rollback();
    console.error("Error saat mengirim pesan:", error); 
    return sendError(res, 'Gagal mengirim pesan', 500);
  }
});

//Api membaca pesan
export const readMessages = catchAsync(async (req, res, next) => {
    const { message_status_ids } = req.body;
    
    const userRoomMembers = await RoomMember.findAll({
        where: { member_id: req.userId, member_type: req.userType },
        attributes: ['room_member_id']
    });
    const userRoomMemberIds = userRoomMembers.map(rm => rm.room_member_id);

    await MessageStatus.update(
        { read_at: new Date() },
        {
            where: {
                message_status_id: { [Op.in]: message_status_ids },
                room_member_id: { [Op.in]: userRoomMemberIds },
                read_at: null
            }
        }
    );

    sendSuccess(res, 'Pesan berhasil ditandai sebagai dibaca.');
});


//menghapus pesan untuk saya
export const deleteMessageForMe = catchAsync(async (req, res, next) => {
    const { message_status_ids } = req.body;

    // 1. Dapatkan semua ID keanggotaan room milik user
    const userRoomMembers = await RoomMember.findAll({
        where: { member_id: req.userId, member_type: req.userType },
        attributes: ['room_member_id']
    });
    const userRoomMemberIds = userRoomMembers.map(rm => rm.room_member_id);

    // 2. Cek status pesan yang ingin dihapus
    const statusesToDelete = await MessageStatus.findAll({
        where: {
            message_status_id: { [Op.in]: message_status_ids },
            room_member_id: { [Op.in]: userRoomMemberIds } // Pastikan hanya milik user
        }
    });

    // Jika tidak ada satupun status yang ditemukan (ID salah atau bukan milik user)
    if (statusesToDelete.length === 0) {
        return sendError(res, 'Pesan tidak ditemukan atau Anda tidak memiliki akses.', 404); // 404 lebih cocok di sini
    }

    // 3. Cek untuk 409 Conflict: Apakah SEMUA pesan yang dipilih sudah dihapus?
    const allAlreadyDeleted = statusesToDelete.every(status => status.is_deleted_for_me === true);
    if (allAlreadyDeleted) {
        return sendError(res, 'Pesan sudah dihapus.', 409);
    }

    // 4. Lakukan update
    await MessageStatus.update(
        { is_deleted_for_me: true },
        {
            where: {
                // Hanya update ID yang ada di daftar yang sudah kita verifikasi
                message_status_id: { [Op.in]: statusesToDelete.map(s => s.message_status_id) }
            }
        }
    );
    
    sendSuccess(res, 'Pesan berhasil dihapus dari tampilan Anda.');
});

//menghapus pesan untuk semua
export const deleteMessageGlobally = catchAsync(async (req, res, next) => {
    const { message_id } = req.body;

    // 1. Cari pesan untuk memastikan pengirimnya adalah user yang sedang login
    const message = await Message.findOne({
        where: {
            message_id: message_id,
            sender_id: req.userId,
            sender_type: req.userType
        }
    });

    if (!message) {
        return sendError(res, 'Pesan tidak ditemukan atau Anda bukan pengirimnya.', 403);
    }

    // 2. Cek untuk 409 Conflict: Apakah pesan sudah dihapus secara global?
    if (message.is_deleted_globally) {
        return sendError(res, 'Pesan sudah dihapus.', 409);
    }

    // 3. Lakukan update
    await message.update({ is_deleted_globally: true });

    sendSuccess(res, 'Pesan berhasil dihapus untuk semua orang.');
});


//menampilkan pesan berdasarkan room
export const getMessagesByRoom = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;

  const userRoomMember = await RoomMember.findOne({
    where: { room_id: roomId, member_id: req.userId, member_type: req.userType }
  });

  if (!userRoomMember) {
    return sendError(res, 'Anda bukan anggota dari room ini.', 403);
  }

  const messages = await Message.findAll({
    where: {
      room_id: roomId,
      is_deleted_globally: false
    },
    include: [
      { model: Attachment, as: 'attachment' },
      {
        model: MessageStatus,
        as: 'statuses',
        where: { room_member_id: userRoomMember.room_member_id, is_deleted_for_me: false },
        required: false
      }
    ],
    order: [['created_at', 'ASC']]
  });
  
  // Proses pesan untuk mendapatkan format yang diinginkan
  const groupedMessages = await processAndGroupMessages(messages);

  sendSuccess(res, 'Data pesan berhasil didapatkan', groupedMessages);
});


//menampilkan pesan berdasarkan type
export const getMessagesByType = catchAsync(async (req, res, next) => {
  const { roomId, type } = req.params;

  const userRoomMember = await RoomMember.findOne({
    where: { room_id: roomId, member_id: req.userId, member_type: req.userType }
  });

  if (!userRoomMember) {
    return sendError(res, 'Anda bukan anggota dari room ini.', 403);
  }

  const messages = await Message.findAll({
    where: {
      room_id: roomId,
      is_deleted_globally: false
    },
    include: [
      {
        model: Attachment,
        as: 'attachment',
        where: { file_type: type },
        required: true
      },
      {
        model: MessageStatus,
        as: 'statuses',
        where: { room_member_id: userRoomMember.room_member_id, is_deleted_for_me: false },
        required: false
      }
    ],
    order: [['created_at', 'ASC']]
  });
  
  // Proses pesan untuk mendapatkan format yang diinginkan
  const groupedMessages = await processAndGroupMessages(messages);

  sendSuccess(res, `Data pesan dengan tipe '${type}' berhasil didapatkan`, groupedMessages);
});


//helper
const processAndGroupMessages = async (messages) => {
  if (!messages.length) {
    return [];
  }

  // 1. Kumpulkan semua ID yang dibutuhkan untuk menghindari query berulang (N+1 problem)
  const senderAdminIds = new Set();
  const senderPesertaIds = new Set();
  const replyMessageIds = new Set();

  messages.forEach(msg => {
    if (msg.sender_type === 'admin') senderAdminIds.add(msg.sender_id);
    if (msg.sender_type === 'peserta') senderPesertaIds.add(msg.sender_id);
    if (msg.reply_to_message_id) replyMessageIds.add(msg.reply_to_message_id);
  });

  // 2. Ambil semua data yang dibutuhkan dalam beberapa query besar
  const [admins, pesertas, repliedMessages] = await Promise.all([
    Admin.findAll({ where: { admin_id: [...senderAdminIds] }, attributes: ['admin_id', 'nama_admin'], raw: true }),
    Peserta.findAll({ where: { user_id: [...senderPesertaIds] }, attributes: ['user_id', 'nama_peserta'], raw: true }),
    Message.findAll({ where: { message_id: [...replyMessageIds] }, raw: true })
  ]);

  // 3. Buat Peta (Map) untuk pencarian cepat
  const adminMap = new Map(admins.map(a => [a.admin_id, a.nama_admin]));
  const pesertaMap = new Map(pesertas.map(p => [p.user_id, p.nama_peserta]));
  const repliedMessageMap = new Map(repliedMessages.map(m => [m.message_id, m]));

  // 4. Format ulang setiap pesan
  const formattedMessages = messages.map(msg => {
    const messageJson = msg.toJSON(); // Konversi instance Sequelize ke objek biasa
    
    // Tambahkan nama pengirim
    messageJson.sender_name = messageJson.sender_type === 'admin'
      ? adminMap.get(messageJson.sender_id)
      : pesertaMap.get(messageJson.sender_id);
      
    // Tambahkan info balasan (reply) jika ada
    if (messageJson.reply_to_message_id) {
      const repliedMsg = repliedMessageMap.get(messageJson.reply_to_message_id);
      if (repliedMsg) {
        messageJson.reply_to_message = {
          reply_to_message_id: repliedMsg.message_id,
          sender_name: repliedMsg.sender_type === 'admin'
            ? adminMap.get(repliedMsg.sender_id)
            : pesertaMap.get(repliedMsg.sender_id),
          content: repliedMsg.content
        };
      }
    }
    
    // Ambil hanya status yang relevan (untuk user ini)
    messageJson.message_status = messageJson.statuses.length > 0 ? messageJson.statuses[0] : null;
    delete messageJson.statuses; // Hapus array statuses yang tidak perlu

    return messageJson;
  });

  // 5. Kelompokkan pesan berdasarkan tanggal
  const groupedByDate = formattedMessages.reduce((acc, msg) => {
    const date = msg.created_at.toISOString().split('T')[0]; // Ambil tanggalnya saja, e.g., '2025-07-31'
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(msg);
    return acc;
  }, {});

  // Kembalikan sebagai array dari array
  return Object.values(groupedByDate);
};