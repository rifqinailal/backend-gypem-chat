import multer from 'multer';
import path from 'path';

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Folder tempat file akan disimpan
        cb(null, 'uploads/profiles');
    },
    filename: function (req, file, cb) {
        // Membuat nama file yang unik untuk menghindari duplikasi
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter untuk memastikan hanya file gambar yang di-upload
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Error: Hanya file gambar (jpeg, jpg, png) yang diizinkan!'));
};

const upload = multer({
    storage: storage,
    limits: {
        // Batas ukuran file 10MB
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: fileFilter
});

export default upload;