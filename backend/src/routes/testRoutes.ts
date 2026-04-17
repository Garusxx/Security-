import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { generateTest, startTest, getCurrentTest, getTestById, saveAnswer, submitTest } from "../controllers/testController";

const router = Router();

router.post("/generate", protect, generateTest);
router.post("/:id/start",protect, startTest);
router.get("/current", protect, getCurrentTest);
router.get("/:id", protect, getTestById);
router.post("/answer", protect, saveAnswer);
router.post("/:id/submit", protect, submitTest);

export default router;