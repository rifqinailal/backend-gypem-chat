'use strict';
const bcrypt = require('bcrypt');
const saltRounds = 10; // Faktor kompleksitas hash

module.exports = {
  async up (queryInterface, Sequelize) {
    // Hash password sebelum dimasukkan ke database
    const hashedPassword1 = await bcrypt.hash('Admin111', saltRounds);
    const hashedPassword2 = await bcrypt.hash('Admin222', saltRounds);

    await queryInterface.bulkInsert('Admins', [
      {
        nama_admin: 'Admin WIB',
        email: 'admin.wib@gmail.com',
        password: hashedPassword1,
        bio: 'Admin yang bertugas untuk zona Waktu Indonesia Barat.',
        actived: true,
        timezone: 'WIB',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nama_admin: 'Admin WITA',
        email: 'admin.wita@gmail.com',
        password: hashedPassword2,
        bio: 'Admin yang bertugas untuk zona Waktu Indonesia Tengah.',
        actived: true,
        timezone: 'WITA',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nama_admin: 'Admin WIT',
        email: 'admin.wit@gmail.com',
        password: hashedPassword2,
        bio: 'Admin yang bertugas untuk zona Waktu Indonesia Timur.',
        actived: true,
        timezone: 'WIT',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    // Menghapus semua data dari tabel Admins
    await queryInterface.bulkDelete('Admins', null, {});
  }
};