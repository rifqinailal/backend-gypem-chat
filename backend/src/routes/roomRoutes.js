import express from "express";
import multer from "multer";
import path from "path";
import Joi from "joi";
import { validate } from "../utils/apiResponse.js";
import { verify_token } from "../middlewares/authMiddleware.js";
import {
  getAllRooms,
  getRoomDetail,
  createPrivateRoom,
  createGroupRoom,
  editGroupRoom,
  joinGroup,
  leaveGroup,
  deleteRooms,
  pinRooms,
  unpinRooms,
  getPinnedRooms,
} from "../controllers/roomController.js";

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name =
      file.fieldname + "-" + Date.now() + Math.round(Math.random() * 1e9);
    cb(null, name + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Hanya file gambar yang diperbolehkan!"), false);
    }
    cb(null, true);
  },
});

const positiveInt = Joi.number().integer().positive();
const paramsRoomIdSchema = Joi.object({ roomId: positiveInt.required() });
const paramsRoomMemberIdSchema = Joi.object({
  roomMemberId: positiveInt.required(),
});
const bodyRoomMemberIdArray = Joi.object({
  room_member_id: Joi.array().items(positiveInt).min(1).single().required(),
})
  .options({ stripUnknown: true })
  .custom((value, helpers) => {
    if (!Array.isArray(value.room_member_id)) {
      value.room_member_id = [value.room_member_id];
    }
    return value;
  });
const bodyCreatePrivateSchema = Joi.object({
  target_admin_id: positiveInt.required(),
});
const bodyCreateGroupSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  description: Joi.string().allow("", null)
}).unknown(true);
const queryJoinSchema = Joi.object({
  token: Joi.string().trim().min(1).required(),
});

router.use(verify_token);

router.get("/", getAllRooms);
router.get("/pinned", getPinnedRooms);
router.post(
  "/privates",
  validate(bodyCreatePrivateSchema, "body", 400),
  createPrivateRoom
);
router.post(
  "/groups",
  upload.single("file"),
  validate(bodyCreateGroupSchema, "body", 400),
  createGroupRoom
);
router.post("/join", validate(queryJoinSchema, "query", 400), joinGroup);
router.post(
  "/delete",
  validate(bodyRoomMemberIdArray, "body", 400),
  deleteRooms
);
router.post("/pin", validate(bodyRoomMemberIdArray, "body", 400), pinRooms);
router.post(
  "/unpin",
  validate(bodyRoomMemberIdArray, "body", 400),
  unpinRooms
);
router.get(
  "/:roomId",
  validate(paramsRoomIdSchema, "params", 400),
  getRoomDetail
);
router.patch(
  "/:roomId",
  upload.single("file"),
  validate(paramsRoomIdSchema, "params", 400),
  editGroupRoom
);
router.delete(
  "/:roomMemberId/leave",
  validate(paramsRoomMemberIdSchema, "params", 400),
  leaveGroup
);

export default router;
