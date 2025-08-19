import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class RoomDescription extends Model {
    static associate(models) {
      // Sebuah RoomDescription dimiliki oleh satu Room
      this.belongsTo(models.Room, {
        foreignKey: 'room_id',
        as: 'room'
      });
    }
  }
  RoomDescription.init({
    room_desc_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    room_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    url_photo: DataTypes.STRING,
    invitation_link: {
      type: DataTypes.STRING,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'RoomDescription',
    tableName: 'Room_descriptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return RoomDescription;
};
