import express from 'express';
import { verify_token } from '../middlewares/authMiddleware.js';
import { starMessages, unstarMessages, getStarredMessages } from '../controllers/messageController.js';

const router = express.Router();

// Rute untuk membintangi pesan: PATCH /api/messages/star
router.patch('/star', verify_token, starMessages);

// Rute untuk membatalkan bintang pesan: PATCH /api/messages/unstar
router.patch('/unstar', verify_token, unstarMessages);

// Rute untuk mendapatkan semua pesan berbintang (bisa difilter by room & search)
// GET /api/messages/starred
// GET /api/messages/starred?roomId=1
// GET /api/messages/starred?q=penting
router.get('/star', verify_token, getStarredMessages);

export default router;