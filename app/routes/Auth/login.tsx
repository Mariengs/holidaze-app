import { useState, useEffect } from "react";
import { getToken } from "../../api/auth";
import LoginModal from "../../components/LoginModal";

export default function LoginPage() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!getToken());
  }, []);

  if (hasToken) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>You are already logged in </h1>
        <p>Go to your profile or browse venues.</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <LoginModal
        onSuccess={() => {
          window.location.href = "/profile";
        }}
        onClose={() => {
          window.location.href = "/";
        }}
      />
    </main>
  );
}
