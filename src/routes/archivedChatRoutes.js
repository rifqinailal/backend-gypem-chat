import express from 'express';
import Joi from 'joi';
import { verify_token } from '../middlewares/authMiddleware.js';
import { sendError } from '../utils/apiResponse.js';
import { archiveRooms, unarchiveRooms, getArchivedRooms } from '../controllers/archivedChatController.js';

const router = express.Router();

// --- Skema Validasi & Middleware ---
const archiveSchema = Joi.object({
    room_member_id: Joi.array().items(Joi.number().integer().positive()).min(1).required()
});

const validateArchiveRequest = (req, res, next) => {
    const { error } = archiveSchema.validate(req.body);
    if (error) {
        return sendError(res, error.details[0].message, 400);
    }
    next();
};

router.use(verify_token);

// Rute untuk mengarsipkan chat: PATCH /api/rooms/archive
router.patch('/archive', validateArchiveRequest, archiveRooms);

// Rute untuk membatalkan arsip chat: PATCH /api/rooms/unarchived
router.patch('/unarchived', validateArchiveRequest, unarchiveRooms);

// Rute untuk mendapatkan semua chat yang diarsipkan: GET /api/rooms/archived
router.get('/archived', getArchivedRooms);

export default router;
