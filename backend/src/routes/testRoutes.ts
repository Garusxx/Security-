import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { generateTest, startTest, getCurrentTest, getTestById } from "../controllers/testController";

const router = Router();

router.post("/generate", protect, generateTest);
router.post("/:id/start",protect, startTest);
router.get("/current", protect, getCurrentTest);
router.get("/:id", protect, getTestById);

export default router;