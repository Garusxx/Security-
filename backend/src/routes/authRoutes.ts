import { Router } from "express";
import { signup } from "../controllers/authController";
import { login } from "../controllers/authController";

const router = Router();

// Register a new user
router.post("/signup", signup);

router.post("/login", login);

export default router;
