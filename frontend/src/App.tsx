import { useState } from "react";
import HomePage from "./pages/HomePage";
import Signup from "./components/Signup";

function App() {
  const [user, setUser] = useState<null | { username: string }>(null);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <>
      <HomePage
        user={user}
        onLogout={() => setUser(null)}
        onSignupClick={() => setShowSignup(true)}
      />

      {showSignup && (
        <Signup onClose={() => setShowSignup(false)} />
      )}
    </>
  );
}

export default App;