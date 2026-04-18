import { openai } from "../lib/openai";

export type GeneratedQuestion = {
  question: string;
  options: [string, string, string, string];
  correctAnswer: 0 | 1 | 2 | 3;
  explanation: string;
};

export type GeneratedTest = {
  title: string;
  questions: GeneratedQuestion[];
};

type RawGeneratedQuestion = {
  question?: unknown;
  options?: unknown;
  correctAnswer?: unknown;
  explanation?: unknown;
};

type RawGeneratedTest = {
  title?: unknown;
  questions?: unknown;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isValidCorrectAnswer = (value: unknown): value is 0 | 1 | 2 | 3 => {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 3
  );
};

const isValidOptionsTuple = (
  value: unknown,
): value is [string, string, string, string] => {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((option) => isNonEmptyString(option))
  );
};

const parseGeneratedQuestion = (
  value: unknown,
  index: number,
): GeneratedQuestion => {
  const question = value as RawGeneratedQuestion;

  if (!isNonEmptyString(question.question)) {
    throw new Error(`Invalid question text at index ${index}`);
  }

  if (!isValidOptionsTuple(question.options)) {
    throw new Error(`Invalid options at index ${index}`);
  }

  if (!isValidCorrectAnswer(question.correctAnswer)) {
    throw new Error(`Invalid correctAnswer at index ${index}`);
  }

  if (!isNonEmptyString(question.explanation)) {
    throw new Error(`Invalid explanation at index ${index}`);
  }

  return {
    question: question.question.trim(),
    options: question.options.map((option) => option.trim()) as [
      string,
      string,
      string,
      string,
    ],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation.trim(),
  };
};

const parseGeneratedTest = (
  text: string,
  questionCount: number,
): GeneratedTest => {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(text);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  const parsed = parsedJson as RawGeneratedTest;

  if (!isNonEmptyString(parsed.title)) {
    throw new Error("Invalid or missing test title");
  }

  if (!Array.isArray(parsed.questions)) {
    throw new Error("Invalid or missing questions array");
  }

  if (parsed.questions.length !== questionCount) {
    throw new Error(
      `Expected ${questionCount} questions, received ${parsed.questions.length}`,
    );
  }

  const questions = parsed.questions.map((question, index) =>
    parseGeneratedQuestion(question, index),
  );

  return {
    title: parsed.title.trim(),
    questions,
  };
};

export const generateSecurityTest = async (
  questionCount: number,
): Promise<GeneratedTest> => {
  const prompt = `
Generate a Security+ practice test.
Return only valid JSON in this exact structure:

{
  "title": "Security+ Practice Test",
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why: ... Memory hook: ... Trap: ..."
    }
  ]
}

Rules:
- exactly ${questionCount} questions
- exactly 4 options per question
- correctAnswer must be a number from 0 to 3
- one correct answer only
- no markdown
- no extra text
- no duplicate questions
- explanations must be concise and clear
- each explanation must use exactly this format:
  Why: one short sentence
  Memory hook: one short memorable phrase or analogy
  Trap: one short sentence explaining why a likely wrong answer is wrong
`;

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  const text = response.output_text;

  if (!isNonEmptyString(text)) {
    throw new Error("AI returned empty response");
  }

  return parseGeneratedTest(text, questionCount);
};