// File: src/routes/index.js

import express from 'express';
import { sendSuccess } from '../utils/apiResponse.js';

// 1. Impor router baru yang sudah Anda buat
import authRoutes from './authRoutes.js';

const router = express.Router();

// Rute dasar untuk mengecek apakah API berjalan
router.get('/', (req, res) => {
  sendSuccess(res, 'Welcome to the Chat API! Server is healthy.');
});

// 2. Gunakan authRoutes untuk semua request ke /auth
router.use('/auth', authRoutes);

// (Nanti, rute lain akan ditambahkan di sini)

export default router;