import express from 'express';
import { sendSuccess } from '../utils/apiResponse.js';

// 1. Impor router baru yang sudah Anda buat
import authRoutes from './authRoutes.js';

//import messageRoutes from './messageRoutes.js';
import awayMessageRoutes from './awayMessageRoutes.js';
import starredMessageRoutes from './starredMessageRoutes.js';
import archivedChatRoutes from './archivedChatRoutes.js';
import messageRoutes from './messageRoutes.js';
import quickReplyRoutes from './quickReplyRoutes.js';
import pinnedMessageRoutes from './pinnedMessageRoutes.js';
import roomRoutes from './roomRoutes.js';
import searchRoutes from "./searchRoutes.js";


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
router.use(pinnedMessageRoutes);
router.use(messageRoutes);
router.use('/rooms', roomRoutes);
router.use('/', searchRoutes);
router.use(quickReplyRoutes);

export default router;