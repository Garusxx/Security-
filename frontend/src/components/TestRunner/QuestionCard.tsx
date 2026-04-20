import type { Question } from "./test";
import "../../style/questionCard.css"

type QuestionCardProps = {
  questionNumber: number;
  question: Question;
  selectedAnswer?: number;
  isDisabled: boolean;
  isSaving: boolean;
  onSelectAnswer: (questionId: number, optionIndex: number) => void;
};

const QuestionCard = ({
  questionNumber,
  question,
  selectedAnswer,
  isDisabled,
  isSaving,
  onSelectAnswer,
}: QuestionCardProps) => {
  return (
    <div className="question-card">
      <h3
        className="question-card__title"
        data-text={`${questionNumber}. ${question.question}`}
      >
        {questionNumber}. {question.question}
      </h3>

      <div className="question-card__options">
        {question.options.map((option, i) => {
          const isSelected = selectedAnswer === i;
          const disabled = isDisabled || isSaving;

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
                disabled={disabled}
                onChange={() => onSelectAnswer(question.id, i)}
              />
              <span data-text={option}>{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;