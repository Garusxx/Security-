import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../config/db";

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Wszystkie pola są wymagane" });
    }

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, hash]
    );

    return res.status(201).json({ message: "User created" });
  } catch (err: any) {
    console.error(err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "User already exists" });
    }

    return res.status(500).json({ message: "Server error" });
  }
};