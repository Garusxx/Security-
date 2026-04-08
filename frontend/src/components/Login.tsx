import { useState } from "react";
import "../style/login.css";

type LoginProps = {
  onClose: () => void;
  onSwitchToSignup?: () => void;
  onLoginSuccess?: (user: { username: string }) => void;
};

export default function Login({
  onClose,
  onSwitchToSignup,
  onLoginSuccess,
}: LoginProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const isFormValid =
    formData.email.trim().length > 0 && formData.password.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!isFormValid) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }


      if (data.user && onLoginSuccess) {
        onLoginSuccess(data.user);
      }

      setMessage(data.message || "Login successful");

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-close" onClick={onClose}>
          ×
        </button>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-title">Log In</h2>

          <input
            className="login-input"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            className="login-input"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />

          <button
            className="login-button"
            type="submit"
            disabled={loading || !isFormValid}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>

          {message && <p className="login-success">{message}</p>}
          {error && <p className="login-error">{error}</p>}

          <p className="login-switch-text">
            Don&apos;t have an account?{" "}
            <span className="login-switch-link" onClick={onSwitchToSignup}>
              Sign up
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
