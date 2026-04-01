import { useState } from "react";
import "../style/signup.css";

type SignupProps = {
  onClose: () => void;
};

export default function Signup({ onClose }: SignupProps) {
  const [formData, setFormData] = useState({
    username: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    console.log(import.meta.env.VITE_API_URL);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      setMessage(data.message || "User created successfully");

      setFormData({
        username: "",
        email: "",
        password: "",
      });
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

          <button className="signup-button" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          {message && <p className="signup-success">{message}</p>}
          {error && <p className="signup-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}