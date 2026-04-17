import { Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { AuthRequest } from "../middleware/authMiddleware";
import { generateSecurityTest } from "../services/testService";
import { db } from "../config/db";

const TEST_DURATION_MS = 0.5 * 60 * 1000;

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

type SaveAnswerAttemptRow = RowDataPacket & {
  id: number;
  user_id: number;
  status: "in_progress" | "finished" | "expired";
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
  status: "in_progress" | "finished" | "expired";
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
      [req.user.userId],
    );

    if (existingTests.length > 0) {
      return res.status(400).json({
        message: "You already have an active test",
      });
    }

    const test = await generateSecurityTest(questionCount);

    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO tests (user_id, title) VALUES (?, ?)",
      [req.user.userId, test.title],
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
        ],
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
      [testId, req.user.userId],
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
      [testId, req.user.userId],
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

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO test_attempts (test_id, user_id, started_at, expires_at)
       VALUES (?, ?, ?, ?)`,
      [testId, req.user.userId, startedAt, expiresAt],
    );

    await db.query(
      `UPDATE tests
       SET status = 'started'
       WHERE id = ? AND user_id = ?`,
      [testId, req.user.userId],
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
      [req.user.userId],
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
      [testId, req.user.userId],
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
      [testId, req.user.userId, testId],
    );

    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      question: q.question_text,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      selectedAnswer: q.selected_answer,
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

export const saveAnswer = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const attemptId = Number(req.body?.attemptId);
    const questionId = Number(req.body?.questionId);
    const selectedAnswer = Number(req.body?.selectedAnswer);

    if (
      !Number.isInteger(attemptId) ||
      !Number.isInteger(questionId) ||
      !Number.isInteger(selectedAnswer) ||
      selectedAnswer < 0 ||
      selectedAnswer > 3
    ) {
      return res.status(400).json({
        message: "Invalid answer payload",
      });
    }

    const [attemptRows] = await db.query<SaveAnswerAttemptRow[]>(
      `SELECT id, user_id, status, expires_at
       FROM test_attempts
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [attemptId, req.user.userId],
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
      [attemptId, req.user.userId, questionId],
    );

    if (questionRows.length === 0) {
      return res.status(400).json({
        message: "Question does not belong to this test attempt",
      });
    }

    await db.query(
      `INSERT INTO test_answers (attempt_id, question_id, selected_answer)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE selected_answer = VALUES(selected_answer)`,
      [attemptId, questionId, selectedAnswer],
    );

    return res.status(200).json({
      message: "Answer saved",
    });
  } catch (error) {
    console.error("Save answer error:", error);

    return res.status(500).json({
      message: "Failed to save answer",
    });
  }
};

export const submitTest = async (req: AuthRequest, res: Response) => {
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

    const [attempts] = await db.query<AttemptRow[]>(
      `SELECT id, started_at, expires_at, status
       FROM test_attempts
       WHERE test_id = ?
         AND user_id = ?
         AND status = 'in_progress'
       LIMIT 1`,
      [testId, req.user.userId],
    );

    if (attempts.length === 0) {
      return res.status(404).json({
        message: "No active attempt found",
      });
    }

    const attempt = attempts[0];
    const now = new Date();

    const [rows] = await db.query<SubmitRow[]>(
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
    const timeBonus = Math.round((timeLeftMs / maxTimeMs) * 10);
    const score = correctCount + timeBonus;

    await db.query(
      `UPDATE test_attempts
       SET status = 'finished',
           finished_at = ?,
           score = ?
       WHERE id = ?`,
      [now, score, attempt.id],
    );

    await db.query(
      `UPDATE tests
       SET status = 'finished'
       WHERE id = ? AND user_id = ?`,
      [testId, req.user.userId],
    );

    await db.query(
      `UPDATE users
   SET
     tests_completed = tests_completed + 1,
     best_score = GREATEST(best_score, ?),
     average_score = (
       (
         average_score * tests_completed
       ) + ?
     ) / (tests_completed + 1)
   WHERE id = ?`,
      [score, score, req.user.userId],
    );

    return res.status(200).json({
      message: "Test submitted successfully",
      summary: {
        totalQuestions,
        correctAnswers: correctCount,
        timeBonus,
        score,
      },
      results,
    });
  } catch (error) {
    console.error("Submit test error:", error);

    return res.status(500).json({
      message: "Failed to submit test",
    });
  }
};
