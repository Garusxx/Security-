import { useEffect, useRef, useState } from "react";
import "../style/testRunner.css";

type Question = {
  id: number;
  question: string;
  options: [string, string, string, string];
  selectedAnswer: number | null;
};

type SubmitSummary = {
  totalQuestions: number;
  correctAnswers: number;
  timeBonus: number;
  score: number;
  expired?: boolean;
};

type SubmitResultItem = {
  questionId: number;
  question: string;
  options: [string, string, string, string];
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

type ApiMessageResponse = {
  message?: string;
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
  const [savingQuestionId, setSavingQuestionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runnerRef = useRef<HTMLDivElement | null>(null);
  const initialTimeLeftRef = useRef<number>(Math.max(timeLeft, 0));

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

  useEffect(() => {
    const element = runnerRef.current;

    if (!element) {
      return;
    }

    const preventSelection = (event: Event) => {
      event.preventDefault();
    };

    element.addEventListener("selectstart", preventSelection);

    return () => {
      element.removeEventListener("selectstart", preventSelection);
    };
  }, []);

  useEffect(() => {
    if (initialTimeLeftRef.current <= 0 && timeLeft > 0) {
      initialTimeLeftRef.current = timeLeft;
    }
  }, [timeLeft]);

  const minutes = Math.max(0, Math.floor(timeLeft / 1000 / 60));
  const seconds = Math.max(0, Math.floor((timeLeft / 1000) % 60));

  const initialTimeLeft = Math.max(initialTimeLeftRef.current, 1);

  const timeRatio = Math.max(
    0,
    Math.min(1, timeLeft / initialTimeLeft),
  );

  const timerClassName =
    timeRatio <= 0.2
      ? "test-runner__timer test-runner__timer--danger"
      : timeRatio <= 0.5
        ? "test-runner__timer test-runner__timer--warning"
        : "test-runner__timer test-runner__timer--safe";

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

  const tryParseJson = async <T,>(res: Response): Promise<T | null> => {
    try {
      return (await res.json()) as T;
    } catch {
      return null;
    }
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
    if (!attemptId || isTimeUp || submitting || savingQuestionId === questionId) {
      return;
    }

    setError(null);

    const previousAnswer = answers[questionId];

    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));

    setSavingQuestionId(questionId);

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

      const data = await tryParseJson<ApiMessageResponse>(res);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to save answer");
      }
    } catch (error) {
      setAnswers((prev) => {
        const next = { ...prev };

        if (previousAnswer === undefined) {
          delete next[questionId];
        } else {
          next[questionId] = previousAnswer;
        }

        return next;
      });

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save answer. Please try again.",
      );
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleSubmitTest = async () => {
    if (submitting || result) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tests/${testId}/submit`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await tryParseJson<SubmitResponse & ApiMessageResponse>(res);

      if (!res.ok || !data) {
        throw new Error(data?.message || "Submit failed");
      }

      setResult(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit test. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div ref={runnerRef} className="test-runner">
        <h2 className="test-runner__result-title">Test Result</h2>

        {error && <p className="test-runner__error">{error}</p>}

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
          {result.summary.expired && (
            <p>
              <strong>Status:</strong> Time expired
            </p>
          )}
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
      <div ref={runnerRef} className="test-runner">
        <p>No questions available.</p>
      </div>
    );
  }

  return (
    <div ref={runnerRef} className="test-runner">
      <div className="test-runner__top">
        <p className={timerClassName}>
          Time left: {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
        <p className="test-runner__progress">
          {currentQuestionIndex + 1}/{questions.length}
        </p>
      </div>

      {(isTimeUp || !allQuestionsAnswered) && (
        <div className="test-runner__alert-dock" aria-label="Test alerts">
          {isTimeUp && (
            <span
              className="test-runner__alert-icon test-runner__alert-icon--time"
              data-tooltip="Time is up. You can no longer change answers."
              title="Time is up. You can no longer change answers."
              tabIndex={0}
              role="status"
              aria-label="Time is up. You can no longer change answers."
            >
              T
            </span>
          )}

          {!allQuestionsAnswered && !isTimeUp && (
            <span
              className="test-runner__alert-icon test-runner__alert-icon--answers"
              data-tooltip="Answer all questions to unlock Finish Test."
              title="Answer all questions to unlock Finish Test."
              tabIndex={0}
              role="status"
              aria-label="Answer all questions to unlock Finish Test."
            >
              !
            </span>
          )}
        </div>
      )}

      {error && <p className="test-runner__error">{error}</p>}

      <div className="question-card">
        <h3 className="question-card__title">
          {currentQuestionIndex + 1}. {currentQuestion.question}
        </h3>

        <div className="question-card__options">
          {currentQuestion.options.map((option, i) => {
            const isSelected = answers[currentQuestion.id] === i;
            const isDisabled =
              isTimeUp ||
              submitting ||
              savingQuestionId === currentQuestion.id;

            return (
              <label
                key={i}
                className={`question-card__option ${
                  isSelected ? "question-card__option--selected" : ""
                }`}
              >
                <input
                  type="radio"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => handleSelectAnswer(currentQuestion.id, i)}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="test-runner__actions">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || isTimeUp || submitting}
          className="test-runner__button"
        >
          Previous
        </button>

        {currentQuestionIndex < questions.length - 1 && !isTimeUp ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="test-runner__button"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitTest}
            disabled={
              submitting ||
              savingQuestionId !== null ||
              (!allQuestionsAnswered && !isTimeUp)
            }
            className="test-runner__button"
          >
            {submitting ? "Submitting..." : "Finish Test"}
          </button>
        )}
      </div>

    </div>
  );
};

export default TestRunner;
