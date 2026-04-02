import { Router } from "express";
import { signup } from "../controllers/authController";
import { login } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// Register a new user
router.post("/signup", signup);

router.post("/login", login);

router.get("/me", protect, (req, res) => {
  res.json({ message: "Protected route works" });
});

export default router;
