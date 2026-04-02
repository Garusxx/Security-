import { useState } from "react";
import HomePage from "./pages/HomePage";
import Signup from "./components/Signup";
import Login from "./components/Login";

function App() {
  const [user, setUser] = useState<null | { username: string }>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <HomePage
        user={user}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
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