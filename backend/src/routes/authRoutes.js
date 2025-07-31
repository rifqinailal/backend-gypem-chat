// =================================================================
// File: src/routes/authRoutes.js
// Tujuan: Mendefinisikan semua endpoint yang berawalan /auth.
// =================================================================
import express from 'express';
import Joi from 'joi';
import { loginAdmin, loginPeserta, logout } from '../controllers/authController.js';
import { verify_token } from '../middlewares/authMiddleware.js';
import { sendError } from '../utils/apiResponse.js';

const router = express.Router();

// --- Skema Validasi & Middleware ---
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

// --- Definisi Rute ---

// Rute untuk login admin: POST /api/auth/admin/login
router.post('/admin/login', validateLogin, loginAdmin);

// Rute untuk login peserta: POST /api/auth/peserta/login
router.post('/peserta/login', validateLogin, loginPeserta);

// Rute untuk logout (bisa untuk admin & peserta): POST /api/auth/logout
router.post('/logout', verify_token, logout);


export default router;
