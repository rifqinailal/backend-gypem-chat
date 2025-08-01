import express from 'express';
import { createAwayMessage, getAwayMessage, updateAwayMessage } from '../controllers/awayMessageController.js';
import { protect, restrictToAdmin } from '../middleware/authMiddleware.js'; // Asumsi middleware auth

const router = express.Router();

// Middleware untuk memastikan hanya admin yang bisa mengakses
router.use(protect, restrictToAdmin);

router.route('/settings/away-message')
    .post(createAwayMessage)
    .patch(updateAwayMessage);

router.route('/away-message')
    .get(getAwayMessage);

export default router;
