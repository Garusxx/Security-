import { Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { AuthRequest } from "../middleware/authMiddleware";
import { generateSecurityTest } from "../services/testService";
import { db } from "../config/db";

type ExistingTestRow = RowDataPacket & {
  id: number;
};

type ExistingAttemptRow = RowDataPacket & {
  id: number;
  expires_at: Date;
};

type CurrentTestRow = RowDataPacket & {
  id: number;
  title: string;
  status: "generated" | "started" | "finished" | "expired";
};

type OwnedTestRow = RowDataPacket & {
  id: number;
  title: string;
  status: "generated" | "started" | "finished" | "expired";
};

type QuestionRow = RowDataPacket & {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
};

export const generateTest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const questionCount = Number(req.body?.questionCount ?? 5);

    if (
      !Number.isInteger(questionCount) ||
      questionCount < 1 ||
      questionCount > 10
    ) {
      return res.status(400).json({
        message: "questionCount must be between 1 and 10",
      });
    }

    const [existingTests] = await db.query<ExistingTestRow[]>(
      `SELECT id
       FROM tests
       WHERE user_id = ?
         AND status IN ('generated', 'started')
       LIMIT 1`,
      [req.user.userId]
    );

    if (existingTests.length > 0) {
      return res.status(400).json({
        message: "You already have an active test",
      });
    }

    const test = await generateSecurityTest(questionCount);

    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO tests (user_id, title) VALUES (?, ?)",
      [req.user.userId, test.title]
    );

    const testId = result.insertId;

    for (const question of test.questions) {
      await db.query(
        `INSERT INTO test_questions
        (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testId,
          question.question,
          question.options[0],
          question.options[1],
          question.options[2],
          question.options[3],
          question.correctAnswer,
          question.explanation,
        ]
      );
    }

    return res.status(200).json({
      message: "Test generated successfully",
      test: {
        id: testId,
        title: test.title,
        status: "generated",
      },
    });
  } catch (error) {
    console.error("Generate test error:", error);

    return res.status(500).json({
      message: "Failed to generate test",
    });
  }
};

export const startTest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const testId = Number(req.params.id);

    if (!Number.isInteger(testId) || testId <= 0) {
      return res.status(400).json({
        message: "Invalid test id",
      });
    }

    const [ownedTests] = await db.query<OwnedTestRow[]>(
      `SELECT id, title, status
       FROM tests
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [testId, req.user.userId]
    );

    if (ownedTests.length === 0) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    const [existingAttempts] = await db.query<ExistingAttemptRow[]>(
      `SELECT id, expires_at
       FROM test_attempts
       WHERE test_id = ?
         AND user_id = ?
         AND status = 'in_progress'
       LIMIT 1`,
      [testId, req.user.userId]
    );

    if (existingAttempts.length > 0) {
      return res.status(200).json({
        message: "Test already started",
        attemptId: existingAttempts[0].id,
        expiresAt: existingAttempts[0].expires_at,
      });
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + 30 * 60 * 1000);

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO test_attempts (test_id, user_id, started_at, expires_at)
       VALUES (?, ?, ?, ?)`,
      [testId, req.user.userId, startedAt, expiresAt]
    );

    await db.query(
      `UPDATE tests
       SET status = 'started'
       WHERE id = ? AND user_id = ?`,
      [testId, req.user.userId]
    );

    return res.status(201).json({
      message: "Test started",
      attemptId: result.insertId,
      expiresAt,
    });
  } catch (error) {
    console.error("Start test error:", error);

    return res.status(500).json({
      message: "Failed to start test",
    });
  }
};

export const getCurrentTest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const [rows] = await db.query<CurrentTestRow[]>(
      `SELECT id, title, status
       FROM tests
       WHERE user_id = ?
         AND status IN ('generated', 'started')
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.userId]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        test: null,
      });
    }

    return res.status(200).json({
      test: {
        id: rows[0].id,
        title: rows[0].title,
        status: rows[0].status,
      },
    });
  } catch (error) {
    console.error("Get current test error:", error);

    return res.status(500).json({
      message: "Failed to get current test",
    });
  }
};

export const getTestById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const testId = Number(req.params.id);

    if (!Number.isInteger(testId) || testId <= 0) {
      return res.status(400).json({
        message: "Invalid test id",
      });
    }

    const [ownedTests] = await db.query<OwnedTestRow[]>(
      `SELECT id, title, status
       FROM tests
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [testId, req.user.userId]
    );

    if (ownedTests.length === 0) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    const [questions] = await db.query<QuestionRow[]>(
      `SELECT id, question_text, option_a, option_b, option_c, option_d
       FROM test_questions
       WHERE test_id = ?`,
      [testId]
    );

    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      question: q.question_text,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
    }));

    return res.status(200).json({
      test: {
        id: ownedTests[0].id,
        title: ownedTests[0].title,
        status: ownedTests[0].status,
        questions: formattedQuestions,
      },
    });
  } catch (error) {
    console.error("Get test error:", error);

    return res.status(500).json({
      message: "Failed to get test",
    });
  }
};