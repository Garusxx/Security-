import { Router } from "express";
import { signup } from "../controllers/authController";
import { login } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
import { getMe } from "../controllers/authController";
import { logout } from "../controllers/authController";

const router = Router();

// Register a new user
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;
