import NavBar from "../components/NavBar";
import "../style/homePage.css";

type HomePageProps = {
  user: null | { username: string };
  onLogout: () => void;
  onSignupClick: () => void;
  onLoginClick: () => void; 
};

const HomePage = ({ user, onLogout, onSignupClick, onLoginClick }: HomePageProps) => {
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
        <button>Start tests</button>
      </section>
    </>
  );
};

export default HomePage;