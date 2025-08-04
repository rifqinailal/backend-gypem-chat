import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendError } from '../utils/apiResponse.js'; // Impor helper error

// Helper untuk mendapatkan __dirname di ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi penyimpanan file (tetap sama)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Konfigurasi Multer (tetap sama)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Batas 10 MB
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

// Middleware Multer dasar (tetap ada) - TAMBAHKAN 'export' DI SINI
export const uploadFile = upload.single('file');

/**
 * FUNGSI BARU: Middleware pembungkus untuk menangani error dari Multer.
 * @param {object} req - Objek request Express.
 * @param {object} res - Objek response Express.
 * @param {function} next - Fungsi next Express.
 */
export const handleUploadWithErrors = (req, res, next) => {
  // Jalankan middleware uploadFile
  uploadFile(req, res, (err) => {
    // Cek apakah error ini adalah error spesifik dari Multer
    if (err instanceof multer.MulterError) {
      // Jika error karena ukuran file terlalu besar
      if (err.code === 'LIMIT_FILE_SIZE') {
        // Kirim response 413 sesuai dokumentasi Anda
        // Catatan: Pesan error di dokumentasi Anda menyebut 10 GB, tapi limitnya 10 MB. Saya sesuaikan pesannya.
        return sendError(res, 'Ukuran file melebihi batas maksimal 10 MB.', 413);
      }
    } else if (err) {
      // Jika ada error lain yang tidak terduga saat upload
      return sendError(res, 'Terjadi kesalahan saat mengunggah file.', 500);
    }

    // Jika tidak ada error sama sekali, lanjutkan ke controller (sendMessage)
    next();
  });
};

