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
      "explanation": "Short explanation"
    }
  ]
}

Rules:
- exactly ${questionCount} questions
- exactly 4 options per question
- correctAnswer must be a number from 0 to 3
- one correct answer only
- short explanation for each question
- no markdown
- no extra text
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