import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Room extends Model {
    static associate(models) {
      // Sebuah Room (jika tipe 'group') memiliki satu RoomDescription
      this.hasOne(models.RoomDescription, {
        foreignKey: 'room_id',
        as: 'description'
      });
      // Sebuah Room memiliki banyak RoomMember
      this.hasMany(models.RoomMember, {
        foreignKey: 'room_id',
        as: 'members'
      });
      // Sebuah Room memiliki banyak Message
      this.hasMany(models.Message, {
        foreignKey: 'room_id',
        as: 'messages'
      });
    }
  }
  Room.init({
    room_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    room_type: {
      type: DataTypes.ENUM('one_to_one', 'group'),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Room',
    tableName: 'Rooms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Room;
};