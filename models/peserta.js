import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Peserta extends Model {
    static associate(models) {
      // Peserta tidak memiliki relasi keluar langsung,
      // keterlibatannya di room diwakili oleh RoomMember
    }
  }
  Peserta.init({
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nama_peserta: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url_profile_photo: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Peserta',
    tableName: 'Pesertas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Peserta;
};