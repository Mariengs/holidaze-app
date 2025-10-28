import { createContext, useContext, useEffect, useState } from "react";
import { getToken, getProfile } from "../../api/auth";

interface AuthContextValue {
  isLoggedIn: boolean;
  profile: {
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
  refreshAuth: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  profile: null,
  refreshAuth: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<AuthContextValue["profile"]>(null);

  function loadFromStorage() {
    const token = getToken();
    const user = getProfile();
    setIsLoggedIn(!!token);
    if (user) {
      setProfile({
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar?.url,
      });
    } else {
      setProfile(null);
    }
  }

  useEffect(() => {
    loadFromStorage();
  }, []);

  function refreshAuth() {
    loadFromStorage();
  }

  function logout() {
    import("../../api/auth").then((authModule) => {
      authModule.clearAuth();
      loadFromStorage();
    });
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        profile,
        refreshAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
