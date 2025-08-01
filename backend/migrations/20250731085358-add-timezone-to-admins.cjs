'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Admins', 'timezone', {
      type: Sequelize.ENUM('WIB', 'WITA', 'WIT'),
      allowNull: true, // Bisa null jika ada admin umum
      after: 'actived' // Posisi kolom di tabel
    });
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Admins', 'timezone');
  }
};
