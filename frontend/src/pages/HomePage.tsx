import NavBar from "../components/NavBar";
import TestRunner from "../components/TestRunner";
import { useState, useEffect } from "react";
import "../style/homePage.css";

type HomePageProps = {
  user: null | { username: string };
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
  options: string[];
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

  useEffect(() => {
    const fetchCurrentTest = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/tests/current", {
          credentials: "include",
        });

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

      const res = await fetch("http://localhost:5000/api/tests/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          questionCount: 5,
        }),
      });

      const data: { message?: string; test?: GeneratedTest } = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to generate test");
      }

      if (!data.test) {
        throw new Error("No test returned from server");
      }

      setTest(data.test);
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
    if (!test) return;

    try {
      setError("");

      const res = await fetch(
        `http://localhost:5000/api/tests/${test.id}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      const data: { message?: string; expiresAt?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to start test");
      }

      if (!data.expiresAt) {
        throw new Error("No expiresAt returned");
      }

      const testRes = await fetch(
        `http://localhost:5000/api/tests/${test.id}`,
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

      setExpiresAt(data.expiresAt);
      setQuestions(testData.test.questions);
      setTestStarted(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong");
      }
    }
  };

  return (
    <>
      <NavBar
        isLoggedIn={!!user}
        username={user?.username}
        onLogout={onLogout}
        onSignupClick={onSignupClick}
        onLoginClick={onLoginClick}
      />

      <section className="home">
        <h1>Start Security+ tests</h1>

        {!user && <p>Please log in to start the test.</p>}

        {user && loading && (
          <div className="loading-wrapper">
            <p>Generating test...</p>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        )}

        {user && !loading && !test && !testStarted && (
          <button onClick={handleGenerateTest}>Generate Test</button>
        )}

        {user && !loading && test && !testStarted && (
          <button onClick={handleStartTest}>
            {test.status === "started" ? "Continue Test" : "Start Test"}
          </button>
        )}

        {user && test && testStarted && (
          <TestRunner questions={questions} timeLeft={timeLeft} />
        )}

        {error && <p className="error-message">{error}</p>}
      </section>
    </>
  );
};

export default HomePage;
