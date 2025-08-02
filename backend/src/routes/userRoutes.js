import express from 'express';
import Joi from 'joi';
import { verify_token } from '../middlewares/authMiddleware.js';
import { sendError } from '../utils/apiResponse.js';
import { editAdminProfile, editPesertaProfile } from '../controllers/userController.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

const editAdminSchema = Joi.object({
  nama_admin: Joi.string().min(3),
  bio: Joi.string().allow('', null),
});

const editPesertaSchema = Joi.object({
    nama_peserta: Joi.string().min(3),
});

const validateRequest = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return sendError(res, error.details[0].message, 400);
    }
    next();
};

// Rute untuk edit profil admin: PATCH /api/users/admin/profile
router.patch('/admin/profile', verify_token, upload.single('url_profile_photo'), validateRequest(editAdminSchema), editAdminProfile);

// Rute untuk edit profil peserta: PATCH /api/users/peserta/profile
router.patch('/peserta/profile', verify_token, upload.single('url_profile_photo'), validateRequest(editPesertaSchema), editPesertaProfile);

export default router;