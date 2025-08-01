import express from 'express';
import { starMessages, unstarMessages, getStarredMessages } from '../controllers/starredMessageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.patch('/messages/star', starMessages);
router.patch('/messages/unstar', unstarMessages);

router.get('/messages/starred', getStarredMessages);
router.get('/messages/starred/search', getStarredMessages); // Ditangani oleh controller yang sama
router.get('/rooms/:roomId/messages/starred', getStarredMessages); // Ditangani oleh controller yang sama

export default router;
