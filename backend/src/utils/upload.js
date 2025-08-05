import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendError } from './apiResponse.js';

const uploadDir = '/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan untuk Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Gunakan variabel uploadDir
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `profile-${req.userId}-${uniqueSuffix}${extension}`);
  }
});

// Filter file untuk hanya menerima gambar
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Hanya file gambar (jpeg, jpg, png, pdf) yang diizinkan!'));
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: fileFilter
});

// Middleware custom untuk menangani error multer
export const handleUpload = (fieldName) => (req, res, next) => {
  const uploadSingle = upload.single(fieldName);

  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return sendError(res, err.message, 400);
    } else if (err) {
      return sendError(res, err.message, 400);
    }
    next();
  });
};