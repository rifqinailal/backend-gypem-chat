import express from 'express';
import Joi from 'joi';
import { verify_token } from '../middlewares/authMiddleware.js';
import { sendError } from '../utils/apiResponse.js';
import { starMessages, unstarMessages, getAllStarred, getStarredByRoom, searchStarred } from '../controllers/starredMessageController.js';

const router = express.Router();

// Skema validasi
const starUnstarSchema = Joi.object({
    message_status_id: Joi.array().items(Joi.number().integer().positive()).min(1).required()
});

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return sendError(res, error.details[0].message, 400);
    }
    next();
};

// Semua rute di sini memerlukan otentikasi
router.use(verify_token);

// PATCH /api/messages/star
router.patch('/messages/star', validate(starUnstarSchema), starMessages);

// PATCH /api/messages/unstar
router.patch('/messages/unstar', validate(starUnstarSchema), unstarMessages);

// GET /api/messages/starred
router.get('/messages/starred', getAllStarred);

// GET /api/messages/starred/search?q={keyword}
router.get('/messages/starred/search', searchStarred);

// GET /api/rooms/{roomId}/messages/starred (URL diubah agar lebih RESTful)
router.get('/rooms/:roomId/messages/starred', getStarredByRoom);

// GET /api/messages/starred/search?q={keyword}
router.get('/messages/starred/search', searchStarred);

export default router;
