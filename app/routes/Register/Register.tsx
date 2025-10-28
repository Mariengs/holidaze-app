import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../../api/auth";
import Toast from "../../components/ui/Toast";
import styles from "./register.module.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [venueManager, setVenueManager] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.endsWith("@stud.noroff.no")) {
      setError("Only @stud.noroff.no emails are allowed.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await registerUser({ name, email, password, venueManager });
      await loginUser(email, password);

      window.dispatchEvent(new Event("auth-updated"));

      setToastMessage("Account created 🎉 You’re now logged in!");

      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className={styles.main}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h1 className={styles.title}>Create an Account</h1>

          <label htmlFor="name" className={styles.label}>
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
          />

          <label htmlFor="email" className={styles.label}>
            Email (@stud.noroff.no)
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />

          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <div className={styles.inputGroup}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
            <button
              type="button"
              className={styles.passwordToggleBtn}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <label htmlFor="confirmPassword" className={styles.label}>
            Confirm Password
          </label>
          <div className={styles.inputGroup}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
            />
            <button
              type="button"
              className={styles.passwordToggleBtn}
              onClick={() => setShowConfirmPassword((v) => !v)}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={venueManager}
              onChange={(e) => setVenueManager(e.target.checked)}
              className={styles.checkbox}
            />
            I am a Venue Manager
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Registering..." : "Register"}
          </button>

          <p className={styles.text}>
            Already have an account?{" "}
            <span className={styles.link} onClick={() => navigate("/login")}>
              Log in here
            </span>
          </p>
        </form>
      </main>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
    </>
  );
}
