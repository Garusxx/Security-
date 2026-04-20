import { useEffect, useRef, useState } from "react";
import "../../style/testRunner.css";
import QuestionCard from "./QuestionCard";
import TestHeader from "./TestHeader";
import TestResult from "./TestResult";
import QuestionNavigator from "./QuestionNavigator";

import type {
  SubmitResponse,
  ApiMessageResponse,
  TestRunnerProps,
} from "./test";

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
  const [showingResultTransition, setShowingResultTransition] = useState(false);
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

  const initialTimeLeft = Math.max(initialTimeLeftRef.current, 1);

  const timeRatio = Math.max(0, Math.min(1, timeLeft / initialTimeLeft));

  const runnerClassName =
    timeRatio <= 0.2
      ? "test-runner test-runner--time-danger"
      : timeRatio <= 0.5
        ? "test-runner test-runner--time-warning"
        : "test-runner";

  const answeredCount = Object.keys(answers).length;
  const allQuestionsAnswered = answeredCount === questions.length;
  const currentQuestion = questions[currentQuestionIndex];

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

  const handleGoToQuestion = (questionIndex: number) => {
    if (questionIndex >= 0 && questionIndex < questions.length) {
      setCurrentQuestionIndex(questionIndex);
    }
  };

  const handleSelectAnswer = async (
    questionId: number,
    optionIndex: number,
  ) => {
    if (
      !attemptId ||
      isTimeUp ||
      submitting ||
      savingQuestionId === questionId
    ) {
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

      setShowingResultTransition(true);

      await new Promise((resolve) => {
        window.setTimeout(resolve, 1150);
      });

      setResult(data);
    } catch (error) {
      setShowingResultTransition(false);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit test. Please try again.",
      );
    } finally {
      setSubmitting(false);
      setShowingResultTransition(false);
    }
  };
  if (result) {
    return (
      <div ref={runnerRef}>
        <TestResult
          result={result}
          error={error}
          onRestart={() => window.location.reload()}
        />
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
    <div ref={runnerRef} className={runnerClassName}>
      <TestHeader
        timeLeft={timeLeft}
        initialTimeLeft={initialTimeLeft}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        allQuestionsAnswered={allQuestionsAnswered}
      />
      <QuestionNavigator
        questions={questions}
        answers={answers}
        currentQuestionIndex={currentQuestionIndex}
        onGoToQuestion={handleGoToQuestion}
      />

      {error && <p className="test-runner__error">{error}</p>}

      <QuestionCard
        questionNumber={currentQuestionIndex + 1}
        question={currentQuestion}
        selectedAnswer={answers[currentQuestion.id]}
        isDisabled={isTimeUp || submitting}
        isSaving={savingQuestionId === currentQuestion.id}
        onSelectAnswer={handleSelectAnswer}
      />

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

      {showingResultTransition && (
        <div
          className="test-entry-glitch"
          role="status"
          aria-live="polite"
          aria-label="Opening test result"
        >
          <div className="test-entry-glitch__matrix" aria-hidden="true">
            <span>01001011 1100 0011</span>
            <span>SCORING ANSWERS</span>
            <span>10110100 0110 1001</span>
            <span>RESULT CHANNEL OPEN</span>
            <span>00101101 1110 0101</span>
            <span>LOADING REPORT</span>
            <span>0110 0001 1010</span>
            <span>VERIFYING SCORE</span>
            <span>11001100 01010110</span>
            <span>ACCESS GRANTED</span>
          </div>

          <div className="test-entry-glitch__panel">
            <p className="test-entry-glitch__eyebrow">Test submitted</p>
            <p className="test-entry-glitch__title" data-text="Opening Result">
              Opening Result
            </p>
            <div className="test-entry-glitch__bar">
              <span />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRunner;
