'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Room_members', {
      room_member_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Rooms',
          key: 'room_id'
        },
      },
      member_id: { // Merujuk ke admin_id atau user_id
        type: Sequelize.INTEGER,
        allowNull: false
      },
      member_type: {
        type: Sequelize.ENUM('admin', 'peserta'),
        allowNull: false
      },
      is_archived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_pinned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Room_members');
  }
};