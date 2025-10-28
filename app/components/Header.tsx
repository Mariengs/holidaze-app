import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/layout.module.css";
import { getToken, getProfile, clearAuth, type UserProfile } from "../api/auth";
import LoginModal from "./LoginModal";

export default function Header() {
  const [ready, setReady] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const refreshAuthState = useCallback(() => {
    if (typeof window === "undefined") return;
    const token = getToken();
    const prof = getProfile();

    setIsLoggedIn(!!token);
    setProfile(prof || null);
    setReady(true);
  }, []);

  useEffect(() => {
    refreshAuthState();
  }, [refreshAuthState]);

  useEffect(() => {
    function handleAuthUpdated() {
      refreshAuthState();
    }

    window.addEventListener("auth-updated", handleAuthUpdated);
    return () => {
      window.removeEventListener("auth-updated", handleAuthUpdated);
    };
  }, [refreshAuthState]);

  function handleLogout() {
    clearAuth();
    refreshAuthState();
    setShowLogin(false);
  }

  function handleLoginSuccess() {
    refreshAuthState();
    setShowLogin(false);
  }

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          Holidaze
        </Link>

        {/* Main nav */}
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

        {/* Right-side auth */}
        <div className={styles.authArea}>
          {!ready ? (
            <span className={styles.greeting} style={{ opacity: 0.5 }}>
              ...
            </span>
          ) : isLoggedIn ? (
            <>
              {profile?.name && (
                <span className={styles.greeting}>Hi, {profile.name}</span>
              )}
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Log out
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setShowLogin(true)}
                className={styles.loginBtn}
              >
                Login
              </button>

              <Link to="/register" className={styles.registerBtn}>
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>

      {showLogin && (
        <LoginModal
          onSuccess={handleLoginSuccess}
          onClose={() => setShowLogin(false)}
        />
      )}
    </header>
  );
}
