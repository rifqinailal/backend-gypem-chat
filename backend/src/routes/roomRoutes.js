import express from "express";
import multer from "multer";
import path from "path";
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

router.use(verify_token);

router.get("/", getAllRooms);
router.post("/privates", createPrivateRoom);
router.post("/groups", upload.single("file"), createGroupRoom);
router.post("/join", joinGroup);
router.post("/delete", deleteRooms);
router.post("/pin", pinRooms);
router.post("/unpin", unpinRooms);
router.get("/pinned", getPinnedRooms);
router.get("/:roomId", getRoomDetail);
router.patch("/:roomId", upload.single("file"), editGroupRoom);
router.delete("/:roomMemberId/leave", leaveGroup);

export default router;
