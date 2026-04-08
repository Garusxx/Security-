import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../config/db";
import { validatePassword } from "../utils/validatePassword";
import { generateToken } from "../utils/generateToken";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 * @access Public
 */
export const signup = async (req: Request, res: Response) => {
  try {
    // Extract user input from request body
    const { username, email, password } = req.body;

    // Ensure all required fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Normalize input data to ensure consistency
    const normalizedUsername = String(username).trim();
    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedPassword = String(password);

    // Double-check for empty values after normalization
    if (!normalizedUsername || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Validate username length
    if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
      return res.status(400).json({
        message: "Username must be between 3 and 30 characters",
      });
    }

    // Validate email format using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email address",
      });
    }

    // Validate password using helper function
    const passwordError = validatePassword(normalizedPassword);

    if (passwordError) {
      return res.status(400).json({
        message: passwordError,
      });
    }

    // Check if a user with the same email or username already exists
    const [existingUsers]: any = await db.query(
      "SELECT id, email, username FROM users WHERE email = ? OR username = ? LIMIT 1",
      [normalizedEmail, normalizedUsername],
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];

      if (existingUser.email === normalizedEmail) {
        return res.status(400).json({
          message: "User with this email already exists",
        });
      }

      if (existingUser.username === normalizedUsername) {
        return res.status(400).json({
          message: "Username is already taken",
        });
      }

      return res.status(400).json({
        message: "User with this email or username already exists",
      });
    }

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    // Insert the new user into the database
    const [result]: any = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [normalizedUsername, normalizedEmail, hashedPassword],
    );

    const token = generateToken(result.insertId);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: result.insertId,
        username: normalizedUsername,
        email: normalizedEmail,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * @route POST /api/auth/login
 * @desc Authenticate user
 * @access Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Extract credentials from request body
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Normalize input
    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedPassword = String(password);

    // Find user by email
    const [users]: any = await db.query(
      "SELECT id, username, email, password_hash FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );

    // Do not reveal whether email exists
    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    // Compare provided password with stored hash
    const isPasswordValid = await bcrypt.compare(
      normalizedPassword,
      user.password_hash,
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user.id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const logout = async (_req: Request, res: Response) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user data was attached by the protect middleware
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    // Find user by ID from decoded token
    const [users]: any = await db.query(
      "SELECT id, username, email FROM users WHERE id = ? LIMIT 1",
      [req.user.userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: users[0],
    });
  } catch (error) {
    console.error("Get me error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
