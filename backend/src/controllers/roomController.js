import db from "../../models/index.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Op } from "sequelize";
import { fetchRoomSummaries } from "../services/roomService.js";
import crypto from "crypto";

const { Room, RoomDescription, RoomMember, sequelize } = db;

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
      { model: Room, as: "room" },
      { model: RoomDescription, as: "room", include: [] },
    ],
  });
  if (!membership) return sendError(res, "Grup tidak ditemukan", 403);

  const room = await Room.findByPk(roomId);
  const description = await RoomDescription.findOne({
    where: { room_id: roomId },
  });
  const members = await RoomMember.findAll({
    where: { room_id: roomId, is_deleted: false },
  });

  sendSuccess(
    res,
    "Data berhasil didapatkan",
    { room, description, members },
    200
  );
});

// Buat room one-to-one
export const createPrivateRoom = catchAsync(async (req, res) => {
  const { target_admin_id } = req.body;
  const userId = req.userId;
  const userType = req.userType;

  if (!target_admin_id) {
    return sendError(res, "Room gagal dibuat", 400);
  }

  if (userType == "admin") {
    return sendError(res, "Anda tidak punya akses", 403);
  }

  // cek duplikat
  const exists = await Room.findOne({
    where: { room_type: "one_to_one" },
    include: [
      {
        model: RoomMember,
        as: "members",
        where: { member_id: { [Op.in]: [req.userId, target_admin_id] } },
      },
    ],
  });
  if (exists) {
    return sendError(res, "Room sudah ada", 409);
  }

  // transaksi untuk room + members
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
        },
        {
          room_id: room.room_id,
          member_id: target_admin_id,
          member_type: "admin",
        },
      ],
      { transaction }
    );

    await transaction.commit();
    return sendSuccess(res, "One‑to‑one room berhasil dibuat", null, 201);
  } catch (err) {
    await transaction.rollback();
    return sendError(res, "Room gagal dibuat", 400);
  }
});

// Buat group baru
export const createGroupRoom = catchAsync(async (req, res) => {
  const { name, description } = req.body;
  const file = req.file;
  const userType = req.userType;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return sendError(res, "Grup gagal dibuat", 400);
  }

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
    return sendError(res, "Grup gagal dibuat", 400);
  }
});

// Edit room group
export const editGroupRoom = catchAsync(async (req, res) => {
  const { roomId } = req.params;
  const { name, description } = req.body;
  const file = req.file;
  const userType = req.userType;

  if (userType == "peserta") {
    return sendError(res, "Anda tidak punya akses", 403);
  }

  const desc = await RoomDescription.findOne({ where: { room_id: roomId } });
  if (!desc) return sendError(res, "Grup tidak ditemukan", 404);

  desc.name = name;
  desc.description = description;
  if (file) desc.url_photo = file.filename;
  await desc.save();

  sendSuccess(res, "Grup berhasil diperbarui", null, 200);
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
  sendSuccess(res, "Berhasil keluar ke grup", null, 200);
});

// Delete room (multiple)
export const deleteRooms = catchAsync(async (req, res) => {
  let { room_member_id } = req.body;
  
  if (
    room_member_id === undefined ||
    room_member_id === null ||
    room_member_id === ""
  ) {
    return sendError(res, "Tidak ada room yang dipilih untuk dihapus", 400);
  }

  if (!Array.isArray(room_member_id)) {
    room_member_id = [room_member_id];
  }

  if (room_member_id.length === 0) {
    return sendError(res, "Tidak ada room yang dipilih untuk dihapus", 400);
  }

  const members = await RoomMember.findAll({
    where: {
      room_member_id: { [Op.in]: room_member_id },
      member_id: req.userId,
      member_type: req.userType,
      is_deleted: false,
    },
  });

  if (members.length === 0) {
    return sendError(res, "Room tidak ditemukan", 404);
  }

  for (const m of members) {
    const room = await db.Room.findByPk(m.room_id);
    if (room.room_type === "group" && !m.is_left) {
      return sendError(res, `Anda harus keluar grup sebelum menghapusnya`, 403);
    }
  }

  await RoomMember.update(
    { is_deleted: true },
    { where: { room_member_id: { [Op.in]: room_member_id } } }
  );

  sendSuccess(res, "Room berhasil dihapus", null, 200);
});

/**
 * Pin multiple rooms untuk current user (max 5).
 */
export const pinRooms = catchAsync(async (req, res) => {
  let { room_member_id } = req.body;

  if (
    room_member_id === undefined ||
    room_member_id === null ||
    room_member_id === ""
  ) {
    return sendError(res, "Tidak ada room yang dipilih untuk disematkan", 400);
  }

  if (!Array.isArray(room_member_id)) {
    room_member_id = [room_member_id];
  }

  if (room_member_id.length === 0) {
    return sendError(res, "Tidak ada room yang dipilih untuk disematkan", 400);
  }

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

  return sendSuccess(res, "Chat berhasil disematkan", null, 200);
});

export const unpinRooms = catchAsync(async (req, res) => {
  let { room_member_id } = req.body;

  if (
    room_member_id === undefined ||
    room_member_id === null ||
    room_member_id === ""
  ) {
    return sendError(
      res,
      "Tidak ada room yang dipilih untuk dibatalkan pin",
      400
    );
  }

  if (!Array.isArray(room_member_id)) {
    room_member_id = [room_member_id];
  }

  if (room_member_id.length === 0) {
    return sendError(
      res,
      "Tidak ada room yang dipilih untuk dibatalkan pin",
      400
    );
  }

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

  return sendSuccess(res, "Pin chat berhasil dibatalkan", null, 200);
});

export const getPinnedRooms = catchAsync(async (req, res) => {
  const all = await fetchRoomSummaries(req.userId, req.userType);
  const pinned = all.filter((r) => r.is_pinned);

  return sendSuccess(res, "Data berhasil didapatkan", pinned, 200);
});
