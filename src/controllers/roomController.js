import db from "../../models/index.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Op } from "sequelize";
import { fetchRoomSummaries } from "../services/roomService.js";
import crypto from "crypto";

const { Room, RoomDescription, RoomMember, Message, MessageStatus, sequelize } = db;

// Menampilkan semua room
export const getAllRooms = catchAsync(async (req, res) => {
  const data = await fetchRoomSummaries(req.userId, req.userType);
  sendSuccess(res, "Data berhasil didapatkan", data, 200);
});

// Menampilkan detail room
export const getRoomDetail = catchAsync(async (req, res) => {
  const { roomId } = req.params;
  const membership = await RoomMember.findOne({
    where: { room_id: roomId, member_id: req.userId, is_deleted: false },
    include: [
      {
        model: Room,
        as: "room",
        include: [{ model: RoomDescription, as: "description" }],
      },
    ],
  });
  if (!membership) return sendError(res, "Grup tidak ditemukan", 403);

  const { room } = membership;
  const description = room.description;
  const members = await RoomMember.findAll({
    where: { room_id: roomId, is_deleted: false },
  });

  sendSuccess(
    res,
    "Data berhasil didapatkan",
    { room, members },
    200
  );
});

// Buat room one-to-one
export const createPrivateRoom = catchAsync(async (req, res, next) => {
  const { target_admin_id } = req.body;
  const userId = req.userId;
  const userType = req.userType;

  // Admin tidak boleh memulai percakapan one-to-one
  if (userType === "admin") {
    return sendError(res, "Anda tidak punya akses", 403);
  }

  // Check for existing one-to-one room between these specific two users
  const currentUserRooms = await RoomMember.findAll({
    where: {
      member_id: userId,
    },
    include: [
      {
        model: Room,
        as: "room",
        where: { room_type: "one_to_one" },
        required: true,
      },
    ],
    attributes: ['room_id'],
  });

  let exists = null;
  
  if (currentUserRooms.length > 0) {
    const roomIds = currentUserRooms.map(rm => rm.room_id);
    const targetAdminInSameRoom = await RoomMember.findOne({
      where: {
        room_id: { [Op.in]: roomIds },
        member_id: target_admin_id,
        member_type: "admin",
      },
      include: [
        {
          model: Room,
          as: "room",
          include: [
            {
              model: RoomMember,
              as: "members",
              attributes: ['room_member_id', 'member_id', 'member_type', 'is_deleted', 'is_left', 'is_archived'],
            },
          ],
        },
      ],
    });

    if (targetAdminInSameRoom) {
      exists = targetAdminInSameRoom.room;
    }
  }

  if (exists) {
    // Check if current user has deleted this room
    const currentUserMembership = exists.members.find(m => m.member_id === userId);
    
    if (currentUserMembership && currentUserMembership.is_deleted) {
      // Restore the room for the current user
      currentUserMembership.is_deleted = false;
      currentUserMembership.is_left = false;
      currentUserMembership.is_archived = false;
      await currentUserMembership.save();
      
      return sendSuccess(
        res,
        "One-to-one room berhasil dibuat",
        { room_id: exists.room_id },
        201
      );
    } else {
      // Room already exists and is active
      return sendError(res, "Room sudah ada", 409);
    }
  }

  // transaksi untuk room + members - create new room
  const transaction = await sequelize.transaction();
  try {
    const room = await Room.create(
      { room_type: "one_to_one" },
      { transaction }
    );
    await RoomMember.bulkCreate(
      [
        { 
          room_id: room.room_id, 
          member_id: userId, 
          member_type: userType,
          is_deleted: false,
          is_left: false,
          is_archived: false,
          is_pinned: false
        },
        {
          room_id: room.room_id,
          member_id: target_admin_id,
          member_type: "admin",
          is_deleted: false,
          is_left: false,
          is_archived: false,
          is_pinned: false
        },
      ],
      { transaction }
    );
    await transaction.commit();
    return sendSuccess(res, "One-to-one room berhasil dibuat", 
      { room_id: room.room_id }, 201);
  } catch (err) {
    await transaction.rollback();
    return next(err);
  }
});

// Buat group baru
export const createGroupRoom = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  const file = req.file;
  const userType = req.userType;

  // Hanya admin yang boleh membuat grup
  if (userType === "peserta") {
    return sendError(res, "Anda tidak punya akses", 403);
  }

  // cek duplikat nama
  const exist = await RoomDescription.findOne({ where: { name } });
  if (exist) {
    return sendError(res, "Grup sudah ada", 409);
  }

  const transaction = await sequelize.transaction();
  try {
    const room = await Room.create({ room_type: "group" }, { transaction });
    const photoUrl = file ? file.filename : null;
    const desc = await RoomDescription.create(
      {
        room_id: room.room_id,
        name,
        description,
        url_photo: photoUrl,
        invitation_link: "",
      },
      { transaction }
    );

    const randomChars = crypto.randomBytes(3).toString("hex");
    const token = `${desc.room_desc_id}${room.room_id}${randomChars}`;
    desc.invitation_link = token;
    await desc.save({ transaction });

    // Pembuat grup otomatis join
    await RoomMember.create(
      {
        room_id: room.room_id,
        member_id: req.userId,
        member_type: req.userType,
        is_archived: false,
        is_pinned: false,
        is_deleted: false,
      },
      { transaction }
    );

    await transaction.commit();
    const fullLink = `${process.env.BASE_URL}/rooms/join?token=${token}`;
    return sendSuccess(
      res,
      "Grup berhasil dibuat",
      { room_id: room.room_id, invite_link: fullLink },
      201
    );
  } catch (err) {
    await transaction.rollback();
    return next(err);
  }
});

// Edit room group
export const editGroupRoom = catchAsync(async (req, res) => {
  const { roomId } = req.params;
  const { name, description } = req.body;
  const file = req.file;
  const userType = req.userType;

  // Hanya admin yang boleh edit grup
  if (userType === "peserta") {
    return sendError(res, "Anda tidak punya akses", 403);
  }

  const desc = await RoomDescription.findOne({ where: { room_id: roomId } });
  if (!desc) return sendError(res, "Grup tidak ditemukan", 404);

  desc.name = name;
  desc.description = description;
  if (file) desc.url_photo = file.filename;
  await desc.save();

  sendSuccess(res, "Grup berhasil diperbarui");
});

// Join group
export const joinGroup = catchAsync(async (req, res) => {
  const { token } = req.query;
  const desc = await RoomDescription.findOne({
    where: { invitation_link: token },
  });
  if (!desc) return sendError(res, "Group tidak ditemukan", 404);

  const existing = await RoomMember.findOne({
    where: {
      room_id: desc.room_id,
      member_id: req.userId,
      member_type: req.userType,
    },
  });

  if (existing) {
    if (existing.is_deleted) {
      existing.is_deleted = false;
      existing.is_left = false;
      existing.is_archived = false;
      existing.is_pinned = false;
      await existing.save();
      return sendSuccess(
        res,
        "Berhasil bergabung ke grup",
        { room_id: desc.room_id, room_name: desc.name },
        200
      );
    }
    return sendError(res, "Anda sudah berada di dalam grup", 409);
  }

  await RoomMember.create({
    room_id: desc.room_id,
    member_id: req.userId,
    member_type: req.userType,
    is_deleted: false,
    is_left: false,
    is_archived: false,
    is_pinned: false,
  });
  sendSuccess(
    res,
    "Berhasil bergabung ke grup",
    { room_id: desc.room_id, room_name: desc.name },
    200
  );
});

// Keluar group
export const leaveGroup = catchAsync(async (req, res) => {
  const { roomMemberId } = req.params;
  const member = await RoomMember.findByPk(roomMemberId);
  if (!member) return sendError(res, "Grup tidak ditemukan", 404);
  if (member.is_left) {
    return sendError(res, "Anda sudah keluar grup", 409);
  }
  if (member.member_id !== req.userId) {
    return sendError(res, "Anda tidak punya akses", 403);
  }

  member.is_left = true;
  await member.save();
  sendSuccess(res, "Berhasil keluar ke grup");
});

// Delete room (multiple)
export const deleteRooms = catchAsync(async (req, res) => {
  let { room_member_id } = req.body;

  if (!Array.isArray(room_member_id)) {
    room_member_id = [room_member_id];
  }
  room_member_id = room_member_id.map((id) => {
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) {
      throw new Error("Invalid room_member_id");
    }
    return n;
  });

  const members = await RoomMember.findAll({
    where: {
      room_member_id: { [Op.in]: room_member_id },
      member_id: req.userId,
      member_type: req.userType,
      is_deleted: false,
    },
    include: [
      {
        model: Room,
        as: "room",
      },
    ],
  });

  if (members.length === 0) {
    return sendError(res, "Room tidak ditemukan", 404);
  }

  const transaction = await sequelize.transaction();

  try {
    for (const member of members) {
      const room = member.room;

      if (room.room_type === "group" && !member.is_left) {
        await transaction.rollback();
        return sendError(
          res,
          "Anda harus keluar grup sebelum menghapusnya",
          403
        );
      }

      // Mark room as deleted for the user
      member.is_deleted = true;
      await member.save({ transaction });

      // For one-to-one rooms, mark all messages as deleted for this user
      if (room.room_type === "one_to_one") {
        // Find all messages in this room
        const messages = await Message.findAll({
          where: { room_id: room.room_id },
          transaction,
        });

        // For each message, update or create MessageStatus
        for (const message of messages) {
          const [messageStatus, created] = await MessageStatus.findOrCreate({
            where: {
              message_id: message.message_id,
              room_member_id: member.room_member_id,
            },
            defaults: {
              message_id: message.message_id,
              room_member_id: member.room_member_id,
              is_deleted_for_me: true,
              read_at: null,
              is_starred: false,
              is_pinned: false,
            },
            transaction,
          });

          if (!created) {
            messageStatus.is_deleted_for_me = true;
            await messageStatus.save({ transaction });
          }
        }
      }
    }

    await transaction.commit();
    sendSuccess(res, "Room berhasil dihapus");
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
});

/**
 * Pin multiple rooms untuk current user (max 5).
 */
export const pinRooms = catchAsync(async (req, res) => {
  let { room_member_id } = req.body;

  if (!Array.isArray(room_member_id)) {
    room_member_id = [room_member_id];
  }
  room_member_id = room_member_id.map((id) => {
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) {
      throw new Error("Invalid room_member_id");
    }
    return n;
  });

  const currentPins = await RoomMember.count({
    where: {
      member_id: req.userId,
      member_type: req.userType,
      is_deleted: false,
      is_pinned: true,
    },
  });

  if (currentPins + room_member_id.length > 5) {
    return sendError(res, "Gagal, batas maksimal 5 pin telah tercapai.", 403);
  }

  const [updated] = await RoomMember.update(
    { is_pinned: true },
    {
      where: {
        room_member_id: { [Op.in]: room_member_id },
        member_id: req.userId,
        member_type: req.userType,
        is_deleted: false,
        is_pinned: false,
      },
    }
  );

  if (updated === 0) {
    const anyFound = await RoomMember.findOne({
      where: {
        room_member_id: { [Op.in]: room_member_id },
        member_id: req.userId,
        member_type: req.userType,
        is_deleted: false,
      },
    });
    if (anyFound && anyFound.is_pinned) {
      return sendError(res, "Room sudah dipin", 409);
    }
    return sendError(res, "Room tidak ditemukan", 404);
  }

  return sendSuccess(res, "Chat berhasil disematkan");
});

export const unpinRooms = catchAsync(async (req, res) => {
  let { room_member_id } = req.body;

  if (!Array.isArray(room_member_id)) {
    room_member_id = [room_member_id];
  }
  room_member_id = room_member_id.map((id) => {
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) {
      throw new Error("Invalid room_member_id");
    }
    return n;
  });

  const [updated] = await RoomMember.update(
    { is_pinned: false },
    {
      where: {
        room_member_id: { [Op.in]: room_member_id },
        member_id: req.userId,
        member_type: req.userType,
        is_deleted: false,
        is_pinned: true,
      },
    }
  );

  if (updated === 0) {
    const anyFound = await RoomMember.findOne({
      where: {
        room_member_id: { [Op.in]: room_member_id },
        member_id: req.userId,
        member_type: req.userType,
        is_deleted: false,
      },
    });
    if (anyFound && !anyFound.is_pinned) {
      return sendError(res, "Room sudah unpin", 409);
    }
    return sendError(res, "Room tidak ditemukan", 404);
  }

  return sendSuccess(res, "Pin chat berhasil dibatalkan");
});

export const getPinnedRooms = catchAsync(async (req, res) => {
  const all = await fetchRoomSummaries(req.userId, req.userType);
  const pinned = all.filter((r) => r.is_pinned);

  return sendSuccess(res, "Data berhasil didapatkan", pinned, 200);
});
