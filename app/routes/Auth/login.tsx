import LoginModal from "../../components/LoginModal";
import { useState } from "react";
import { getToken } from "../../api/auth";

export default function LoginPage() {
  // Hvis du allerede er logget inn, vis en enkel melding
  const [hasToken] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!getToken();
  });

  if (hasToken) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>You are already logged in ✅</h1>
        <p>Go to your profile or browse venues.</p>
      </main>
    );
  }

  // Hvis ikke logget inn, bare render modalen som fullside
  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <LoginModal onSuccess={() => (window.location.href = "/")} />
    </main>
  );
}
