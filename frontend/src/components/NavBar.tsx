import "../style/navBar.css";
import { getAvatarUrl } from "../utils/avatar";

type NavbarProps = {
  isLoggedIn?: boolean;
  username?: string;
  avatar?: string;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
};

const NavBar = ({
  isLoggedIn = false,
  username = "",
  avatar = "default-avatar",
  onLoginClick,
  onSignupClick,
  onLogout,
  onProfileClick,
}: NavbarProps) => {
  return (
    <nav className="navbar">
      <div className="navbar__right">
        {isLoggedIn ? (
          <>
            <button className="navbar__profile-btn" onClick={onProfileClick}>
              Profile
            </button>

            <div className="navbar__user">
              <img
                className="navbar__avatar"
                src={getAvatarUrl(avatar || "default-avatar")}
                alt={username}
              />
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