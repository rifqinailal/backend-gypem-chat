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
        nama_admin: 'Admin Utama',
        email: 'admin1@gmail.com',
        password: hashedPassword1,
        bio: 'Admin utama untuk aplikasi chat.',
        actived: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nama_admin: 'Admin Cadangan',
        email: 'admin2@gmail.com',
        password: hashedPassword2,
        bio: 'Admin cadangan jika admin utama tidak aktif.',
        actived: true,
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