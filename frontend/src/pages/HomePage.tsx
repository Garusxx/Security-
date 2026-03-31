import NavBar from "../components/NavBar";
import "../style/homePage.css"

const HomePage = () => {
  return (
    <>
      <NavBar
        isLoggedIn={true}
        username="MatiDev"
        avatar="https://i.pravatar.cc/100?img=12"
      />

      <section className="home">
        <h1>Start Security+ tests</h1>
        <button>Start tests</button>
      </section>
    </>
  );
};

export default HomePage;