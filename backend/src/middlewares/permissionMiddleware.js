// =================================================================
// File: src/middlewares/permissionMiddleware.js
// Tujuan: Membatasi akses rute hanya untuk tipe pengguna tertentu (misal: admin).
// =================================================================
import { sendError } from '../utils/apiResponse.js';

export const restrictToAdmin = (req, res, next) => {
  // Middleware ini harus dijalankan SETELAH middleware 'protect',
  // sehingga req.userType sudah pasti ada.
  if (req.userType !== 'admin') {
    return sendError(res, 'Anda tidak memiliki akses untuk melakukan aksi ini.', 403);
  }
  next();
};
