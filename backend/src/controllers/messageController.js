// =================================================================
// File: src/controllers/messageController.js
// Tujuan: Menangani logika bisnis inti untuk pesan.
// =================================================================
import db from '../../models/index.js';

import { Op } from 'sequelize';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const Message = db.Message;
const MessageStatus = db.MessageStatus;
const RoomMember = db.RoomMember;
const Attachment = db.Attachment;

export const sendMessage = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;
  const { content, reply_to_message_id } = req.body;
  
  const senderId = req.userId;
  const senderType = req.userType;

  const t = await db.sequelize.transaction();

  try {
    const newMessage = await Message.create({
      room_id: roomId,
      sender_id: senderId,
      sender_type: senderType,
      content,
      reply_to_message_id
    }, { transaction: t });

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
    
    sendSuccess(res, 'Pesan berhasil dikirim', newMessage, 201);
  } catch (error) {
    await t.rollback();
    console.error("Error saat mengirim pesan:", error); 
    return sendError(res, 'Gagal mengirim pesan', 500);
  }
});

export const getMessagesByRoom = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;

  // --- PERBAIKAN KUNCI DI SINI ---
  // Pastikan kita menggunakan req.userId dan req.userType yang sudah disiapkan middleware
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
        as: 'attachment'
      },
      {
        model: MessageStatus,
        as: 'statuses',
        where: { room_member_id: userRoomMember.room_member_id , is_deleted_for_me: false },
        required: false
      }
    ],
    order: [['created_at', 'ASC']]
  });

  sendSuccess(res, 'Data pesan berhasil didapatkan', messages);
});

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

export const deleteMessageForMe = catchAsync(async (req, res, next) => {
    const { message_status_ids } = req.body;

    const userRoomMembers = await RoomMember.findAll({
        where: { member_id: req.userId, member_type: req.userType },
        attributes: ['room_member_id']
    });
    const userRoomMemberIds = userRoomMembers.map(rm => rm.room_member_id);

    await MessageStatus.update(
        { is_deleted_for_me: true },
        {
            where: {
                message_status_id: { [Op.in]: message_status_ids },
                room_member_id: { [Op.in]: userRoomMemberIds }
            }
        }
    );
    
    sendSuccess(res, 'Pesan berhasil dihapus dari tampilan Anda.');
});

export const deleteMessageGlobally = catchAsync(async (req, res, next) => {
    const { message_id } = req.body;

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

    await message.update({ is_deleted_globally: true });

    sendSuccess(res, 'Pesan berhasil dihapus untuk semua orang.');
});

