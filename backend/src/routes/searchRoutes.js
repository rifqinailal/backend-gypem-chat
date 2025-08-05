import express from "express";
import { verify_token } from "../middlewares/authMiddleware.js";
import { globalSearch, roomSearch } from "../controllers/searchController.js";

const router = express.Router();

router.use(verify_token);

router.get("/search", globalSearch);
router.get("/rooms/:roomId/search", roomSearch);

export default router;
