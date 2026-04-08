import { useState, useEffect } from "react";
import HomePage from "./pages/HomePage";
import Signup from "./components/Signup";
import Login from "./components/Login";

function App() {
  const [user, setUser] = useState<null | { username: string }>(null);

  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

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
      />

      {showSignup && (
        <Signup
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
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
    </>
  );
}

export default App;
