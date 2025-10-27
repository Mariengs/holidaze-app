export default function HomePage() {
  return (
    <section style={{ padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
        Welcome to Holidaze 🏖️
      </h1>
      <p
        style={{
          maxWidth: "40ch",
          margin: "1rem auto 2rem",
          color: "#444",
          lineHeight: 1.5,
        }}
      >
        Find and book unique places to stay. Browse venues, check availability,
        and manage your own listings.
      </p>

      <p style={{ fontSize: ".9rem", color: "#666" }}>
        You need an account to view venues and book.
      </p>
    </section>
  );
}
