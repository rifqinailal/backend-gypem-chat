// =================================================================
// File: src/controllers/authController.js (UPDATED)
// Tujuan: Menyesuaikan response data login admin sesuai dokumentasi.
// =================================================================
import db from '../../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const Admin = db.Admin;
const Peserta = db.Peserta;

/**
 * Controller untuk login Admin.
 */
export const loginAdmin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ where: { email } });

  // Sesuai dokumentasi, jika akun tidak ditemukan kirim 403
  if (!admin) {
    return sendError(res, 'Login gagal. Akun tidak ditemukan', 403);
  }

  const isPasswordMatch = await bcrypt.compare(password, admin.password);
  
  // Sesuai dokumentasi, jika password salah kirim 400
  if (!isPasswordMatch) {
    return sendError(res, 'Password atau kata sandi salah', 400);
  }

  const tokenPayload = { id: admin.admin_id, type: 'admin' };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

  // --- PERUBAHAN DI SINI ---
  // Sekarang kita sertakan semua data yang dibutuhkan oleh dokumentasi.
  const responseData = {
    admin_id: admin.admin_id,
    nama_admin: admin.nama_admin,
    email: admin.email,
    bio: admin.bio,
    url_profile_photo: admin.url_profile_photo,
    actived: admin.actived,
    token: token
  };

  // Sesuai dokumentasi, status sukses adalah 200
  sendSuccess(res, 'Login berhasil', responseData, 200);
});

/**
 * Controller untuk login Peserta.
 */
export const loginPeserta = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const peserta = await Peserta.findOne({ where: { email } });

  if (!peserta) {
    return sendError(res, 'Login gagal. Akun tidak ditemukan', 404);
  }

  const isPasswordMatch = await bcrypt.compare(password, peserta.password);
  if (!isPasswordMatch) {
    return sendError(res, 'Password atau kata sandi salah', 400);
  }

  const tokenPayload = { id: peserta.user_id, type: 'peserta' };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

  const responseData = {
    user_id: peserta.user_id,
    nama: peserta.nama_peserta,
    email: peserta.email,
    token: token
  };

  sendSuccess(res, 'Login berhasil', responseData, 201);
});

/**
 * Controller untuk Logout (Admin & Peserta).
 */
export const logout = (req, res) => {
    sendSuccess(res, 'Logout berhasil.', null, 200);
};
