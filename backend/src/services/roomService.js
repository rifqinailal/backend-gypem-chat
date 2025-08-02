import db from "../../models/index.js";
import { Op } from "sequelize";

const { Room, RoomDescription, RoomMember, Message, MessageStatus, Admin, Peserta } = db;

/**
 * Ambil summary info semua room yang user ikutin.
 */
export async function fetchRoomSummaries(userId, userType) {
  // get all memberships
  const memberships = await RoomMember.findAll({
    where: { member_id: userId, member_type: userType, is_deleted: false },
    include: [
      {
        model: Room,
        as: "room",
        include: [
          { model: RoomDescription, as: "description" },
          { model: RoomMember, as: "members", where: { is_deleted: false } },
        ],
      },
    ],
    order: [
      ["is_pinned", "DESC"],
      ["updated_at", "DESC"],
    ],
  });

  return Promise.all(
    memberships.map(async (m) => {
      const room = m.room;

      // menentukan nama room berdasarkan tipe user dan tipe room
      let displayName = null;
      if (room.room_type === "group") {
        displayName = room.description?.name;
      }
      else {
        const otherMember = room.members.find(rm => rm.member_id !== userId);
        if (otherMember) {
          if (otherMember.member_type === "admin") {
            const admin = await Admin.findByPk(otherMember.member_id);
            displayName = admin?.nama_admin || null;
          } else {
            const peserta = await Peserta.findByPk(otherMember.member_id);
            displayName = peserta?.nama_peserta || null;
          }
        }
      }

      // cari pesan terakhir di room ini
      const lastMsg = await Message.findOne({
        where: { room_id: m.room_id, is_deleted_globally: false },
        order: [["created_at", "DESC"]],
        limit: 1,
      });

      // hitung jumlah pesan yang belum dibaca sama member ini
      const unreadCount = await MessageStatus.count({
        where: {
          room_member_id: m.room_member_id,
          read_at: { [Op.is]: null },
          is_deleted_for_me: false,
        },
      });

      return {
        room_id: room.room_id,
        room_member_id: m.room_member_id,
        room_type: room.room_type,
        name: displayName,
        description: room.description?.description || null,
        url_photo: room.description?.url_photo || null,
        last_message: lastMsg?.content,
        last_time: lastMsg?.created_at,
        unread_count: unreadCount,
        is_archived: m.is_archived,
        is_pinned: m.is_pinned,
      };
    })
  );
}
