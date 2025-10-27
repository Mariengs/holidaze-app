import { useEffect, useState } from "react";
import { getAllVenues, type Venue } from "../../api/venues";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
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

    load();
  }, []);

  return (
    <ProtectedRoute>
      <section style={{ padding: "2rem" }}>
        <h1 style={{ marginBottom: "1rem" }}>Available Venues</h1>

        {loading && <p>Loading venues…</p>}
        {error && (
          <p style={{ color: "red" }}>Could not load venues: {error}</p>
        )}

        {!loading && !error && (
          <div
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
                  backgroundColor: "#fff",
                }}
              >
                <img
                  src={
                    venue.media?.[0]?.url ||
                    "https://via.placeholder.com/300?text=No+image"
                  }
                  alt={venue.media?.[0]?.alt || venue.name}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    aspectRatio: "4 / 3",
                    objectFit: "cover",
                    backgroundColor: "#f5f5f5",
                  }}
                />

                <h2
                  style={{
                    margin: "0.75rem 0 0.5rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {venue.name}
                </h2>

                <p
                  style={{
                    fontSize: ".9rem",
                    color: "#444",
                    lineHeight: 1.4,
                    marginBottom: ".75rem",
                  }}
                >
                  {venue.description}
                </p>

                <p style={{ fontWeight: 500, marginBottom: ".5rem" }}>
                  ${venue.price} / night
                </p>

                {venue.location?.city || venue.location?.country ? (
                  <p
                    style={{
                      fontSize: ".8rem",
                      color: "#666",
                    }}
                  >
                    {venue.location?.city ? venue.location.city + ", " : ""}
                    {venue.location?.country || ""}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </ProtectedRoute>
  );
}
