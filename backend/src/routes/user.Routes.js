import express from 'express';
import { verify_token } from '../middlewares/authMiddleware.js';
import { 
    getAllAdmins, 
    editAdminProfile, 
    editPesertaProfile, 
    restrictToAdmin 
} from '../controllers/userController.js';

const router = express.Router();

// Semua rute di bawah ini memerlukan login
router.use(verify_token);

// Rute khusus Admin
router.get('/admins', restrictToAdmin, getAllAdmins);
router.put('/admin/profile', restrictToAdmin, editAdminProfile);

// Rute khusus Peserta
router.put('/peserta/profile', editPesertaProfile);

export default router;