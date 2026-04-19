import NavBar from "../components/NavBar";
import TestRunner from "../components/TestRunner";
import ProfilePanel from "../components/ProfilePanel";
import { useState, useEffect } from "react";
import "../style/homePage.css";

type HomePageProps = {
  user: null | {
    username: string;
    avatar?: string;
  };
  onLogout: () => void;
  onSignupClick: () => void;
  onLoginClick: () => void;
};

type GeneratedTest = {
  id: number;
  title: string;
  status: "generated" | "started" | "finished" | "expired";
};

type Question = {
  id: number;
  question: string;
  options: [string, string, string, string];
  selectedAnswer: number | null;
};

const HomePage = ({
  user,
  onLogout,
  onSignupClick,
  onLoginClick,
}: HomePageProps) => {
  const [loading, setLoading] = useState(false);
  const [test, setTest] = useState<GeneratedTest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testStarted, setTestStarted] = useState(false);
  const [error, setError] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [isEnteringTest, setIsEnteringTest] = useState(false);
  const isHeroCompact = Boolean(user && (loading || test));

  useEffect(() => {
    const fetchCurrentTest = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tests/current`,
          {
            credentials: "include",
          },
        );

        if (!res.ok) return;

        const data: { test: GeneratedTest | null } = await res.json();

        if (data.test) {
          setTest(data.test);
        }
      } catch (err) {
        console.error("Fetch current test error:", err);
      }
    };

    if (user) {
      fetchCurrentTest();
    }
  }, [user]);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setTimeLeft(Math.max(0, diff));
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleGenerateTest = async () => {
    try {
      setLoading(true);
      setError("");
      setTest(null);
      setQuestions([]);
      setTestStarted(false);
      setExpiresAt("");
      setTimeLeft(0);
      setGenerationComplete(false);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tests/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            questionCount: 5,
          }),
        },
      );

      const data: { message?: string; test?: GeneratedTest } = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to generate test");
      }

      if (!data.test) {
        throw new Error("No test returned from server");
      }

      setTest(data.test);
      setGenerationComplete(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!test || isEnteringTest) return;

    try {
      setError("");
      setGenerationComplete(false);
      setIsEnteringTest(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tests/${test.id}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      const data: { message?: string; expiresAt?: string; attemptId?: number } =
        await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to start test");
      }

      if (!data.expiresAt) {
        throw new Error("No expiresAt returned");
      }

      const testRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tests/${test.id}`,
        {
          credentials: "include",
        },
      );

      const testData: {
        message?: string;
        test?: {
          id: number;
          title: string;
          status: string;
          questions: Question[];
        };
      } = await testRes.json();

      if (!testRes.ok) {
        throw new Error(testData.message || "Failed to load test");
      }

      if (!testData.test) {
        throw new Error("No test returned");
      }

      if (!data.attemptId) {
        throw new Error("No attemptId returned");
      }

      setAttemptId(data.attemptId);

      setExpiresAt(data.expiresAt);
      setQuestions(testData.test.questions);

      await new Promise((resolve) => {
        window.setTimeout(resolve, 1150);
      });

      setTestStarted(true);
    } catch (error: unknown) {
      setIsEnteringTest(false);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setIsEnteringTest(false);
    }
  };

  return (
    <>
      <NavBar
        isLoggedIn={!!user}
        username={user?.username}
        avatar={user?.avatar}
        onLogout={onLogout}
        onSignupClick={onSignupClick}
        onLoginClick={onLoginClick}
        onProfileClick={() => setIsProfileOpen(true)}
      />

      <section className="home">
        <div
          className={`home-hero ${isHeroCompact ? "home-hero--compact" : ""}`}
          aria-label="Practice Security+ Under Pressure"
        >
          <div className="home-hero__visual" aria-hidden="true">
            <div className="home-hero__shield">
              <span className="home-hero__shield-check">✓</span>
            </div>
            <div className="home-hero__scanner" />
            <div className="home-hero__node home-hero__node--one" />
            <div className="home-hero__node home-hero__node--two" />
            <div className="home-hero__node home-hero__node--three" />
          </div>

          <div className="home-hero__copy">
            <p className="home-hero__eyebrow">Security+ Practice Lab</p>
            <h1>Practice Security+ Under Pressure</h1>
            <p className="home-hero__subtitle">
              Timed questions, instant scoring, and focused explanations for
              every mistake.
            </p>
          </div>
        </div>

        {!user && <p>Please log in to start the test.</p>}

        {user && loading && (
          <div className="generation-status" role="status" aria-live="polite">
            <div className="generation-status__icon" aria-hidden="true">
              <span />
            </div>
            <div className="generation-status__content">
              <p className="generation-status__label">Building practice test</p>
              <p className="generation-status__text">
                Generating focused Security+ questions and answer explanations.
              </p>
              <div className="generation-status__bar">
                <div className="generation-status__bar-fill" />
              </div>
            </div>
          </div>
        )}

        {user && !loading && !test && !testStarted && (
          <button
            className="home-action-button home-action-button--primary"
            onClick={handleGenerateTest}
          >
            <span className="home-action-button__icon" aria-hidden="true">
              +
            </span>
            Generate Test
          </button>
        )}

        {user && !loading && test && !testStarted && (
          <div className="ready-panel">
            {generationComplete && (
              <div className="ready-panel__message" role="status">
                <span className="ready-panel__icon" aria-hidden="true">
                  ✓
                </span>
                <div>
                  <p className="ready-panel__title">Generation complete</p>
                  <p className="ready-panel__text">
                    Your practice test is ready.
                  </p>
                </div>
              </div>
            )}

            <button
              className="home-action-button home-action-button--start"
              onClick={handleStartTest}
              disabled={isEnteringTest}
            >
              <span className="home-action-button__icon" aria-hidden="true">
                ▶
              </span>
              {isEnteringTest
                ? "Entering Test"
                : test.status === "started"
                  ? "Continue Test"
                  : "Start Test"}
            </button>
          </div>
        )}

        {user && test && testStarted && (
          <TestRunner
            questions={questions}
            timeLeft={timeLeft}
            attemptId={attemptId}
            testId={test.id}
          />
        )}

        {error && <p className="error-message">{error}</p>}
      </section>

      {isEnteringTest && (
        <div
          className="test-entry-glitch"
          role="status"
          aria-live="polite"
          aria-label="Entering test"
        >
          <div className="test-entry-glitch__matrix" aria-hidden="true">
            <span>01001011 1100 0011</span>
            <span>AUTH TOKEN VERIFIED</span>
            <span>10110100 0110 1001</span>
            <span>SESSION HANDSHAKE</span>
            <span>00101101 1110 0101</span>
            <span>LOADING TEST RUNNER</span>
            <span>0110 0001 1010</span>
            <span>FIREWALL BYPASSED</span>
            <span>11001100 01010110</span>
            <span>ACCESS GRANTED</span>
          </div>

          <div className="test-entry-glitch__panel">
            <p className="test-entry-glitch__eyebrow">Secure channel opened</p>
            <p className="test-entry-glitch__title" data-text="Entering Test">
              Entering Test
            </p>
            <div className="test-entry-glitch__bar">
              <span />
            </div>
          </div>
        </div>
      )}

      {isProfileOpen && (
        <ProfilePanel onClose={() => setIsProfileOpen(false)} />
      )}
    </>
  );
};

export default HomePage;
