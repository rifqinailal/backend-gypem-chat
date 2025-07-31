import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class MessageStatus extends Model {
    static associate(models) {
      // Sebuah MessageStatus merujuk ke satu Message
      this.belongsTo(models.Message, {
        foreignKey: 'message_id',
        as: 'message'
      });
      // Sebuah MessageStatus dimiliki oleh satu RoomMember
      this.belongsTo(models.RoomMember, {
        foreignKey: 'room_member_id',
        as: 'memberStatus'
      });
    }
  }
  MessageStatus.init({
    message_status_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    message_id: DataTypes.INTEGER,
    room_member_id: DataTypes.INTEGER,
    read_at: DataTypes.DATE,
    is_starred: DataTypes.BOOLEAN,
    is_pinned: DataTypes.BOOLEAN,
    is_deleted_for_me: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'MessageStatus',
    tableName: 'Message_statuses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return MessageStatus;
};
