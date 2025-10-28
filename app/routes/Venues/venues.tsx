import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllVenues, type Venue } from "../../api/venues";

export default function Venues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false); // egen loading-state for søk
  const [error, setError] = useState<string | null>(null);

  async function fetchVenues(search?: string) {
    // hvis det er et søk, vis "searching..." i stedet for å fjerne hele lista
    if (search && search.trim() !== "") {
      setSearching(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await getAllVenues(search);
      setVenues(data);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }

  // last inn første gang (alle venues)
  useEffect(() => {
    fetchVenues();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchVenues(query);
  }

  return (
    <main style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1rem", fontSize: "1.5rem", fontWeight: 600 }}>
        Available Venues
      </h1>

      {/* 🔍 Search bar */}
      <form
        onSubmit={handleSearch}
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search venues..."
          style={{
            padding: "0.6rem 0.8rem",
            border: "1px solid #ccc",
            borderRadius: "6px",
            minWidth: "220px",
            flex: "0 0 auto",
            fontSize: "0.9rem",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.6rem 1rem",
            border: "none",
            borderRadius: "6px",
            background: "#1f2937",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          {searching ? "Searching..." : "Search"}
        </button>

        {(loading || searching) && (
          <span
            style={{
              fontSize: "0.8rem",
              color: "#555",
            }}
          >
            {searching ? "Searching…" : "Loading venues…"}
          </span>
        )}
      </form>

      {error && (
        <p style={{ color: "#dc2626", fontSize: "0.9rem", fontWeight: 500 }}>
          {error}
        </p>
      )}

      {!loading && !searching && venues.length === 0 && !error && (
        <p
          style={{
            fontSize: "0.9rem",
            color: "#555",
            fontStyle: "italic",
            marginTop: "1rem",
          }}
        >
          No venues found.
        </p>
      )}

      {/* cards grid */}
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        }}
      >
        {venues.map((venue) => {
          const imageUrl = venue.media?.[0]?.url || "";
          const city =
            venue.location?.city ||
            venue.location?.country ||
            "No location set";

          return (
            <Link
              key={venue.id}
              to={`/venues/${venue.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  overflow: "hidden",
                  background: "#fff",
                  boxShadow:
                    "0 4px 8px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* bilde eller fallback */}
                <div
                  style={{
                    width: "100%",
                    height: "180px",
                    backgroundColor: "#f3f4f6",
                    position: "relative",
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={venue.media?.[0]?.alt || venue.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        fontSize: "0.8rem",
                        color: "#6b7280",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        padding: "0.5rem",
                      }}
                    >
                      No image
                    </div>
                  )}
                </div>

                {/* tekst */}
                <div style={{ padding: "1rem", fontSize: "0.9rem" }}>
                  <h3
                    style={{
                      margin: "0 0 0.4rem",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#111",
                      lineHeight: 1.3,
                    }}
                  >
                    {venue.name || "Untitled venue"}
                  </h3>

                  <p
                    style={{
                      margin: "0 0 0.25rem",
                      color: "#4b5563",
                      lineHeight: 1.4,
                    }}
                  >
                    {city}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "#111",
                      fontWeight: 500,
                    }}
                  >
                    {venue.price} NOK / night
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
