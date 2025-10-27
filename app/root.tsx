import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import Header from "./components/Header";
import Footer from "./components/Footer";
import "./styles/layout.module.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Meta tags for React Router (title etc.) */}
        <Meta />
        {/* Stylesheets, fonts, etc. */}
        <Links />
      </head>
      <body style={{ fontFamily: "system-ui, sans-serif", color: "#111" }}>
        {/* Our app chrome */}
        <Header />

        <main
          style={{
            maxWidth: "1200px",
            margin: "2rem auto",
            padding: "0 1.5rem",
            minHeight: "60vh",
          }}
        >
          {children}
        </main>

        <Footer />

        {/* React Router helpers for hydration and client JS */}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// This is what React Router renders for each route.
// It sits inside <Layout> where {children} is.
export default function App() {
  return <Outlet />;
}

// Keep an ErrorBoundary so the app can recover instead of white-screen
export function ErrorBoundary() {
  return (
    <main style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Oops!</h1>
      <p>Something went wrong. Please try again later.</p>
    </main>
  );
}
