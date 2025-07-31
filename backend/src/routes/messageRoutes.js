// =================================================================
// File: src/routes/messageRoutes.js
// Tujuan: Mendefinisikan endpoint untuk fitur pesan utama.
// =================================================================
import express from 'express';
import Joi from 'joi';
import {
  sendMessage,
  getMessagesByRoom,
  readMessages,
  deleteMessageForMe,
  deleteMessageGlobally
} from '../controllers/messageController.js';
import { verify_token } from '../middlewares/authMiddleware.js';
import { sendError } from '../utils/apiResponse.js';

const router = express.Router();

// Semua rute di bawah ini memerlukan login
router.use(verify_token);

// --- Skema Validasi ---
const sendMessageSchema = Joi.object({
  content: Joi.string().required(),
  reply_to_message_id: Joi.number().optional()
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return sendError(res, error.details[0].message, 400);
  }
  next();
};

// --- Definisi Rute ---

// Rute untuk mengirim dan menampilkan pesan dalam sebuah room
router.route('/rooms/:roomId/messages')
  .post(validate(sendMessageSchema), sendMessage)
  .get(getMessagesByRoom);

// Rute untuk menandai pesan sebagai dibaca
router.post('/messages/read', readMessages);

// Rute untuk menghapus pesan (untuk diri sendiri)
router.post('/messages/deleted-for-me', deleteMessageForMe);

// Rute untuk menghapus pesan (untuk semua)
router.post('/messages/deleted-globally', deleteMessageGlobally);

export default router;
