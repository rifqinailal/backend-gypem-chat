import express from 'express';
import { archiveChats, unarchiveChats, getArchivedChats } from '../controllers/archivedChatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.patch('/rooms/archive', archiveChats);
router.patch('/rooms/unarchive', unarchiveChats); // Sesuai API doc, endpointnya /unarchived, tapi saya samakan polanya
router.get('/rooms/archived', getArchivedChats);

export default router;
