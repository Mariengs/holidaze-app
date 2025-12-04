import { useState, useEffect } from "react";
import { getToken } from "../api/auth";
import LoginModal from "./LoginModal";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = getToken();
    setIsLoggedIn(!!token);
    setCheckingAuth(false);
  }, []);

  function handleLoginSuccess() {
    setIsLoggedIn(true);
  }

  function handleModalClose() {
    window.location.href = "/";
  }

  // no flicker
  if (checkingAuth) return null;

  if (!isLoggedIn) {
    return (
      <>
        <div
          style={{
            filter: "blur(4px)",
            pointerEvents: "none",
            minHeight: "50vh",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1>Access restricted</h1>
          <p>You need to log in to view this page.</p>
        </div>

        <LoginModal onSuccess={handleLoginSuccess} onClose={handleModalClose} />
      </>
    );
  }

  return <>{children}</>;
}
