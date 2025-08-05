'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Room_members", "is_left", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: "is_deleted",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Room_members", "is_left");
  },
};
