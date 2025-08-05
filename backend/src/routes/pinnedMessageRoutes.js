// =================================================================
// File: src/routes/pinnedMessageRoutes.js
// Tujuan: Mendefinisikan semua endpoint untuk fitur pesan yang disematkan.
// =================================================================
import express from 'express';
import {
  pinMessage,
  unpinMessage,
  getPinnedMessagesByRoom
} from '../controllers/pinnedMessageController.js';
import { verify_token } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Semua rute di bawah ini memerlukan login
router.use(verify_token);

// Rute untuk menyematkan pesan
// Sesuai dokumentasi: PATCH /messages/{messageId}/{message-status-id}pin
// Versi RESTful yang lebih baik:
router.patch('/messages/:messageStatusId/pin', pinMessage);

// Rute untuk membatalkan sematan
router.patch('/messages/:messageStatusId/unpin', unpinMessage);

// Rute untuk menampilkan pesan yang disematkan dalam sebuah room
router.get('/rooms/:roomId/pinned-messages', getPinnedMessagesByRoom);

export default router;
