import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import Header from "./components/Header";
import Footer from "./components/Footer";

import { AuthProvider } from "./components/context/AuthContext";
import { ToastProvider } from "./components/context/ToastContext"; // 👈 legg til
import styles from "./styles/layout.module.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>

      <body className={styles.bodyRoot}>
        {/* 👇 Global provider slik at toast funker overalt */}
        <ToastProvider>
          <AuthProvider>
            <Header />

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

export function ErrorBoundary() {
  return (
    <main style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Oops!</h1>
      <p>Something went wrong. Please try again later.</p>
    </main>
  );
}
