import "../style/testProgressBar.css";

type TestProgressBarProps = {
  totalQuestions: number;
  answeredQuestions: number;
};

const TestProgressBar = ({
  totalQuestions,
  answeredQuestions,
}: TestProgressBarProps) => {
  const progressPercent =
    totalQuestions > 0
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0;

  const progressClassName =
    progressPercent < 30
      ? "test-progress-bar__fill--low"
      : progressPercent < 70
        ? "test-progress-bar__fill--medium"
        : "test-progress-bar__fill--high";

  return (
    <div className="test-progress-bar">
      <div className="test-progress-bar__track">
        <div
          className={`test-progress-bar__fill ${progressClassName}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="test-progress-bar__text">
        Answered {answeredQuestions} of {totalQuestions} questions ({progressPercent}%)
      </p>
    </div>
  );
};

export default TestProgressBar;