import { Response } from "express";
import { ResultSetHeader, RowDataPacket, PoolConnection } from "mysql2/promise";
import { AuthRequest } from "../middleware/authMiddleware";
import { generateSecurityTest } from "../services/testService";
import { db } from "../config/db";

const TEST_DURATION_MINUTES = 0.5;
const TEST_DURATION_MS = TEST_DURATION_MINUTES * 60 * 1000;

type TestStatus = "generated" | "started" | "finished" | "expired";
type AttemptStatus = "in_progress" | "finished" | "expired";

type GenerateTestBody = {
  questionCount?: number;
};

type SaveAnswerBody = {
  attemptId: number;
  questionId: number;
  selectedAnswer: number;
};

type TestIdParams = {
  id: string;
};

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
  status: TestStatus;
};

type OwnedTestRow = RowDataPacket & {
  id: number;
  title: string;
  status: TestStatus;
};

type SaveAnswerAttemptRow = RowDataPacket & {
  id: number;
  user_id: number;
  test_id: number;
  status: AttemptStatus;
  expires_at: Date;
};

type AttemptQuestionRow = RowDataPacket & {
  question_id: number;
};

type QuestionWithAnswerRow = RowDataPacket & {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  selected_answer: number | null;
};

type SubmitRow = RowDataPacket & {
  question_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: number;
  explanation: string;
  selected_answer: number | null;
};

type AttemptRow = RowDataPacket & {
  id: number;
  started_at: Date;
  expires_at: Date;
  status: AttemptStatus;
};

const getUserIdOrRespond = (req: AuthRequest, res: Response): number | null => {
  if (!req.user?.userId) {
    res.status(401).json({
      message: "Not authorized",
    });
    return null;
  }

  return req.user.userId;
};

const parsePositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

export const generateTest = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdOrRespond(req, res);
  if (!userId) {
    return;
  }

  let connection: PoolConnection | null = null;

  try {
    const body = req.body as GenerateTestBody;
    const questionCount = Number(body?.questionCount ?? 5);

    if (
      !Number.isInteger(questionCount) ||
      questionCount < 1 ||
      questionCount > 10
    ) {
      return res.status(400).json({
        message: "questionCount must be between 1 and 10",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [existingTests] = await connection.query<ExistingTestRow[]>(
      `SELECT id
       FROM tests
       WHERE user_id = ?
         AND status IN ('generated', 'started')
       LIMIT 1`,
      [userId],
    );

    if (existingTests.length > 0) {
      await connection.rollback();

      return res.status(400).json({
        message: "You already have an active test",
      });
    }

    const test = await generateSecurityTest(questionCount);

    const [testInsertResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO tests (user_id, title, status)
       VALUES (?, ?, 'generated')`,
      [userId, test.title],
    );

    const testId = testInsertResult.insertId;

    for (const question of test.questions) {
      await connection.query<ResultSetHeader>(
        `INSERT INTO test_questions
          (
            test_id,
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer,
            explanation
          )
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
        ],
      );
    }

    await connection.commit();

    return res.status(200).json({
      message: "Test generated successfully",
      test: {
        id: testId,
        title: test.title,
        status: "generated" as TestStatus,
      },
    });
  } catch (error: unknown) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Generate test error:", error);

    return res.status(500).json({
      message: "Failed to generate test",
    });
  } finally {
    connection?.release();
  }
};

export const startTest = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdOrRespond(req, res);
  if (!userId) {
    return;
  }

  try {
    const params = req.params as TestIdParams;
    const testId = parsePositiveInt(params.id);

    if (!testId) {
      return res.status(400).json({
        message: "Invalid test id",
      });
    }

    const [ownedTests] = await db.query<OwnedTestRow[]>(
      `SELECT id, title, status
       FROM tests
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [testId, userId],
    );

    if (ownedTests.length === 0) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    const test = ownedTests[0];

    if (test.status === "finished" || test.status === "expired") {
      return res.status(400).json({
        message: "This test can no longer be started",
      });
    }

    const [existingAttempts] = await db.query<ExistingAttemptRow[]>(
      `SELECT id, expires_at
       FROM test_attempts
       WHERE test_id = ?
         AND user_id = ?
         AND status = 'in_progress'
       LIMIT 1`,
      [testId, userId],
    );

    if (existingAttempts.length > 0) {
      return res.status(200).json({
        message: "Test already started",
        attemptId: existingAttempts[0].id,
        expiresAt: existingAttempts[0].expires_at,
      });
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + TEST_DURATION_MS);

    const [attemptInsertResult] = await db.query<ResultSetHeader>(
      `INSERT INTO test_attempts (test_id, user_id, started_at, expires_at, status)
       VALUES (?, ?, ?, ?, 'in_progress')`,
      [testId, userId, startedAt, expiresAt],
    );

    await db.query<ResultSetHeader>(
      `UPDATE tests
       SET status = 'started'
       WHERE id = ? AND user_id = ?`,
      [testId, userId],
    );

    return res.status(201).json({
      message: "Test started",
      attemptId: attemptInsertResult.insertId,
      expiresAt,
    });
  } catch (error: unknown) {
    console.error("Start test error:", error);

    return res.status(500).json({
      message: "Failed to start test",
    });
  }
};

export const getCurrentTest = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdOrRespond(req, res);
  if (!userId) {
    return;
  }

  try {
    const [rows] = await db.query<CurrentTestRow[]>(
      `SELECT id, title, status
       FROM tests
       WHERE user_id = ?
         AND status IN ('generated', 'started')
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
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
  } catch (error: unknown) {
    console.error("Get current test error:", error);

    return res.status(500).json({
      message: "Failed to get current test",
    });
  }
};

export const getTestById = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdOrRespond(req, res);
  if (!userId) {
    return;
  }

  try {
    const params = req.params as TestIdParams;
    const testId = parsePositiveInt(params.id);

    if (!testId) {
      return res.status(400).json({
        message: "Invalid test id",
      });
    }

    const [ownedTests] = await db.query<OwnedTestRow[]>(
      `SELECT id, title, status
       FROM tests
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [testId, userId],
    );

    if (ownedTests.length === 0) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    const [questions] = await db.query<QuestionWithAnswerRow[]>(
      `SELECT
         q.id,
         q.question_text,
         q.option_a,
         q.option_b,
         q.option_c,
         q.option_d,
         a.selected_answer
       FROM test_questions q
       LEFT JOIN test_answers a
         ON q.id = a.question_id
         AND a.attempt_id = (
           SELECT id
           FROM test_attempts
           WHERE test_id = ?
             AND user_id = ?
             AND status = 'in_progress'
           LIMIT 1
         )
       WHERE q.test_id = ?`,
      [testId, userId, testId],
    );

    const formattedQuestions = questions.map((question) => ({
      id: question.id,
      question: question.question_text,
      options: [
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d,
      ],
      selectedAnswer: question.selected_answer,
    }));

    return res.status(200).json({
      test: {
        id: ownedTests[0].id,
        title: ownedTests[0].title,
        status: ownedTests[0].status,
        questions: formattedQuestions,
      },
    });
  } catch (error: unknown) {
    console.error("Get test error:", error);

    return res.status(500).json({
      message: "Failed to get test",
    });
  }
};

export const saveAnswer = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdOrRespond(req, res);
  if (!userId) {
    return;
  }

  try {
    const body = req.body as SaveAnswerBody;

    const attemptId = parsePositiveInt(body?.attemptId);
    const questionId = parsePositiveInt(body?.questionId);
    const selectedAnswer = Number(body?.selectedAnswer);

    if (
      !attemptId ||
      !questionId ||
      !Number.isInteger(selectedAnswer) ||
      selectedAnswer < 0 ||
      selectedAnswer > 3
    ) {
      return res.status(400).json({
        message: "Invalid answer payload",
      });
    }

    const [attemptRows] = await db.query<SaveAnswerAttemptRow[]>(
      `SELECT id, user_id, test_id, status, expires_at
       FROM test_attempts
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [attemptId, userId],
    );

    if (attemptRows.length === 0) {
      return res.status(404).json({
        message: "Attempt not found",
      });
    }

    const attempt = attemptRows[0];

    if (attempt.status !== "in_progress") {
      return res.status(400).json({
        message: "Test is no longer active",
      });
    }

    if (new Date() > new Date(attempt.expires_at)) {
      await db.query<ResultSetHeader>(
        `UPDATE test_attempts
         SET status = 'expired'
         WHERE id = ?`,
        [attemptId],
      );

      await db.query<ResultSetHeader>(
        `UPDATE tests
         SET status = 'expired'
         WHERE id = ? AND user_id = ?`,
        [attempt.test_id, userId],
      );

      return res.status(400).json({
        message: "Time is up. You can no longer change answers.",
      });
    }

    const [questionRows] = await db.query<AttemptQuestionRow[]>(
      `SELECT q.id AS question_id
       FROM test_questions q
       INNER JOIN test_attempts a ON a.test_id = q.test_id
       WHERE a.id = ?
         AND a.user_id = ?
         AND q.id = ?
       LIMIT 1`,
      [attemptId, userId, questionId],
    );

    if (questionRows.length === 0) {
      return res.status(400).json({
        message: "Question does not belong to this test attempt",
      });
    }

    await db.query<ResultSetHeader>(
      `INSERT INTO test_answers (attempt_id, question_id, selected_answer)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE selected_answer = VALUES(selected_answer)`,
      [attemptId, questionId, selectedAnswer],
    );

    return res.status(200).json({
      message: "Answer saved",
    });
  } catch (error: unknown) {
    console.error("Save answer error:", error);

    return res.status(500).json({
      message: "Failed to save answer",
    });
  }
};

export const submitTest = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdOrRespond(req, res);
  if (!userId) {
    return;
  }

  let connection: PoolConnection | null = null;

  try {
    const params = req.params as TestIdParams;
    const testId = parsePositiveInt(params.id);

    if (!testId) {
      return res.status(400).json({
        message: "Invalid test id",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [attempts] = await connection.query<AttemptRow[]>(
      `SELECT id, started_at, expires_at, status
       FROM test_attempts
       WHERE test_id = ?
         AND user_id = ?
         AND status = 'in_progress'
       LIMIT 1`,
      [testId, userId],
    );

    if (attempts.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "No active attempt found",
      });
    }

    const attempt = attempts[0];
    const now = new Date();

    const isExpired = now.getTime() > new Date(attempt.expires_at).getTime();

    const [rows] = await connection.query<SubmitRow[]>(
      `SELECT
         q.id AS question_id,
         q.question_text,
         q.option_a,
         q.option_b,
         q.option_c,
         q.option_d,
         q.correct_answer,
         q.explanation,
         a.selected_answer
       FROM test_questions q
       LEFT JOIN test_answers a
         ON q.id = a.question_id
         AND a.attempt_id = ?
       WHERE q.test_id = ?`,
      [attempt.id, testId],
    );

    let correctCount = 0;

    const results = rows.map((row) => {
      const isCorrect = row.selected_answer === row.correct_answer;

      if (isCorrect) {
        correctCount += 1;
      }

      return {
        questionId: row.question_id,
        question: row.question_text,
        options: [row.option_a, row.option_b, row.option_c, row.option_d],
        selectedAnswer: row.selected_answer,
        correctAnswer: row.correct_answer,
        isCorrect,
        explanation: row.explanation,
      };
    });

    const totalQuestions = rows.length;
    const maxTimeMs = TEST_DURATION_MS;

    const timeUsedMs = Math.max(
      0,
      Math.min(
        now.getTime() - new Date(attempt.started_at).getTime(),
        maxTimeMs,
      ),
    );

    const timeLeftMs = Math.max(0, maxTimeMs - timeUsedMs);
    const timeBonus = isExpired ? 0 : Math.round((timeLeftMs / maxTimeMs) * 10);
    const score = correctCount + timeBonus;

    await connection.query<ResultSetHeader>(
      `UPDATE test_attempts
       SET status = ?,
           finished_at = ?,
           score = ?
       WHERE id = ?`,
      [isExpired ? "expired" : "finished", now, score, attempt.id],
    );

    await connection.query<ResultSetHeader>(
      `UPDATE tests
       SET status = ?
       WHERE id = ? AND user_id = ?`,
      [isExpired ? "expired" : "finished", testId, userId],
    );

    await connection.query<ResultSetHeader>(
      `DELETE FROM tests
       WHERE user_id = ?
         AND status IN ('finished', 'expired')
         AND id NOT IN (
           SELECT test_id FROM (
             SELECT ta.test_id
             FROM test_attempts ta
             INNER JOIN tests t ON t.id = ta.test_id
             WHERE ta.user_id = ?
               AND ta.status = 'finished'
               AND t.status = 'finished'
             ORDER BY ta.finished_at DESC
             LIMIT 5
           ) AS latest_tests
         )`,
      [userId, userId],
    );

    await connection.query<ResultSetHeader>(
      `UPDATE users
       SET
         tests_completed = tests_completed + 1,
         best_score = GREATEST(best_score, ?),
         average_score = (
           (average_score * tests_completed) + ?
         ) / (tests_completed + 1)
       WHERE id = ?`,
      [score, score, userId],
    );

    await connection.commit();

    return res.status(200).json({
      message: "Test submitted successfully",
      summary: {
        totalQuestions,
        correctAnswers: correctCount,
        timeBonus,
        score,
        expired: isExpired,
      },
      results,
    });
  } catch (error: unknown) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Submit test error:", error);

    return res.status(500).json({
      message: "Failed to submit test",
    });
  } finally {
    connection?.release();
  }
};
