import { openai } from "../lib/openai";

export type GeneratedQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export type GeneratedTest = {
  title: string;
  questions: GeneratedQuestion[];
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
- explanation must be short and easy to remember
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
  const parsed = JSON.parse(text) as GeneratedTest;

  if (
    !parsed.title ||
    !Array.isArray(parsed.questions) ||
    parsed.questions.length !== questionCount
  ) {
    throw new Error("Invalid AI response structure");
  }

  return parsed;
};
