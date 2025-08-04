import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class RoomMember extends Model {
    static associate(models) {
      // Sebuah RoomMember adalah bagian dari satu Room
      this.belongsTo(models.Room, {
        foreignKey: 'room_id',
        as: 'room'
      });
      // Sebuah RoomMember memiliki banyak MessageStatus
      this.hasMany(models.MessageStatus, {
        foreignKey: 'room_member_id',
        as: 'messageStatuses'
      });
      // Relasi polimorfik (diatur di level aplikasi)
      // Anda bisa menambahkan getter untuk mengambil data Admin atau Peserta
    }
  }
  RoomMember.init({
    room_member_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    room_id: DataTypes.INTEGER,
    member_id: DataTypes.INTEGER,
    member_type: DataTypes.ENUM('admin', 'peserta'),
    is_archived: DataTypes.BOOLEAN,
    is_pinned: DataTypes.BOOLEAN,
    is_left: DataTypes.BOOLEAN,
    is_deleted: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'RoomMember',
    tableName: 'Room_members',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return RoomMember;
};
