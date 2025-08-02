// File: src/models/index.js

'use strict';

import fs from 'fs';
import path from 'path';
import { DataTypes } from 'sequelize';
import { fileURLToPath, pathToFileURL } from 'url';
import { sequelize } from '../src/config/database.js';



// Helper untuk mendapatkan __dirname di ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = {};

// Baca semua file di direktori saat ini secara dinamis
const files = fs.readdirSync(__dirname).filter(file => 
  (file.indexOf('.') !== 0) && (file !== path.basename(__filename)) && (file.slice(-3) === '.js')
);

// Impor setiap model dan tambahkan ke objek db
for (const file of files) {
  // Ubah path ke file URL agar bisa di-import oleh ESM
  const fileUrl = pathToFileURL(path.join(__dirname, file));
  const modelModule = await import(fileUrl.href); // <-- INI YANG BENAR
  const model = modelModule.default(sequelize, DataTypes);
  db[model.name] = model;
}

// Jalankan fungsi asosiasi jika ada
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Tambahkan instance sequelize ke objek db
db.sequelize = sequelize;

// Ekspor objek db yang sudah lengkap
export default db;
