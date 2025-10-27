import { useState } from "react";
import { loginUser } from "../api/auth";

type LoginModalProps = {
  onSuccess: () => void;
};

export default function LoginModal({ onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await loginUser(email, password);
      onSuccess(); // fortell Header at vi er innlogget
    } catch (err) {
      setError((err as Error).message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginBottom: "1rem" }}>Log in</h2>

        {error && (
          <p
            style={{
              color: "red",
              marginBottom: "0.75rem",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: "0.75rem" }}
        >
          <label style={labelStyle}>
            <span>Email</span>
            <input
              type="email"
              placeholder="your.name@stud.noroff.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            <span>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </label>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "grid",
  placeItems: "center",
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "12px",
  padding: "1.5rem",
  width: "100%",
  maxWidth: "320px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  fontFamily: "system-ui, sans-serif",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.4rem",
  fontSize: "0.9rem",
  color: "#333",
};

const inputStyle: React.CSSProperties = {
  borderRadius: "6px",
  border: "1px solid #ccc",
  padding: "0.6rem 0.75rem",
  fontSize: "0.95rem",
  width: "100%",
};

const buttonStyle: React.CSSProperties = {
  borderRadius: "6px",
  border: "0",
  background: "#111827",
  color: "#fff",
  fontSize: "0.95rem",
  fontWeight: 500,
  padding: "0.6rem 0.75rem",
  cursor: "pointer",
};
