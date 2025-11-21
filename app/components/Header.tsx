import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/layout.module.css";
import { getToken, getProfile, clearAuth, type UserProfile } from "../api/auth";
import LoginModal from "./LoginModal";
import logo from "../assets/logotransparent.png";

type Theme = "light" | "dark";

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
}

export default function Header({ theme, onToggleTheme }: HeaderProps) {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();

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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-updated"));
    }
    refreshAuthState();
    setShowLogin(false);
    setShowMenu(false);
    navigate("/", { replace: true });
  }

  function handleLoginSuccess() {
    refreshAuthState();
    setShowLogin(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-updated"));
    }
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!showMenu) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showMenu]);

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <img src={logo} alt="Holidaze logo" className={styles.logoImage} />
        </Link>

        {/* Desktop-nav */}
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

        {/* Høyreside */}
        <div className={styles.authArea}>
          {/* 🌙/☀️ tema-knapp (alltid synlig) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={styles.themeToggleBtn}
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Desktop-auth */}
          {!ready ? (
            <span className={styles.greeting} style={{ opacity: 0.5 }}>
              ...
            </span>
          ) : isLoggedIn ? (
            <div className={styles.desktopAuth}>
              {profile?.name && (
                <span className={styles.greeting}>Hi, {profile.name}</span>
              )}
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Log out
              </button>
            </div>
          ) : (
            <div className={styles.desktopAuth}>
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

          {/* Mobilmeny */}
          <div className={styles.mobileMenuWrapper} ref={menuRef}>
            <button
              type="button"
              className={styles.menuBtn}
              aria-haspopup="menu"
              aria-expanded={showMenu}
              aria-label="Open menu"
              onClick={() => setShowMenu((s) => !s)}
            >
              ☰
            </button>

            {showMenu && (
              <div className={styles.dropdown} role="menu">
                <Link
                  to="/"
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={() => setShowMenu(false)}
                >
                  Home
                </Link>
                <Link
                  to="/venues"
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={() => setShowMenu(false)}
                >
                  Venues
                </Link>

                {isLoggedIn ? (
                  <>
                    <Link
                      to="/profile"
                      className={styles.dropdownItem}
                      role="menuitem"
                      onClick={() => setShowMenu(false)}
                    >
                      Profile
                    </Link>
                    <button
                      className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={styles.dropdownItem}
                      role="menuitem"
                      onClick={() => {
                        setShowMenu(false);
                        setShowLogin(true);
                      }}
                    >
                      Login
                    </button>
                    <Link
                      to="/register"
                      className={styles.dropdownItem}
                      role="menuitem"
                      onClick={() => setShowMenu(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
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
