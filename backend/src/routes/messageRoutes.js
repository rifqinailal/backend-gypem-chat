import express from 'express';
import Joi from 'joi';
import {
  sendMessage,
  getMessagesByRoom,
  getMessagesByType,
  readMessages,
  deleteMessageForMe,
  deleteMessageGlobally
} from '../controllers/messageController.js';
import { verify_token } from '../middlewares/authMiddleware.js';
import { uploadFile } from '../middlewares/uploadMiddleware.js';
import { sendError } from '../utils/apiResponse.js';

const router = express.Router();

// Semua rute di bawah ini memerlukan login
router.use(verify_token);

// --- Middleware Validasi ---
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    //  kirim 400 untuk validasi gagal
    return sendError(res, 'Pesan Gagal dihapus. ' + error.details[0].message, 400);
  }
  next();
};

// --- Skema Validasi ---
const deleteForMeSchema = Joi.object({
    message_status_ids: Joi.array().items(Joi.number().integer()).min(1).required()
});

const deleteGloballySchema = Joi.object({
    message_id: Joi.number().integer().required()
});

// --- Definisi Rute ---

// Rute untuk mengirim dan menampilkan pesan dalam sebuah room
router.route('/rooms/:roomId/messages')
  .post(uploadFile, sendMessage) 
  .get(getMessagesByRoom);



// Rute untuk menandai pesan sebagai dibaca
router.post('/messages/read', readMessages);

// Rute untuk menghapus pesan (untuk diri sendiri)
router.post('/messages/deleted-for-me', deleteMessageForMe);

// Rute untuk menghapus pesan (untuk semua)
router.post('/messages/deleted-globally', deleteMessageGlobally);

//route untuk menampilkan pesan berdasarkan kategori
router.get('/rooms/:roomId/messages/:type', getMessagesByType);

export default router;
