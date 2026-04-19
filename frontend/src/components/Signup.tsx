import { useState } from "react";
import "../style/signup.css";

type SignupProps = {
  onClose: () => void;
  onSwitchToLogin?: () => void;
  onSignupSuccess?: (user: { username: string; avatar?: string }) => void;
};

export default function Signup({
  onClose,
  onSwitchToLogin,
  onSignupSuccess,
}: SignupProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
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

  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const isPasswordValid =
    Object.values(passwordChecks).every(Boolean) && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!isPasswordValid) {
      setError("Password does not meet requirements");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      if (data.user && onSignupSuccess) {
        onSignupSuccess(data.user);
      }

      setMessage(data.message || "User created successfully");

      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

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
    <div className="signup-modal-overlay" onClick={onClose}>
      <div className="signup-modal" onClick={(e) => e.stopPropagation()}>
        <button className="signup-close" onClick={onClose}>
          ×
        </button>

        <form className="signup-form" onSubmit={handleSubmit}>
          <h2 className="signup-title">Create Account</h2>

          <input
            className="signup-input"
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
          />

          <input
            className="signup-input"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            className="signup-input"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />

          <input
            className="signup-input"
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <div className="password-checklist">
            <p className={`check-item ${passwordChecks.length ? "valid" : ""}`}>
              <span className="check-icon">
                {passwordChecks.length ? "✔" : "•"}
              </span>
              At least 8 characters
            </p>

            <p
              className={`check-item ${passwordChecks.uppercase ? "valid" : ""}`}
            >
              <span className="check-icon">
                {passwordChecks.uppercase ? "✔" : "•"}
              </span>
              One uppercase letter
            </p>

            <p className={`check-item ${passwordChecks.number ? "valid" : ""}`}>
              <span className="check-icon">
                {passwordChecks.number ? "✔" : "•"}
              </span>
              One number
            </p>

            <p
              className={`check-item ${passwordChecks.special ? "valid" : ""}`}
            >
              <span className="check-icon">
                {passwordChecks.special ? "✔" : "•"}
              </span>
              One special character
            </p>
          </div>

          <p
            className={`check-item match-check ${passwordsMatch ? "valid" : ""}`}
          >
            <span className="check-icon">{passwordsMatch ? "✔" : "•"}</span>
            Passwords match
          </p>

          <button
            className="signup-button"
            type="submit"
            disabled={loading || !isPasswordValid}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          {message && <p className="signup-success">{message}</p>}
          {error && <p className="signup-error">{error}</p>}

          <p className="signup-switch-text">
            Already have an account?{" "}
            <span className="signup-switch-link" onClick={onSwitchToLogin}>
              Log in
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
