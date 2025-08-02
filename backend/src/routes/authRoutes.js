// =================================================================
// File: src/routes/authRoutes.js
// Tujuan: Mendefinisikan semua halaman yang berawalan /auth.
// =================================================================
import express from 'express';
import Joi from 'joi';
import { loginAdmin, loginPeserta, logout, registerPeserta } from '../controllers/authController.js';
import { verify_token } from '../middlewares/authMiddleware.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { getAllAdmins } from '../controllers/authController.js';
import { getAdminDetail } from '../controllers/authController.js';

const router = express.Router();

// --- Skema Validasi & Middleware ---
const registerSchema = Joi.object({
  nama_peserta: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return sendError(res, error.details[0].message, 400);
  }
  next();
};

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return sendError(res, error.details[0].message, 400);
  }
  next();
};



// Rute untuk login admin: POST /api/auth/admin/login
router.post('/admin/login', validateLogin, loginAdmin);

// Rute untuk register peserta: POST /api/auth/peserta/register
router.post('/peserta/register', validateRegister, registerPeserta);  

// Rute untuk login peserta: POST /api/auth/peserta/login
router.post('/peserta/login', validateLogin, loginPeserta);

// Rute untuk logout admin: POST /api/auth/admin/logout
router.post('/admin/logout', verify_token, (req, res) => {
  if (req.userType !== 'admin') {
    return sendError(res, 'Token tidak valid. Hanya admin yang bisa logout menggunakan halaman ini.', 401);
  }
  logout(req, res);
});

// Rute untuk logout peserta: POST /api/auth/peserta/logout
router.post('/peserta/logout', verify_token, (req, res) => {
  if (req.userType !== 'peserta') {
    return sendError(res, 'Token tidak valid. Hanya peserta yang bisa logout menggunakan halaman ini.', 401);
  }
  logout(req, res);
});

// Rute untuk logout (bisa untuk admin & peserta): POST /api/auth/logout
//router.post('/logout', verify_token, logout);

// Rute untuk menampilkan semua admin yang telah login (bisa diakses admin dan peserta)
router.get('/admin/all', verify_token, getAllAdmins);

// Rute untuk menampilkan detail salah satu admin: GET /api/auth/admin/:adminId
router.get('/admin/:adminId', verify_token, getAdminDetail);

export default router;
