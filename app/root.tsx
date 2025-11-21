import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect, useState } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";

import { AuthProvider } from "./components/context/AuthContext";
import { ToastProvider } from "./components/context/ToastContext";
import styles from "./styles/layout.module.css";

import "./styles/global.css";
import "./styles/theme.css";

type Theme = "light" | "dark";

export function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem("theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      return;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (prefersDark) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const bodyClassName =
    theme === "dark" ? `${styles.bodyRoot} dark` : styles.bodyRoot;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>

      <body className={bodyClassName}>
        <ToastProvider>
          <AuthProvider>
            <Header theme={theme} onToggleTheme={toggleTheme} />

            <main className={styles.mainWrapper}>{children}</main>

            <Footer />
          </AuthProvider>
        </ToastProvider>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
