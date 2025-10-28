import { useState, useEffect } from "react";
import { getToken } from "../../api/auth";
import LoginModal from "../../components/LoginModal";

export default function LoginPage() {
  // vi må vente til vi er i browser før vi sjekker localStorage (getToken)
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!getToken());
  }, []);

  // Hvis bruker allerede er logget inn:
  if (hasToken) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>You are already logged in ✅</h1>
        <p>Go to your profile or browse venues.</p>
      </main>
    );
  }

  // Ikke logget inn → vis LoginModal sentrert på siden som en "full page login"
  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <LoginModal
        onSuccess={() => {
          // når login lykkes
          window.location.href = "/profile";
        }}
        onClose={() => {
          // når bruker trykker ✕
          window.location.href = "/";
        }}
      />
    </main>
  );
}
