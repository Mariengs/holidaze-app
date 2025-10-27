import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/layout.module.css";
import { getToken, getProfile, clearAuth, type UserProfile } from "../api/auth";
import LoginModal from "./LoginModal";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLogin, setShowLogin] = useState(false); // styrer popupen

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = getToken();
    const prof = getProfile();

    setIsLoggedIn(!!token);
    setProfile(prof || null);
  }, []);

  function handleLogout() {
    clearAuth();
    setIsLoggedIn(false);
    setProfile(null);
  }

  function handleLoginSuccess() {
    setIsLoggedIn(true);
    setProfile(getProfile());
    setShowLogin(false);
  }

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          Holidaze
        </Link>

        {/* Navigasjonslenker */}
        <ul className={styles.navLinks}>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/venues">Venues</Link>
          </li>
          <li>
            <Link to="/profile">Profile</Link>
          </li>
        </ul>

        {/* Auth-seksjon */}
        <div className={styles.authArea}>
          {isLoggedIn && profile ? (
            <>
              <span className={styles.greeting}>Hi, {profile.name}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowLogin(true)}
                className={styles.loginBtn}
              >
                Login
              </button>
            </>
          )}
        </div>
      </nav>

      {/* LoginModal popper opp her */}
      {showLogin && <LoginModal onSuccess={handleLoginSuccess} />}
    </header>
  );
}
