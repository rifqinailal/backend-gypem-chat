// = ================================================================
// File: src/middlewares/uploadMiddleware.js
// Tujuan: Menangani request multipart/form-data dan menyimpan file.
// =================================================================
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper untuk mendapatkan __dirname di ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  // Tentukan folder tujuan untuk menyimpan file
  destination: (req, file, cb) => {
    // Simpan file di folder 'uploads' di root proyek
    cb(null, path.join(__dirname, '../../uploads'));
  },
  // Tentukan nama file yang akan disimpan
  filename: (req, file, cb) => {
    // Buat nama file unik untuk menghindari konflik nama
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Konfigurasi Multer
const upload = multer({
  storage: storage,
  // Batasi ukuran file sesuai dokumentasi Anda (10 MB)
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 Megabytes
  },
  // Filter jenis file jika diperlukan (opsional)
  fileFilter: (req, file, cb) => {
    // Anda bisa menambahkan validasi di sini untuk hanya menerima gambar atau pdf
    // Contoh: if (!file.mimetype.startsWith('image')) { ... }
    cb(null, true); // Terima semua file untuk saat ini
  }
});

// Ekspor middleware untuk digunakan di rute.
// '.single('file')' berarti kita mengharapkan satu file dari field bernama 'file'.
export const uploadFile = upload.single('file');
