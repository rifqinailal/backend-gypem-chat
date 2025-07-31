// =================================================================
// File: src/middlewares/authMiddleware.js
// Tujuan: Melindungi rute dengan memeriksa validitas token JWT.
// =================================================================
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/apiResponse.js';
import db from '../../models/index.js';

export const verify_token = async (req, res, next) => {
  let token;

  // 1. Cek apakah header authorization ada dan berformat 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Anda belum login. Silakan login untuk mendapatkan akses.', 401);
  }

  try {
    // 2. Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Cari pengguna (Admin atau Peserta) berdasarkan data di dalam token
    let currentUser;
    if (decoded.type === 'admin') {
      currentUser = await db.Admin.findByPk(decoded.id);
    } else if (decoded.type === 'peserta') {
      currentUser = await db.Peserta.findByPk(decoded.id);
    }

    if (!currentUser) {
      return sendError(res, 'Pengguna yang memiliki token ini sudah tidak ada.', 401);
    }

    // 4. Simpan data pengguna di objek request untuk digunakan oleh controller selanjutnya
    req.user = currentUser;
    req.userType = decoded.type;
    next();
  } catch (error) {
    return sendError(res, 'Token tidak valid atau sudah kedaluwarsa.', 401);
  }
};
