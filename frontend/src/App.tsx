import { useState, useEffect } from "react";
import HomePage from "./pages/HomePage";
import Signup from "./components/Signup";
import Login from "./components/Login";
import PrivacyPolicy from "./components/PrivacyPolicy";

function App() {
  const [user, setUser] = useState<null | {
    username: string;
    avatar?: string;
  }>(null);

  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/me`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Fetch me error:", error);
        setUser(null);
      }
    };

    fetchMe();
  }, []);

  return (
    <>
      <HomePage
        user={user}
        onLogout={async () => {
          try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
              method: "POST",
              credentials: "include",
            });
          } catch (error) {
            console.error("Logout request error:", error);
          } finally {
            setUser(null);
          }
        }}
        onSignupClick={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
        onLoginClick={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
        onPrivacyClick={() => setShowPrivacyPolicy(true)}
      />

      {showSignup && (
        <Signup
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
          onSignupSuccess={(signedUpUser) => setUser(signedUpUser)}
          onPrivacyClick={() => setShowPrivacyPolicy(true)}
        />
      )}

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
          onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
        />
      )}

      {showPrivacyPolicy && (
        <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
      )}
    </>
  );
}

export default App;
