import express from "express";
import multer from "multer";
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
} from "../controllers/roomController.js";

const router = express.Router();
const upload = multer({
  dest: "public/uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file gambar yang diperbolehkan!"), false);
    }
  },
});

router.use(verify_token);

router.get("/", getAllRooms);
router.get("/:roomId", getRoomDetail);
router.post("/privates", createPrivateRoom);
router.post("/groups", upload.single("file"), createGroupRoom);
router.patch("/:roomId", upload.single("file"), editGroupRoom);
router.post("/join", joinGroup);
router.delete("/:roomMemberId/leave", leaveGroup);
router.delete("/delete", deleteRooms);

export default router;
