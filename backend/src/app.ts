import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import { db } from "./config/db";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "API działa v2 " });
});

app.get("/test-db", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS ok");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error", error: err });
  }
});

app.use("/api/auth", authRoutes);

export default app;