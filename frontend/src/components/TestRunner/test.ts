export type Question = {
  id: number;
  question: string;
  options: [string, string, string, string];
  selectedAnswer: number | null;
};

export type SubmitSummary = {
  totalQuestions: number;
  correctAnswers: number;
  timeBonus: number;
  score: number;
  expired?: boolean;
};

export type SubmitResultItem = {
  questionId: number;
  question: string;
  options: [string, string, string, string];
  selectedAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
};

export type SubmitResponse = {
  message: string;
  summary: SubmitSummary;
  results: SubmitResultItem[];
};

export type ApiMessageResponse = {
  message?: string;
};

export type TestRunnerProps = {
  questions: Question[];
  timeLeft: number;
  attemptId: number | null;
  testId: number;
};
