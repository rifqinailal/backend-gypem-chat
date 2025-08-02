import db from '../../models/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const Admin = db.Admin;
const Peserta = db.Peserta;

/**
 * Controller untuk mengedit profil Admin yang sedang login.
 */
export const editAdminProfile = catchAsync(async (req, res, next) => {
    const { nama_admin, bio } = req.body;
    const adminId = req.user.admin_id; // Ambil ID dari token

    const admin = await Admin.findByPk(adminId);

    if (!admin) {
        return sendError(res, 'Admin tidak ditemukan.', 404);
    }

    admin.nama_admin = nama_admin || admin.nama_admin;
    admin.bio = bio !== undefined ? bio : admin.bio;

    if (req.file) {
        // Simpan path file yang di-upload oleh multer
        admin.url_profile_photo = req.file.path;
    }

    await admin.save();

    // Hapus password dari response
    const responseData = admin.toJSON();
    delete responseData.password;

    sendSuccess(res, 'Profil admin berhasil diperbarui.', responseData, 200);
});

/**
 * Controller untuk mengedit profil Peserta yang sedang login.
 */
export const editPesertaProfile = catchAsync(async (req, res, next) => {
    const { nama_peserta } = req.body;
    const pesertaId = req.user.user_id; // Ambil ID dari token

    const peserta = await Peserta.findByPk(pesertaId);

    if (!peserta) {
        return sendError(res, 'Peserta tidak ditemukan.', 404);
    }

    peserta.nama_peserta = nama_peserta || peserta.nama_peserta;

    if (req.file) {
        // Simpan path file yang di-upload oleh multer
        peserta.url_profile_photo = req.file.path;
    }

    await peserta.save();

    // Hapus password dari response
    const responseData = peserta.toJSON();
    delete responseData.password;

    sendSuccess(res, 'Profil peserta berhasil diperbarui.', responseData, 200);
});