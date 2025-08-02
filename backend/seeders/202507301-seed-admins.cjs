'use strict';
const bcrypt = require('bcrypt');
const saltRounds = 10; // Faktor kompleksitas hash

module.exports = {
  async up (queryInterface, Sequelize) {
    // Hash password sebelum dimasukkan ke database
    const hashedPassword1 = await bcrypt.hash('Admin1', saltRounds);
    const hashedPassword2 = await bcrypt.hash('Admin2', saltRounds);
    const hashedPassword3 = await bcrypt.hash('Admin3', saltRounds);
    const hashedPassword4 = await bcrypt.hash('Admin4', saltRounds);
    const hashedPassword5 = await bcrypt.hash('Admin5', saltRounds);
    const hashedPassword6 = await bcrypt.hash('Admin6', saltRounds);

    await queryInterface.bulkInsert('Admins', [
      {
        nama_admin: 'Admin1',
        email: 'admin1@gmail.com',
        password: hashedPassword1,
        bio: 'Admin yang bertugas untuk zona Waktu Indonesia Barat.',
        actived: true,
        timezone: 'WIB',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nama_admin: 'Admin2',
        email: 'admin2@gmail.com',
        password: hashedPassword2,
        bio: 'Admin yang bertugas untuk zona Waktu Indonesia Barat.',
        actived: true,
        timezone: 'WIB',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nama_admin: 'Admin3',
        email: 'admin3@gmail.com',
        password: hashedPassword3,
        bio: 'Admin yang bertugas untuk zona Waktu Indonesia Tengah.',
        actived: true,
        timezone: 'WITA',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nama_admin: 'Admin4',
        email: 'admin4@gmail.com',
        password: hashedPassword4,
        bio: 'Admin yang bertugas untuk zona Waktu Indonesia Tengah.',
        actived: true,
        timezone: 'WITA',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nama_admin: 'Admin5',
        email: 'admin5@gmail.com',
        password: hashedPassword5,
        bio: 'Admin yang bertugas untuk zona Waktu Indonesia Timur.',
        actived: true,
        timezone: 'WIT',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nama_admin: 'Admin6',
        email: 'admin6@gmail.com',
        password: hashedPassword6,
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