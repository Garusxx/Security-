import { Response } from "express";
import { RowDataPacket } from "mysql2";
import { db } from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

type ProfileRow = RowDataPacket & {
  id: number;
  username: string;
  avatar: string;
  best_score: number;
  average_score: number;
  tests_completed: number;
};

type RankRow = RowDataPacket & {
  user_rank: number;
};

type HistoryRow = RowDataPacket & {
  attempt_id: number;
  test_title: string;
  score: number;
  finished_at: Date;
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const [rows] = await db.query<ProfileRow[]>(
      `SELECT id, username, avatar, best_score, average_score, tests_completed
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const [rankRows] = await db.query<RankRow[]>(
      `SELECT COUNT(*) + 1 AS user_rank
       FROM users
       WHERE best_score > ?`,
      [rows[0].best_score],
    );

    const [historyRows] = await db.query<HistoryRow[]>(
      `SELECT
     ta.id AS attempt_id,
     t.title AS test_title,
     ta.score,
     ta.finished_at
   FROM test_attempts ta
   INNER JOIN tests t ON t.id = ta.test_id
   WHERE ta.user_id = ?
     AND ta.status = 'finished'
   ORDER BY ta.finished_at DESC
   LIMIT 5`,
      [req.user.userId],
    );

    return res.status(200).json({
      profile: {
        id: rows[0].id,
        username: rows[0].username,
        avatar: rows[0].avatar,
        bestScore: rows[0].best_score,
        averageScore: Number(rows[0].average_score),
        testsCompleted: rows[0].tests_completed,
        rank: rankRows[0].user_rank,
      },
      history: historyRows.map((item) => ({
        attemptId: item.attempt_id,
        title: item.test_title,
        score: item.score,
        finishedAt: item.finished_at,
      })),
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Failed to get profile",
    });
  }
};
