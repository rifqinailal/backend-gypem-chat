import express from 'express';
import Joi from 'joi';
import {
    createAwayMessage,
    getAwayMessage,
    updateAwayMessage,
    // deleteAwayMessage dihapus dari import
} from '../controllers/awayMessageController.js';
import { verify_token } from '../middlewares/authMiddleware.js';
import { sendError } from '../utils/apiResponse.js';

const router = express.Router();

// Middleware untuk memastikan hanya admin yang bisa mengakses
const isAdmin = (req, res, next) => {
    if (req.userType !== 'admin') {
        return sendError(res, 'Akses ditolak. Halaman ini hanya untuk admin.', 403);
    }
    next();
};

// Skema validasi untuk membuat pesan baru (content wajib)
const createSchema = Joi.object({
    content: Joi.string().required(),
    start_time: Joi.date().iso().allow(null).optional(),
    end_time: Joi.date().iso().allow(null).optional(),
    actived: Joi.boolean().optional()
});

// Skema validasi untuk mengedit pesan (semua opsional)
const updateSchema = Joi.object({
    content: Joi.string().optional(),
    start_time: Joi.date().iso().allow(null).optional(),
    end_time: Joi.date().iso().allow(null).optional(),
    actived: Joi.boolean().optional()
});

const validateCreate = (req, res, next) => {
    const { error } = createSchema.validate(req.body);
    if (error) {
        return sendError(res, error.details[0].message, 400);
    }
    next();
};

const validateUpdate = (req, res, next) => {
    const { error } = updateSchema.validate(req.body);
    if (error) {
        return sendError(res, error.details[0].message, 400);
    }
    next();
};


// Semua rute di bawah ini memerlukan token valid dari admin
router.use(verify_token, isAdmin);

// Rute untuk membuat Away Message baru
// POST /api/away-message
router.post('/', validateCreate, createAwayMessage);

// Rute untuk mendapatkan Away Message milik admin
// GET /api/away-message
router.get('/', getAwayMessage);

// Rute untuk mengedit Away Message
// Perubahan: Tidak lagi menggunakan :awayId
// PUT /api/away-message
router.patch('/', validateUpdate, updateAwayMessage);

// Rute DELETE dihapus

export default router;
