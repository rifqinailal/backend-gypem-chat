// =================================================================
// File: src/routes/quickReplyRoutes.js
// Tujuan: Mendefinisikan semua endpoint untuk fitur Quick Reply.
// =================================================================
import express from 'express';
import {
  createQuickReply,
  updateQuickReply,
  getAllQuickReplies,
  getQuickReplyById
} from '../controllers/quickReplyController.js';
import { verify_token } from '../middlewares/authMiddleware.js';
import { restrictToAdmin } from '../middlewares/permissionMiddleware.js';
import { uploadFile } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Semua rute di bawah ini memerlukan login dan harus admin
router.use(verify_token, restrictToAdmin);

// Rute untuk membuat dan menampilkan semua quick replies
router.route('/settings/quick-replies')
  .post(uploadFile, createQuickReply)
  .get(getAllQuickReplies);

// Rute untuk mengedit dan menampilkan detail quick reply
router.route('/settings/quick-replies/:qreplyId')
  .put(uploadFile, updateQuickReply) // Method PUT lebih cocok untuk update resource lengkap
  .get(getQuickReplyById);

export default router;
