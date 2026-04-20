import type { Question } from "./test";

type QuestionNavigatorProps = {
  questions: Question[];
  answers: Record<number, number>;
  currentQuestionIndex: number;
  onGoToQuestion: (questionIndex: number) => void;
};

const QuestionNavigator = ({
  questions,
  answers,
  currentQuestionIndex,
  onGoToQuestion,
}: QuestionNavigatorProps) => {
  return (
    <div
      className="test-runner__question-dock"
      aria-label="Question navigation"
    >
      {questions.map((question, index) => {
        const isAnswered = answers[question.id] !== undefined;
        const isCurrent = currentQuestionIndex === index;

        return (
          <button
            key={question.id}
            type="button"
            className={`test-runner__question-light ${
              isAnswered ? "test-runner__question-light--answered" : ""
            } ${isCurrent ? "test-runner__question-light--current" : ""}`}
            onClick={() => onGoToQuestion(index)}
            aria-label={`Go to question ${index + 1}${
              isAnswered ? ", answered" : ", not answered"
            }`}
            aria-current={isCurrent ? "step" : undefined}
          >
            {isAnswered ? "✓" : index + 1}
          </button>
        );
      })}
    </div>
  );
};

export default QuestionNavigator;