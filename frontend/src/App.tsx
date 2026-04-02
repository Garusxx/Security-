import { useState } from "react";
import HomePage from "./pages/HomePage";
import Signup from "./components/Signup";
import Login from "./components/Login";

function App() {
  const [user, setUser] = useState<null | { username: string }>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <HomePage
        user={user}
        onLogout={() => setUser(null)}
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
        />
      )}
    </>
  );
}

export default App;