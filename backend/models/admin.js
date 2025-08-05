import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Admin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Admin memiliki banyak AwayMessage
      this.hasMany(models.AwayMessage, {
        foreignKey: 'admin_id',
        as: 'awayMessages'
      });
      // Admin memiliki banyak QuickReply
      this.hasMany(models.QuickReply, {
        foreignKey: 'admin_id',
        as: 'quickReplies'
      });
    }
  }
  Admin.init({
    admin_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nama_admin: {
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
    bio: DataTypes.TEXT,
    url_profile_photo: DataTypes.STRING,
    actived: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    timezone: {
      type: DataTypes.ENUM('WIB', 'WIT', 'WITA'),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Admin',
    tableName: 'Admins',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Admin;
};
