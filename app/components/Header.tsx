import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/layout.module.css";
import { getToken, getProfile, clearAuth, type UserProfile } from "../api/auth";
import LoginModal from "./LoginModal";
import VenueEditorModal from "./VenueEditorModal";
import type { Venue } from "../api/venues";
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

  // Create Venue Modal State
  const [showVenueEditor, setShowVenueEditor] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | undefined>(
    undefined
  );

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

  useEffect(() => {
    function handleOpenLoginModal() {
      setShowLogin(true);
    }
    window.addEventListener("open-login-modal", handleOpenLoginModal);
    return () => {
      window.removeEventListener("open-login-modal", handleOpenLoginModal);
    };
  }, []);

  // Create Venue Event Listener
  useEffect(() => {
    function handleCreateVenue() {
      setEditingVenue(undefined);
      setShowVenueEditor(true);
    }
    window.addEventListener("open-create-venue", handleCreateVenue);
    return () => {
      window.removeEventListener("open-create-venue", handleCreateVenue);
    };
  }, []);

  function handleLogout() {
    clearAuth();
    setShowLogin(false);
    setShowMenu(false);
    window.location.href = "/";
  }

  function handleLoginSuccess() {
    refreshAuthState();
    setShowLogin(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-updated"));
    }
    window.location.reload();
  }

  // Venue Saved Handler
  function handleVenueSaved(savedVenue: Venue) {
    setShowVenueEditor(false);
    setEditingVenue(undefined);
    // Optional: Navigate to the new venue
    // navigate(`/venues/${savedVenue.id}`);
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

          {isLoggedIn && (
            <li>
              <Link to="/profile">Profile</Link>
            </li>
          )}

          {/* Create Venue Link - After Profile, same style as other links */}
          {isLoggedIn && profile?.venueManager && (
            <li>
              <button
                onClick={() => {
                  setEditingVenue(undefined);
                  setShowVenueEditor(true);
                }}
                className={styles.navLinkButton}
              >
                Create Venue
              </button>
            </li>
          )}
        </ul>

        {/* Right area */}
        <div className={styles.authArea}>
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={styles.themeToggleBtn}
            aria-label="Toggle dark mode"
          >
            <span className={styles.toggleTrack}>
              <span className={styles.toggleIcon}>
                {theme === "light" ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27098 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z" />
                  </svg>
                )}
              </span>
              <span className={styles.toggleThumb}></span>
            </span>
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

                    {/* Create Venue in Mobile - After Profile */}
                    {profile?.venueManager && (
                      <button
                        className={styles.dropdownItem}
                        role="menuitem"
                        onClick={() => {
                          setEditingVenue(undefined);
                          setShowVenueEditor(true);
                          setShowMenu(false);
                        }}
                      >
                        Create Venue
                      </button>
                    )}

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

      {/* Create Venue Modal */}
      <VenueEditorModal
        isOpen={showVenueEditor}
        initialVenue={editingVenue}
        onClose={() => {
          setShowVenueEditor(false);
          setEditingVenue(undefined);
        }}
        onSaved={handleVenueSaved}
      />
    </header>
  );
}
