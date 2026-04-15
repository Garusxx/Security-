import { useState } from "react";
import "../style/testRunner.css";

type Question = {
  id: number;
  question: string;
  options: string[];
};

type TestRunnerProps = {
  questions: Question[];
  timeLeft: number;
};

const TestRunner = ({ questions, timeLeft }: TestRunnerProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const minutes = Math.floor(timeLeft / 1000 / 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  const currentQuestion = questions[currentQuestionIndex];

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

  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  if (questions.length === 0) {
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

      <div className="question-card">
        <h3 className="question-card__title">
          {currentQuestionIndex + 1}. {currentQuestion.question}
        </h3>

        <div className="question-card__options">
          {currentQuestion.options.map((option, optionIndex) => (
            <label key={optionIndex} className="question-card__option">
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                value={optionIndex}
                checked={answers[currentQuestion.id] === optionIndex}
                onChange={() =>
                  handleSelectAnswer(currentQuestion.id, optionIndex)
                }
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="test-runner__actions">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="test-runner__button"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentQuestionIndex === questions.length - 1}
          className="test-runner__button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TestRunner;