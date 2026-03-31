import "../style/navBar.css";

type NavbarProps = {
  isLoggedIn?: boolean;
  username?: string;
  avatar?: string;
};

const NavBar = ({
  isLoggedIn = true,
  username = "MatiDev",
  avatar = "https://i.pravatar.cc/100?img=12",
}: NavbarProps) => {
  return (
    <nav className="navbar">
      <div className="navbar__right">
        {isLoggedIn ? (
          <>
            <button className="navbar__profile-btn">Profile</button>

            <div className="navbar__user">
              <img className="navbar__avatar" src={avatar} alt={username} />
              <span className="navbar__username">{username}</span>
            </div>

            <button className="navbar__auth-btn navbar__auth-btn--logout">
              Log out
            </button>
          </>
        ) : (
          <>
            <button className="navbar__auth-btn navbar__auth-btn--login">
              Log in
            </button>
            <button className="navbar__auth-btn navbar__auth-btn--signup">
              Sign up
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
