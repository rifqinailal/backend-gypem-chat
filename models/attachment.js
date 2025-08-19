// File: src/models/Attachment.js

import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Attachment extends Model {
    static associate(models) {
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
    file_path: DataTypes.STRING,
    
    // --- TAMBAHKAN KOLOM VIRTUAL INI ---
    url: {
      type: DataTypes.VIRTUAL,
      get() {
        const filePath = this.getDataValue('file_path');
        const fileType = this.getDataValue('file_type');
        
        if (fileType === 'tautan') return filePath;
        if (filePath) return `${process.env.BASE_URL}/uploads/${filePath}`;
        return null;
      }
    }
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
