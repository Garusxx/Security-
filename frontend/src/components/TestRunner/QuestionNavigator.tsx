import type { Question } from "./test";
import "../../style/questionNavigator.css";
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
    <div className="question-navigator" aria-label="Question navigation">
      {questions.map((question, index) => {
        const isAnswered = answers[question.id] !== undefined;
        const isCurrent = currentQuestionIndex === index;

        return (
          <button
            key={question.id}
            type="button"
            className={`question-navigator__item ${
              isAnswered ? "question-navigator__item--answered" : ""
            } ${isCurrent ? "question-navigator__item--current" : ""}`}
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
