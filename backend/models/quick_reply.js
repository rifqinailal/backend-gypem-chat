// File: src/models/QuickReply.js

import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class QuickReply extends Model {
    static associate(models) {
      this.belongsTo(models.Admin, {
        foreignKey: 'admin_id',
        as: 'admin'
      });
    }
  }
  QuickReply.init({
    qreply_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    admin_id: DataTypes.INTEGER,
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: DataTypes.TEXT,
    file_path: DataTypes.STRING,

    // --- TAMBAHKAN KOLOM VIRTUAL INI ---
    file_url: {
        type: DataTypes.VIRTUAL,
        get() {
            const filePath = this.getDataValue('file_path');
            if (filePath) {
                return `${process.env.BASE_URL}/uploads/${filePath}`;
            }
            return null;
        }
    }
  }, {
    sequelize,
    modelName: 'QuickReply',
    tableName: 'Quick_replies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return QuickReply;
};
