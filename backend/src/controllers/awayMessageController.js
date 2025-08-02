import db from '../../models/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const AwayMessage = db.AwayMessage;

/**
 * @description Membuat Away Message baru untuk admin. Hanya bisa dibuat jika belum ada.
 * @route POST /api/away-message
 * @access Private (Admin)
 */
export const createAwayMessage = catchAsync(async (req, res, next) => {
    const adminId = req.user.admin_id;
    const { content, start_time, end_time, actived } = req.body;

    const existingMessage = await AwayMessage.findOne({ where: { admin_id: adminId } });
    if (existingMessage) {
        return sendError(res, 'Away message sudah ada. Gunakan endpoint PATCH untuk mengedit.', 409);
    }

    const awayMessage = await AwayMessage.create({
        admin_id: adminId,
        content,
        start_time,
        end_time,
        actived
    });

    sendSuccess(res, 'Away message berhasil disimpan.', awayMessage, 201);
});

/**
 * @description Menampilkan Away Message milik admin.
 * @route GET /api/away-message
 * @access Private (Admin)
 */
export const getAwayMessage = catchAsync(async (req, res, next) => {
    const adminId = req.user.admin_id;
    const awayMessage = await AwayMessage.findOne({ where: { admin_id: adminId } });

    if (!awayMessage) {
        return sendError(res, 'Away message tidak ditemukan.', 404);
    }

    sendSuccess(res, 'Away message berhasil didapatkan.', awayMessage);
});

/**
 * @description Mengedit Away Message yang sudah ada.
 * @route PATCH /api/away-message
 * @access Private (Admin)
 */
export const updateAwayMessage = catchAsync(async (req, res, next) => {
    const adminId = req.user.admin_id;
    const awayMessage = await AwayMessage.findOne({ where: { admin_id: adminId } });

    if (!awayMessage) {
        return sendError(res, 'Away message tidak ditemukan untuk diupdate.', 404);
    }

    await awayMessage.update(req.body);
    sendSuccess(res, 'Away message berhasil diupdate.', awayMessage);
});