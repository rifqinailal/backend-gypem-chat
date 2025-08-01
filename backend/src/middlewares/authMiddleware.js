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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let currentUser;
    if (decoded.type === 'admin') {
      currentUser = await db.Admin.findByPk(decoded.id);
    } else if (decoded.type === 'peserta') {
      currentUser = await db.Peserta.findByPk(decoded.id);
    }

    if (!currentUser) {
      return sendError(res, 'Pengguna yang memiliki token ini sudah tidak ada.', 401);
    }

    // --- PERBAIKAN KUNCI DI SINI ---
    req.user = currentUser; // Tetap simpan objek user lengkap
    req.userId = decoded.id; // Tambahkan ID secara terpisah agar mudah diakses
    req.userType = decoded.type; // Tambahkan tipe user

    next();
  } catch (error) {
    return sendError(res, 'Token tidak valid atau sudah kedaluwarsa.', 401);
  }
};