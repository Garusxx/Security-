import { Router } from "express";
import { login, logout, getMe, signup } from "../controllers/authController";
import { getProfile } from "../controllers/profileController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// Register a new user
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.get("/profile", protect, getProfile);

export default router;
