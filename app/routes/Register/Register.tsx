import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, saveAuth } from "../../api/auth";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [venueManager, setVenueManager] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.endsWith("@stud.noroff.no")) {
      setError("Only @stud.noroff.no emails are allowed.");
      return;
    }

    try {
      setLoading(true);

      const response = await registerUser({
        name,
        email,
        password,
        venueManager,
      });

      // saveAuth lagrer token + profil i localStorage
      saveAuth(response.accessToken, response.data);

      // send bruker til forsiden etter suksess
      navigate("/");
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f7f7f7",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>
          Create an Account
        </h1>

        <label
          htmlFor="name"
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            marginBottom: "1rem",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        <label
          htmlFor="email"
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          Email (@stud.noroff.no)
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            marginBottom: "1rem",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        <label
          htmlFor="password"
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            marginBottom: "1rem",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        <label
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <input
            type="checkbox"
            checked={venueManager}
            onChange={(e) => setVenueManager(e.target.checked)}
            style={{ marginRight: "0.5rem" }}
          />
          I am a Venue Manager
        </label>

        {error && (
          <p
            style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            backgroundColor: "#3B82F6",
            color: "#fff",
            padding: "0.75rem",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          Already have an account?{" "}
          <a href="#" onClick={() => navigate("/login")}>
            Log in here
          </a>
        </p>
      </form>
    </main>
  );
}
