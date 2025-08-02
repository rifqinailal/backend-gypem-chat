import express from 'express';
import { createAwayMessage, getAwayMessage, updateAwayMessage } from '../controllers/awayMessageController.js';
import { verify_token, restrictToAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Semua rute di bawah ini memerlukan login sebagai admin
router.use(verify_token, restrictToAdmin);

router.route('/')
    .post(createAwayMessage)
    .get(getAwayMessage)
    .patch(updateAwayMessage);
    
export default router;
