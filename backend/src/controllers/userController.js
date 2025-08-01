import db from '../../models/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import bcrypt from 'bcrypt';

const Admin = db.Admin;
const Peserta = db.Peserta;

// Middleware untuk memastikan hanya admin yang bisa akses
export const restrictToAdmin = (req, res, next) => {
    if (req.userType !== 'admin') {
        return sendError(res, 'Anda tidak memiliki izin untuk melakukan aksi ini.', 403);
    }
    next();
};

/**
 * Mendapatkan semua data admin (hanya untuk admin).
 */
export const getAllAdmins = catchAsync(async (req, res, next) => {
    const admins = await Admin.findAll({
        attributes: { exclude: ['password'] } // Jangan kirim password
    });
    sendSuccess(res, 'Data semua admin berhasil diambil.', admins);
});

/**
 * Mengedit profil admin yang sedang login.
 */
export const editAdminProfile = catchAsync(async (req, res, next) => {
    const { nama_admin, bio, password } = req.body;
    const adminId = req.user.admin_id;

    const admin = await Admin.findByPk(adminId);
    if (!admin) return sendError(res, 'Admin tidak ditemukan.', 404);

    admin.nama_admin = nama_admin || admin.nama_admin;
    admin.bio = bio || admin.bio;

    // Jika ada password baru, hash dan update
    if (password) {
        admin.password = await bcrypt.hash(password, 12);
    }

    await admin.save();

    const responseData = {
        admin_id: admin.admin_id,
        nama_admin: admin.nama_admin,
        email: admin.email,
        bio: admin.bio,
        url_profile_photo: admin.url_profile_photo,
        actived: admin.actived,
        timezone: admin.timezone
    };

    sendSuccess(res, 'Profil berhasil diperbarui.', responseData);
});

/**
 * Mengedit profil peserta yang sedang login.
 */
export const editPesertaProfile = catchAsync(async (req, res, next) => {
    const { nama_peserta, password } = req.body;
    const userId = req.user.user_id;

    const peserta = await Peserta.findByPk(userId);
    if (!peserta) return sendError(res, 'Peserta tidak ditemukan.', 404);

    peserta.nama_peserta = nama_peserta || peserta.nama_peserta;

    if (password) {
        peserta.password = await bcrypt.hash(password, 12);
    }

    await peserta.save();

    const responseData = {
        user_id: peserta.user_id,
        nama_peserta: peserta.nama_peserta,
        email: peserta.email,
        url_profile_photo: peserta.url_profile_photo,
    };

    sendSuccess(res, 'Profil berhasil diperbarui.', responseData);
});