import type { SubmitResponse } from "./test";

type TestResultProps = {
  result: SubmitResponse;
  error: string | null;
  onRestart: () => void;
};

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

const TestResult = ({ result, error, onRestart }: TestResultProps) => {
  const incorrectItems = result.results.filter((item) => !item.isCorrect);

  return (
    <div className="test-runner">
      <h2 className="test-runner__result-title">Test Result</h2>

      {error && <p className="test-runner__error">{error}</p>}

      <div className="test-runner__result-summary">
        <div className="test-runner__summary-card">
          <span className="test-runner__summary-label">Score</span>
          <strong>{result.summary.score}</strong>
        </div>

        <div className="test-runner__summary-card">
          <span className="test-runner__summary-label">Correct</span>
          <strong>
            {result.summary.correctAnswers}/{result.summary.totalQuestions}
          </strong>
        </div>

        <div className="test-runner__summary-card">
          <span className="test-runner__summary-label">Time bonus</span>
          <strong>{result.summary.timeBonus}</strong>
        </div>

        {result.summary.expired && (
          <div className="test-runner__summary-card test-runner__summary-card--expired">
            <span className="test-runner__summary-label">Status</span>
            <strong>Time expired</strong>
          </div>
        )}
      </div>

      <div className="test-runner__review">
        <h3>Review</h3>

        {incorrectItems.length === 0 ? (
          <p className="test-runner__perfect-score">
            Perfect score - all answers were correct.
          </p>
        ) : (
          incorrectItems.map((item) => {
            const parsed = parseExplanation(item.explanation);

            return (
              <div key={item.questionId} className="test-runner__review-card">
                <p className="test-runner__review-question">{item.question}</p>

                <div className="test-runner__answer-compare">
                  <div className="test-runner__answer-box test-runner__answer-box--wrong">
                    <span>Your answer</span>
                    <strong>
                      {item.selectedAnswer !== null
                        ? item.options[item.selectedAnswer]
                        : "No answer"}
                    </strong>
                  </div>

                  <div className="test-runner__answer-box test-runner__answer-box--correct">
                    <span>Correct answer</span>
                    <strong>{item.options[item.correctAnswer]}</strong>
                  </div>
                </div>

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
          onClick={onRestart}
          className="test-runner__button"
        >
          New Test
        </button>
      </div>
    </div>
  );
};

export default TestResult;