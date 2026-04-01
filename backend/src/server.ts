import dotenv from "dotenv";
import app from "./app";

import { db } from "./config/db";

dotenv.config();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
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