import db from "../../models/index.js";
import { Op } from "sequelize";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { catchAsync } from "../utils/catchAsync.js";
import { fetchRoomSummaries } from "../services/roomService.js";

const { Message, Attachment, Admin, Peserta } = db;

export const globalSearch = catchAsync(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 1) {
    return sendError(res, "Parameter wajib diisi dan minimal 1 karakter", 400);
  }

  const allRooms = await fetchRoomSummaries(req.userId, req.userType);

  const matched = allRooms.filter(
    (r) => r.name && r.name.toLowerCase().includes(q.toLowerCase())
  );

  const rooms = await Promise.all(
    matched.map(async (r) => {
      const lastMsg = await Message.findOne({
        where: { room_id: r.room_id, is_deleted_globally: false },
        order: [["created_at", "DESC"]],
        include: [{ model: Attachment, as: "attachment", required: false }],
      });

      let senderName = null;
      if (lastMsg) {
        if (lastMsg.sender_type === "admin") {
          senderName = (await Admin.findByPk(lastMsg.sender_id))?.nama_admin;
        } else {
          senderName = (await Peserta.findByPk(lastMsg.sender_id))
            ?.nama_peserta;
        }
      }

      return {
        room_id: r.room_id,
        room_type: r.room_type,
        room_member_id: r.room_member_id,
        name: r.name,
        url_photo: r.url_photo,
        sender_name: senderName,
        last_message: lastMsg?.content,
        last_message_time: lastMsg?.created_at,
        unread_count: r.unread_count,
        is_pinned: r.is_pinned,
        is_archived: r.is_archived,
      };
    })
  );

  const msgs = await Message.findAll({
    where: { content: { [Op.like]: `%${q}%` } },
    include: [{ model: Attachment, as: "attachment", required: false }],
    order: [["created_at", "DESC"]],
    limit: 50,
  });

  const messages = await Promise.all(
    msgs.map(async (m) => {
      const senderName =
        m.sender_type === "admin"
          ? (await Admin.findByPk(m.sender_id))?.nama_admin
          : (await Peserta.findByPk(m.sender_id))?.nama_peserta;

      return {
        message_id: m.message_id,
        sender_id: m.sender_id,
        sender_name: senderName,
        content: m.content,
        file_type: m.attachment?.file_type || null,
        file_name: m.attachment?.file_path?.split("/").pop() || null,
        created_at: m.created_at,
      };
    })
  );

  return sendSuccess(res, "Data berhasil didapatkan", { rooms, messages }, 200);
});

export const roomSearch = catchAsync(async (req, res) => {
  const q = (req.query.q || "").trim();
  const roomId = Number(req.params.roomId);

  if (q.length < 1) {
    return sendError(res, "Parameter wajib diisi dan minimal 1 karakter", 400);
  }

  const membership = await db.RoomMember.findOne({
    where: {
      room_id: roomId,
      member_id: req.userId,
      member_type: req.userType,
      is_deleted: false,
    },
  });
  if (!membership) {
    return sendError(res, "Anda tidak punya akses ke room ini", 403);
  }

  const msgs = await Message.findAll({
    where: {
      room_id: roomId,
      [Op.or]: [{ content: { [Op.like]: `%${q}%` } }],
    },
    include: [
      {
        model: Attachment,
        as: "attachment",
        required: false,
      },
    ],
    order: [["created_at", "DESC"]],
    limit: 50,
  });

  const messages = await Promise.all(
    msgs.map(async (m) => {
      const senderName =
        m.sender_type === "admin"
          ? (await Admin.findByPk(m.sender_id))?.nama_admin
          : (await Peserta.findByPk(m.sender_id))?.nama_peserta;

      return {
        message_id: m.message_id,
        sender_id: m.sender_id,
        sender_name: senderName,
        content: m.content,
        file_type: m.attachment?.file_type || null,
        file_name: m.attachment?.file_path?.split("/").pop() || null,
        created_at: m.created_at,
      };
    })
  );

  return sendSuccess(res, "Data berhasil didapatkan", { messages }, 200);
});
