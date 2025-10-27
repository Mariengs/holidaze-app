import { useEffect, useState } from "react";
import { getAllVenues, type Venue } from "../../api/venues";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function Home() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchVenues() {
      try {
        setLoading(true);
        const data = await getAllVenues();
        setVenues(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchVenues();
  }, []);

  return (
    <ProtectedRoute>
      <main style={{ padding: "2rem" }}>
        <h1>Available Venues</h1>

        {loading && <p>Loading venues...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        <section
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          }}
        >
          {venues.map((venue) => (
            <article
              key={venue.id}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: "10px",
                padding: "1rem",
              }}
            >
              <img
                src={venue.media?.[0]?.url || "https://via.placeholder.com/300"}
                alt={venue.media?.[0]?.alt || venue.name}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  aspectRatio: "4 / 3",
                  objectFit: "cover",
                }}
              />
              <h2>{venue.name}</h2>
              <p>{venue.description}</p>
              <p>
                <strong>${venue.price}</strong> / night
              </p>
            </article>
          ))}
        </section>
      </main>
    </ProtectedRoute>
  );
}
