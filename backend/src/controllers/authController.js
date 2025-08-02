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
  
  if (!admin) {
    return sendError(res, 'Login gagal. Akun tidak ditemukan', 403);
  }

  const isPasswordMatch = await bcrypt.compare(password, admin.password);
  
  
  if (!isPasswordMatch) {
    return sendError(res, 'Password atau kata sandi salah', 400);
  }
  
  const tokenPayload = { id: admin.admin_id, type: 'admin' };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });
  
  const responseData = {
    admin_id: admin.admin_id,
    nama_admin: admin.nama_admin,
    email: admin.email,
    bio: admin.bio,
    url_profile_photo: admin.url_profile_photo,
    actived: admin.actived,
    token: token
  };
  
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
 * Controller untuk registrasi Peserta baru.
 */
export const registerPeserta = catchAsync(async (req, res, next) => {
    const { nama_peserta, email, password } = req.body;
    
    const existingPeserta = await Peserta.findOne({ where: { email } });
    if (existingPeserta) {
        return sendError(res, 'Email sudah terdaftar. Silakan gunakan email lain.', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newPeserta = await Peserta.create({
        nama_peserta,
        email,
        password: hashedPassword
    });
    const tokenPayload = { id: newPeserta.user_id, type: 'peserta' };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });
    const responseData = {
        user_id: newPeserta.user_id,
        nama_peserta: newPeserta.nama_peserta,
        email: newPeserta.email,
        token: token
      };
      sendSuccess(res, 'Registrasi berhasil. Silakan login.', responseData, 201);
    });
    
    /*** Controller untuk Logout (Admin & Peserta).*/
    //export const logout = (req, res) => {
    //sendSuccess(res, 'Logout berhasil.', null, 200);
    //};
    
    // Controller untuk Logout (Admin & Peserta). Simpan blacklist di memori (untuk demo, gunakan Redis/DB untuk produksi)
    const tokenBlacklist = [];
    export { tokenBlacklist };
    export const logout = (req, res) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        tokenBlacklist.push(token);
      }
      sendSuccess(res, 'Logout berhasil.', null, 200);
    };
    
    // Melihat semua admin
    export const getAllAdmins = catchAsync(async (req, res, next) => {
      const admins = await db.Admin.findAll({
        attributes: { exclude: ['password', 'actived'] }
      });
      sendSuccess(res, 'Daftar semua admin', admins, 200);
    });
    
    // Melihat detail admin berdasarkan ID
    export const getAdminDetail = catchAsync(async (req, res, next) => {
      const { adminId } = req.params;
      if (req.userType !== 'admin' || req.userId !== parseInt(adminId, 10)) {
        return sendError(res, 'Detail Admin tidak ditemukan.', 404);
      }
      const admin = req.user;
      const responseData = {
        admin_id: admin.admin_id,
        nama_admin: admin.nama_admin,
        email: admin.email,
        bio: admin.bio,
        url_profile_photo: admin.url_profile_photo,
        timezone: admin.timezone,
        created_at: admin.createdAt,
        updated_at: admin.updatedAt
      };
      sendSuccess(res, 'Detail admin ditemukan', responseData, 200);
    });