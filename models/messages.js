import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Message extends Model {
    static associate(models) {
      // Sebuah Message dikirim di dalam satu Room
      this.belongsTo(models.Room, {
        foreignKey: 'room_id',
        as: 'room'
      });
      // Sebuah Message memiliki satu Attachment
      this.hasOne(models.Attachment, {
        foreignKey: 'message_id',
        as: 'attachment'
      });
      // Sebuah Message memiliki banyak MessageStatus (satu untuk setiap member)
      this.hasMany(models.MessageStatus, {
        foreignKey: 'message_id',
        as: 'statuses'
      });
      // Relasi untuk pesan balasan (self-referencing)
      this.belongsTo(models.Message, {
        foreignKey: 'reply_to_message_id',
        as: 'repliedTo'
      });
    }
  }
  Message.init({
    message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    room_id: DataTypes.INTEGER,
    sender_id: DataTypes.INTEGER,
    sender_type: DataTypes.ENUM('admin', 'peserta'),
    content: DataTypes.TEXT,
    reply_to_message_id: DataTypes.INTEGER,
    is_deleted_globally: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'Messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Message;
};
