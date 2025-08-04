import express from 'express';
import { sendSuccess } from '../utils/apiResponse.js';

// 1. Impor router baru yang sudah Anda buat
import authRoutes from './authRoutes.js';
//import messageRoutes from './messageRoutes.js';
import awayMessageRoutes from './awayMessageRoutes.js';
import starredMessageRoutes from './starredMessageRoutes.js';
import archivedChatRoutes from './archivedChatRoutes.js';

const router = express.Router();

// Rute dasar untuk mengecek apakah API berjalan
router.get('/', (req, res) => {
  sendSuccess(res, 'Welcome to the Chat API! Server is healthy.');
});

// 2. Gunakan authRoutes untuk semua request ke /auth
router.use('/auth', authRoutes);
//router.use('/', messageRoutes);
router.use('/away-message', awayMessageRoutes);
router.use('/', starredMessageRoutes);
router.use('/rooms', archivedChatRoutes);

export default router;