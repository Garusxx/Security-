import "../style/navBar.css";

type NavbarProps = {
  isLoggedIn?: boolean;
  username?: string;
  avatar?: string;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onLogout?: () => void;
};

const NavBar = ({
  isLoggedIn = false,
  username = "",
  avatar = "https://i.pravatar.cc/100?img=12",
  onLoginClick,
  onSignupClick,
  onLogout,
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

            <button
              className="navbar__auth-btn navbar__auth-btn--logout"
              onClick={onLogout}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <button
              className="navbar__auth-btn navbar__auth-btn--login"
              onClick={onLoginClick}
            >
              Log in
            </button>

            <button
              className="navbar__auth-btn navbar__auth-btn--signup"
              onClick={onSignupClick}
            >
              Sign up
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;