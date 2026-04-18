import { useState, useEffect } from "react";
import TestProgressBar from "./TestProgressBar";
import "../style/testRunner.css";

type Question = {
  id: number;
  question: string;
  options: string[];
  selectedAnswer: number | null;
};

type SubmitSummary = {
  totalQuestions: number;
  correctAnswers: number;
  timeBonus: number;
  score: number;
};

type SubmitResultItem = {
  questionId: number;
  question: string;
  options: string[];
  selectedAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
};

type SubmitResponse = {
  message: string;
  summary: SubmitSummary;
  results: SubmitResultItem[];
};

type TestRunnerProps = {
  questions: Question[];
  timeLeft: number;
  attemptId: number | null;
  testId: number;
};

const TestRunner = ({
  questions,
  timeLeft,
  attemptId,
  testId,
}: TestRunnerProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isTimeUp = timeLeft <= 0;

  useEffect(() => {
    const initialAnswers: Record<number, number> = {};

    questions.forEach((question) => {
      if (question.selectedAnswer !== null) {
        initialAnswers[question.id] = question.selectedAnswer;
      }
    });

    setAnswers(initialAnswers);
  }, [questions]);

  const minutes = Math.floor(timeLeft / 1000 / 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  const answeredCount = Object.keys(answers).length;
  const allQuestionsAnswered = answeredCount === questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  const parseExplanation = (explanation: string) => {
    const whyMatch = explanation.match(
      /Why\s*:\s*([\s\S]*?)(?=Memory\s*hook\s*:|Trap\s*:|$)/i,
    );
    const memoryHookMatch = explanation.match(
      /Memory\s*hook\s*:\s*([\s\S]*?)(?=Trap\s*:|$)/i,
    );
    const trapMatch = explanation.match(/Trap\s*:\s*([\s\S]*)/i);

    return {
      why: whyMatch?.[1]?.trim() ?? "",
      memoryHook: memoryHookMatch?.[1]?.trim() ?? "",
      trap: trapMatch?.[1]?.trim() ?? "",
    };
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSelectAnswer = async (
    questionId: number,
    optionIndex: number,
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));

    if (!attemptId) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tests/answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            attemptId,
            questionId,
            selectedAnswer: optionIndex,
          }),
        },
      );

      if (!res.ok) {
        const data: { message?: string } = await res.json();
        throw new Error(data.message || "Failed to save answer");
      }
    } catch (error) {
      console.error("Save answer failed:", error);
    }
  };

  const handleSubmitTest = async () => {
    if (submitting || result) return;

    try {
      setSubmitting(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tests/${testId}/submit`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data: SubmitResponse & { message?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Submit failed");
      }

      setResult(data);
    } catch (error) {
      console.error("Submit test failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="test-runner">
        <h2 className="test-runner__result-title">Test Result</h2>

        <div className="test-runner__result-summary">
          <p>
            <strong>Score:</strong> {result.summary.score}
          </p>
          <p>
            <strong>Correct:</strong> {result.summary.correctAnswers} /{" "}
            {result.summary.totalQuestions}
          </p>
          <p>
            <strong>Time bonus:</strong> {result.summary.timeBonus}
          </p>
        </div>

        <div className="test-runner__review">
          <h3>Review</h3>

          {result.results.filter((item) => !item.isCorrect).length === 0 ? (
            <p>Perfect score — all answers were correct.</p>
          ) : (
            result.results
              .filter((item) => !item.isCorrect)
              .map((item) => {
                const parsed = parseExplanation(item.explanation);

                return (
                  <div
                    key={item.questionId}
                    className="test-runner__review-card"
                  >
                    <p className="test-runner__review-question">
                      {item.question}
                    </p>

                    <p>
                      <strong>Your answer:</strong>{" "}
                      {item.selectedAnswer !== null
                        ? item.options[item.selectedAnswer]
                        : "No answer"}
                    </p>

                    <p>
                      <strong>Correct answer:</strong>{" "}
                      {item.options[item.correctAnswer]}
                    </p>

                    <div className="test-runner__explanation-blocks">
                      {parsed.why && (
                        <div className="test-runner__explanation-item">
                          <span>💡</span>
                          <div>
                            <strong>Why:</strong> {parsed.why}
                          </div>
                        </div>
                      )}

                      {parsed.memoryHook && (
                        <div className="test-runner__explanation-item">
                          <span>🧠</span>
                          <div>
                            <strong>Memory hook:</strong> {parsed.memoryHook}
                          </div>
                        </div>
                      )}

                      {parsed.trap && (
                        <div className="test-runner__explanation-item">
                          <span>⚠️</span>
                          <div>
                            <strong>Trap:</strong> {parsed.trap}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>

        <div className="test-runner__result-actions">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="test-runner__button"
          >
            New Test
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0 || !currentQuestion) {
    return (
      <div className="test-runner">
        <p>No questions available.</p>
      </div>
    );
  }

  return (
    <div className="test-runner">
      <div className="test-runner__top">
        <p className="test-runner__timer">
          Time left: {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
        <p className="test-runner__progress">
          {currentQuestionIndex + 1} / {questions.length}
        </p>
      </div>

      {isTimeUp && (
        <p className="test-runner__time-up">
          Time is up. You can no longer change answers.
        </p>
      )}

      <div className="question-card">
        <h3>
          {currentQuestionIndex + 1}. {currentQuestion.question}
        </h3>

        <div className="question-card__options">
          {currentQuestion.options.map((option, i) => (
            <label key={i} className="question-card__option">
              <input
                type="radio"
                checked={answers[currentQuestion.id] === i}
                disabled={isTimeUp}
                onChange={() => handleSelectAnswer(currentQuestion.id, i)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>

      <TestProgressBar
        totalQuestions={questions.length}
        answeredQuestions={answeredCount}
      />

      <div className="test-runner__actions">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || isTimeUp}
          className="test-runner__button"
        >
          Previous
        </button>

        {currentQuestionIndex < questions.length - 1 && !isTimeUp ? (
          <button onClick={handleNext} className="test-runner__button">
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmitTest}
            disabled={submitting || (!allQuestionsAnswered && !isTimeUp)}
            className="test-runner__button"
          >
            {submitting ? "Submitting..." : "Finish Test"}
          </button>
        )}
      </div>

      {!allQuestionsAnswered && !isTimeUp && (
        <p className="test-runner__finish-hint">
          Answer all questions to unlock Finish Test.
        </p>
      )}
    </div>
  );
};

export default TestRunner;
