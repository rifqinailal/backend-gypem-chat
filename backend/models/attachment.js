import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Attachment extends Model {
    static associate(models) {
      // Sebuah Attachment dimiliki oleh satu Message
      this.belongsTo(models.Message, {
        foreignKey: 'message_id',
        as: 'message'
      });
    }
  }
  Attachment.init({
    attachment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    message_id: DataTypes.INTEGER,
    file_type: DataTypes.ENUM('dokumen', 'image', 'tautan'),
    file_path: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Attachment',
    tableName: 'Attachments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Attachment;
};
