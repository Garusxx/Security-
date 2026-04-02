import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../config/db";
import { validatePassword } from "../utils/validatePassword";

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

      // Provide more specific error messages
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
    await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [normalizedUsername, normalizedEmail, hashedPassword],
    );

    // Return success response
    return res.status(201).json({
      message: "User created successfully",
    });
  } catch (error: any) {
    // Log error for debugging
    console.error("Signup error:", error);

    // Handle duplicate entry error from MySQL
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Fallback for unexpected errors
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * @route POST /api/auth/login
 * @desc Authenticate user (login)
 * @access Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Extract login credentials from request body
    const { username, password } = req.body;

    // (Login logic will be implemented later)
  } catch (error: any) {
    // Log error for debugging
    console.error("LogIn error:", error);
  }
};


