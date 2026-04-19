import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes";
import testRoutes from "./routes/testRoutes";

const app = express();

// middleware
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: (origin, callback) => {
      // brak origin (np. Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);

// health check
app.get("/", (_req, res) => {
  res.send("API is running");
});

export default app;
