import "../../style/testHeader.css"

type TestHeaderProps = {
  timeLeft: number;
  initialTimeLeft: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  allQuestionsAnswered: boolean;
};

const TestHeader = ({
  timeLeft,
  initialTimeLeft,
  currentQuestionIndex,
  totalQuestions,
  allQuestionsAnswered,
}: TestHeaderProps) => {
  const minutes = Math.max(0, Math.floor(timeLeft / 1000 / 60));
  const seconds = Math.max(0, Math.floor((timeLeft / 1000) % 60));
  const isTimeUp = timeLeft <= 0;

  const timeLabel = `Time left: ${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;

  const safeInitialTime = Math.max(initialTimeLeft, 1);
  const timeRatio = Math.max(0, Math.min(1, timeLeft / safeInitialTime));

  const timerClassName =
    timeRatio <= 0.2
      ? "test-runner__timer test-runner__timer--danger"
      : timeRatio <= 0.5
        ? "test-runner__timer test-runner__timer--warning"
        : "test-runner__timer test-runner__timer--safe";

  return (
    <>
      <div className="test-runner__top">
        <p className={timerClassName} data-text={timeLabel}>
          {timeLabel}
        </p>

        <p
          className="test-runner__progress"
          data-text={`${currentQuestionIndex + 1}/${totalQuestions}`}
        >
          {currentQuestionIndex + 1}/{totalQuestions}
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
    </>
  );
};

export default TestHeader;
