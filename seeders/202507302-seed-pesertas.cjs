'use strict';
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = {
  async up (queryInterface, Sequelize) {
    // Hash semua password
    const passwords = await Promise.all([
      bcrypt.hash('pesertaSatu', saltRounds),
      bcrypt.hash('pesertaDua', saltRounds),
      bcrypt.hash('pesertaTiga', saltRounds)
    ]);

    await queryInterface.bulkInsert('Pesertas', [
      {
        nama_peserta: 'Rifqi Pratama',
        email: 'rifqi.pratama@example.com',
        password: passwords[0],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nama_peserta: 'Budi Santoso',
        email: 'budi.santoso@example.com',
        password: passwords[1],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nama_peserta: 'Citra Lestari',
        email: 'citra.lestari@example.com',
        password: passwords[2],
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Pesertas', null, {});
  }
};