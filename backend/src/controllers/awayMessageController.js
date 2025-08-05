import db from '../../models/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const AwayMessage = db.AwayMessage;

/**
 * Membuat Away Message baru
 */
export const createAwayMessage = catchAsync(async (req, res, next) => {
    const { content, start_time, end_time, actived } = req.body;
    const admin_id = req.userId; // Diambil dari token

    // Cek apakah admin sudah punya away message
    const existingMessage = await AwayMessage.findOne({ where: { admin_id } });
    if (existingMessage) {
        return sendError(res, 'Anda sudah memiliki Away Message. Silakan edit yang sudah ada.', 409); // 409 Conflict
    }

    // Tidak perlu menyimpan hasil create ke variabel jika tidak digunakan
    await AwayMessage.create({
        admin_id,
        content,
        start_time,
        end_time,
        actived: actived !== undefined ? actived : true,
    });
    
    sendSuccess(res, 'Away message berhasil dibuat.', 201);
});

/**
 * Menampilkan Away Message milik admin yang sedang login.
 * Perubahan: Tidak lagi memerlukan awayId, langsung cari berdasarkan admin_id.
 */
export const getAwayMessage = catchAsync(async (req, res, next) => {
    const admin_id = req.userId;

    const awayMessage = await AwayMessage.findOne({ where: { admin_id } });

    if (!awayMessage) {
        return sendError(res, 'Away message tidak ditemukan. Silakan buat terlebih dahulu.', 404);
    }

    sendSuccess(res, 'Away message berhasil ditemukan.', awayMessage, 200);
});

/**
 * Mengedit Away Message milik admin yang sedang login.
 * Perubahan: Tidak lagi memerlukan awayId.
 */
export const updateAwayMessage = catchAsync(async (req, res, next) => {
    const { content, start_time, end_time, actived } = req.body;
    const admin_id = req.userId;

    const awayMessage = await AwayMessage.findOne({ where: { admin_id } });

    if (!awayMessage) {
        return sendError(res, 'Away message tidak ditemukan. Silakan buat terlebih dahulu.', 404);
    }

    // Update field yang diberikan
    awayMessage.content = content !== undefined ? content : awayMessage.content;
    awayMessage.start_time = start_time !== undefined ? start_time : awayMessage.start_time;
    awayMessage.end_time = end_time !== undefined ? end_time : awayMessage.end_time;
    awayMessage.actived = actived !== undefined ? actived : awayMessage.actived;

    await awayMessage.save();

    sendSuccess(res, 'Away message berhasil diperbarui.', awayMessage, 200);
});
