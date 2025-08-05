// =================================================================
// File: src/controllers/quickReplyController.js
// Tujuan: Menangani semua logika bisnis untuk fitur Quick Reply.
// =================================================================
import db from '../../models/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const QuickReply = db.QuickReply;

/**
 * Membuat Quick Reply baru.
 */
export const createQuickReply = catchAsync(async (req, res, next) => {
  const { title, content } = req.body;
  const adminId = req.userId;

  // Validasi: title wajib diisi
  if (!title) {
    return sendError(res, 'Title wajib diisi.', 400);
  }

  // Validasi: content atau file harus ada salah satu
  if (!content && !req.file) {
    return sendError(res, 'Konten atau file wajib diisi.', 400);
  }

  let filePath = null;
  if (req.file) {
    filePath = req.file.filename;
  }

  await QuickReply.create({
    admin_id: adminId,
    title,
    content,
    file_path: filePath
  });

  sendSuccess(res, 'Quick reply berhasil dibuat.', 201);
});

/**
 * Mengedit Quick Reply yang sudah ada.
 */
export const updateQuickReply = catchAsync(async (req, res, next) => {
  const { qreplyId } = req.params;
  const { title, content } = req.body;
  const adminId = req.userId;

  const quickReply = await QuickReply.findOne({
    where: { qreply_id: qreplyId, admin_id: adminId }
  });

  if (!quickReply) {
    return sendError(res, 'Quick reply tidak ditemukan atau Anda tidak punya akses.', 404);
  }

  // Validasi
  if (!title) {
    return sendError(res, 'Title wajib diisi.', 400);
  }
  if (!content && !req.file) {
    return sendError(res, 'Konten atau file wajib diisi.', 400);
  }

  let filePath = quickReply.file_path; // Pertahankan file lama jika tidak ada yang baru
  if (req.file) {
    // Hapus file lama jika ada (logika ini bisa ditambahkan nanti)
   filePath = req.file.filename;
  }

  await quickReply.update({
    title,
    content: content || null, // Set content jadi null jika hanya mengirim file
    file_path: filePath
  });

  sendSuccess(res, 'Quick reply berhasil diperbarui.');
});

/**
 * Menampilkan semua Quick Replies milik admin.
 */
export const getAllQuickReplies = catchAsync(async (req, res, next) => {
  const adminId = req.userId;
  const replies = await QuickReply.findAll({
    where: { admin_id: adminId },
    order: [['title', 'ASC']]
  });
  sendSuccess(res, 'Data berhasil didapatkan', replies);
});

/**
 * Menampilkan detail satu Quick Reply.
 */
export const getQuickReplyById = catchAsync(async (req, res, next) => {
  const { qreplyId } = req.params;
  const adminId = req.userId;

  const reply = await QuickReply.findOne({
    where: { qreply_id: qreplyId, admin_id: adminId }
  });

  if (!reply) {
    return sendError(res, 'Quick reply tidak ditemukan atau Anda tidak punya akses.', 404);
  }

  sendSuccess(res, 'Data berhasil didapatkan', reply);
});


export const deleteQuickReply = catchAsync(async (req, res, next) => {
  const { qreplyId } = req.params;
  const adminId = req.userId;

  const quickReply = await QuickReply.findOne({
    where: { qreply_id: qreplyId, admin_id: adminId }
  });

  if (!quickReply) {
    return sendError(res, 'Quick reply tidak ditemukan atau Anda tidak punya akses.', 404);
  }

  // Hapus data dari database
  await quickReply.destroy();

  sendSuccess(res, 'Quick reply berhasil dihapus.');
});
