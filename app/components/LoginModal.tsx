import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { loginUser, registerUser, forceVenueManagerTrue } from "../api/auth";
import Toast from "./ui/Toast";
import styles from "../styles/LoginModal.module.css";

type LoginModalProps = {
  onSuccess: () => void;
  onClose: () => void;
};

type ActiveTab = "login" | "register";

export default function LoginModal({ onSuccess, onClose }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [venueManager, setVenueManager] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  // Register field errors (per-felt)
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Toast state (for successful registration)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingSuccess, setPendingSuccess] = useState(false);

  // Password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Helpers
  function validateEmail(value: string): boolean {
    if (!value) {
      setEmailError("Email is required.");
      return false;
    }
    if (!value.endsWith("@stud.noroff.no")) {
      setEmailError("Only @stud.noroff.no emails are allowed.");
      return false;
    }
    setEmailError(null);
    return true;
  }

  function validatePassword(value: string): boolean {
    if (!value) {
      setPasswordError("Password is required.");
      return false;
    }
    if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return false;
    }
    setPasswordError(null);
    return true;
  }

  function validateConfirmPassword(
    confirmValue: string,
    passwordValue: string
  ): boolean {
    if (!confirmValue) {
      setConfirmError("Please confirm your password.");
      return false;
    }
    if (confirmValue !== passwordValue) {
      setConfirmError("Passwords do not match.");
      return false;
    }
    setConfirmError(null);
    return true;
  }

  // Toggle tabs – clear errors when switching
  function handleTabChange(tab: ActiveTab) {
    setActiveTab(tab);
    setLoginError(null);
    setRegError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmError(null);
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      await loginUser(loginEmail, loginPassword);
      onSuccess();
    } catch (err) {
      console.error(err);
      setLoginError((err as Error).message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Reset errors
    setRegError(null);
    let valid = true;

    const emailOk = validateEmail(regEmail);
    const passOk = validatePassword(regPassword);
    const confirmOk = validateConfirmPassword(confirmPassword, regPassword);

    valid = emailOk && passOk && confirmOk;

    if (!valid) {
      return;
    }

    try {
      setRegLoading(true);

      await registerUser({
        name,
        email: regEmail,
        password: regPassword,
        venueManager,
      });

      // Log in after register
      await loginUser(regEmail, regPassword);

      if (venueManager === true) {
        try {
          await forceVenueManagerTrue();
        } catch (err) {
          console.warn("Could not force venueManager true:", err);
        }
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-updated"));
      }

      // Toast
      setToastMessage(
        `Welcome to Holidaze, ${name || "traveller"}! Your account has been created 🎉`
      );
      setPendingSuccess(true);
    } catch (err) {
      console.error(err);
      setRegError((err as Error).message || "Registration failed");
    } finally {
      setRegLoading(false);
    }
  }

  const isLogin = activeTab === "login";

  return (
    <>
      <div className={styles.backdrop}>
        <div className={styles.modal}>
          {/* Close button */}
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>

          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>Holidaze</h2>
            <p className={styles.subtitle}>
              {isLogin
                ? "Welcome back. Log in to manage your bookings and keep track of your trips."
                : "Create an account to book your next retreat and manage your stays."}
            </p>
          </div>

          {/* Tab switcher */}
          <div className={styles.tabSwitcher} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              className={`${styles.tabButton} ${
                isLogin ? styles.tabButtonActive : ""
              }`}
              onClick={() => handleTabChange("login")}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              className={`${styles.tabButton} ${
                !isLogin ? styles.tabButtonActive : ""
              }`}
              onClick={() => handleTabChange("register")}
            >
              Register
            </button>
          </div>

          {/* Content */}
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className={styles.form}>
              {loginError && <p className={styles.error}>{loginError}</p>}

              <label className={styles.label}>
                <span>Email</span>
                <input
                  type="email"
                  placeholder="your.name@stud.noroff.no"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={styles.input}
                  required
                />
              </label>

              <label className={styles.label}>
                <span>Password</span>
                <div className={styles.inputGroup}>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={styles.input}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowLoginPassword((v) => !v)}
                    aria-label={
                      showLoginPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showLoginPassword ? (
                      <AiOutlineEyeInvisible />
                    ) : (
                      <AiOutlineEye />
                    )}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loginLoading}
                className={styles.button}
              >
                {loginLoading ? "Logging in..." : "Log in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className={styles.form}>
              {/* Uventede API-feil */}
              {regError && <p className={styles.error}>{regError}</p>}

              {/* Name */}
              <label className={styles.label}>
                <span>Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  required
                />
              </label>

              {/* Email */}
              <label className={styles.label}>
                <span>Email (@stud.noroff.no)</span>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRegEmail(value);
                    // live-validering
                    validateEmail(value);
                  }}
                  className={`${styles.input} ${
                    emailError ? styles.inputError : ""
                  }`}
                  required
                />
                {emailError && (
                  <span className={styles.fieldError}>{emailError}</span>
                )}
              </label>

              {/* Password */}
              <label className={styles.label}>
                <span>Password</span>
                <div className={styles.inputGroup}>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setRegPassword(value);
                      // live-validering
                      validatePassword(value);
                      // oppdatere confirm hvis allerede fylt inn
                      if (confirmPassword) {
                        validateConfirmPassword(confirmPassword, value);
                      }
                    }}
                    className={`${styles.input} ${
                      passwordError ? styles.inputError : ""
                    }`}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowRegPassword((v) => !v)}
                    aria-label={
                      showRegPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showRegPassword ? (
                      <AiOutlineEyeInvisible />
                    ) : (
                      <AiOutlineEye />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <span className={styles.fieldError}>{passwordError}</span>
                )}
              </label>

              {/* Confirm password */}
              <label className={styles.label}>
                <span>Confirm Password</span>
                <div className={styles.inputGroup}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setConfirmPassword(value);
                      // live-validering
                      validateConfirmPassword(value, regPassword);
                    }}
                    className={`${styles.input} ${
                      confirmError ? styles.inputError : ""
                    }`}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <AiOutlineEyeInvisible />
                    ) : (
                      <AiOutlineEye />
                    )}
                  </button>
                </div>
                {confirmError && (
                  <span className={styles.fieldError}>{confirmError}</span>
                )}
              </label>

              {/* Venue manager */}
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={venueManager}
                  onChange={(e) => setVenueManager(e.target.checked)}
                  className={styles.checkbox}
                />
                I am a Venue Manager
              </label>

              <p className={styles.helperText}>
                As a venue manager, you can create and manage your own retreats,
                set pricing, upload images, and handle bookings from guests.
              </p>

              <button
                type="submit"
                disabled={regLoading}
                className={styles.button}
              >
                {regLoading ? "Registering..." : "Register"}
              </button>
            </form>
          )}
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => {
            setToastMessage(null);
            if (pendingSuccess) {
              setPendingSuccess(false);
              onSuccess();
            }
          }}
        />
      )}
    </>
  );
}
