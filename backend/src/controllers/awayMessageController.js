import db from '../../models/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const AwayMessage = db.AwayMessage;

/**
 * @description Membuat Away Message baru untuk admin. Hanya bisa dibuat jika belum ada.
 * @route POST /settings/away-message
 * @access Private (Admin)
 */
export const createAwayMessage = catchAsync(async (req, res, next) => {
    const adminId = req.user.admin_id;
    const { content, start_time, end_time, actived } = req.body;

    // Cek apakah away message sudah ada
    const existingMessage = await AwayMessage.findOne({ where: { admin_id: adminId } });
    if (existingMessage) {
        return sendError(res, 'Away message sudah ada. Gunakan endpoint PATCH untuk mengedit.', 409); // 409 Conflict
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
 * @route GET /away-message
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
 * @route PATCH /settings/away-message
 * @access Private (Admin)
 */
export const updateAwayMessage = catchAsync(async (req, res, next) => {
    const adminId = req.user.admin_id;
    const { content, start_time, end_time, actived } = req.body;

    let awayMessage = await AwayMessage.findOne({ where: { admin_id: adminId } });

    if (!awayMessage) {
        return sendError(res, 'Away message tidak ditemukan untuk diupdate.', 404);
    }

    // Update field yang diberikan
    awayMessage.content = content ?? awayMessage.content;
    awayMessage.start_time = start_time ?? awayMessage.start_time;
    awayMessage.end_time = end_time ?? awayMessage.end_time;
    awayMessage.actived = actived ?? awayMessage.actived;

    await awayMessage.save();

    sendSuccess(res, 'Away message berhasil diupdate.', awayMessage);
});
