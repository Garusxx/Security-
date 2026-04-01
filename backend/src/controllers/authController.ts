import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../config/db";

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Check if all required fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Normalize input data
    const normalizedUsername = username.trim();
    const normalizedEmail = email.toLowerCase().trim();

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists by email or username
    const [existingUsers]: any = await db.query(
      "SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1",
      [normalizedEmail, normalizedUsername]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        message: "User with this email or username already exists",
      });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [normalizedUsername, normalizedEmail, hashedPassword]
    );

    return res.status(201).json({
      message: "User created successfully",
    });
  } catch (error: any) {
    console.error("Signup error:", error);

    // Handle duplicate entry errors from MySQL
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