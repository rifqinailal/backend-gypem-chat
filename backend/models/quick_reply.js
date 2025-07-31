import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class QuickReply extends Model {
    static associate(models) {
      // Sebuah QuickReply dimiliki oleh satu Admin
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
    file_path: DataTypes.STRING
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