import { Router } from "express";
import { signup } from "../controllers/authController";

const router = Router();

// Register a new user
router.post("/signup", signup);

export default router;