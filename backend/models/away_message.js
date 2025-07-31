import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class AwayMessage extends Model {
    static associate(models) {
      // Sebuah AwayMessage dimiliki oleh satu Admin
      this.belongsTo(models.Admin, {
        foreignKey: 'admin_id',
        as: 'admin'
      });
    }
  }
  AwayMessage.init({
    away_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    admin_id: DataTypes.INTEGER,
    content: DataTypes.TEXT,
    start_time: DataTypes.DATE,
    end_time: DataTypes.DATE,
    actived: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'AwayMessage',
    tableName: 'Away_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return AwayMessage;
};
