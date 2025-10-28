import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllVenues, type Venue } from "../../api/venues";

export default function Venues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchVenues(search?: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllVenues(search);
      setVenues(data);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVenues();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchVenues(query);
  }

  return (
    <main style={{ padding: "1.5rem" }}>
      <h1>Available Venues</h1>

      {/* 🔍 Search bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search venues..."
          style={{
            padding: "0.6rem 0.8rem",
            border: "1px solid #ccc",
            borderRadius: "6px",
            width: "250px",
            marginRight: "0.5rem",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.6rem 1rem",
            border: "none",
            borderRadius: "6px",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {loading && <p>Loading venues...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && venues.length === 0 && <p>No venues found.</p>}

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        }}
      >
        {venues.map((venue) => (
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
                border: "1px solid #ccc",
                borderRadius: "10px",
                overflow: "hidden",
                background: "#fff",
              }}
            >
              {venue.media && venue.media[0] && (
                <img
                  src={venue.media[0].url}
                  alt={venue.media[0].alt || venue.name}
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover",
                  }}
                />
              )}
              <div style={{ padding: "1rem" }}>
                <h3>{venue.name}</h3>
                <p>{venue.location?.city || "Unknown city"}</p>
                <p>
                  <strong>${venue.price}</strong> / night
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
