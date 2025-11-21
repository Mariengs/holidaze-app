import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllVenues, type Venue } from "../../api/venues";
import styles from "./Venues.module.css";
import BookingSearchBar from "../../components/BookingSearchBar"; // ✅ only default import

// ✅ Local type for the search values (no need to export it from the component)
type BookingSearchValues = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export default function Venues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchVenues(search?: string) {
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

  useEffect(() => {
    fetchVenues();
  }, []);

  function handleBookingSearch(values: BookingSearchValues) {
    // Right now we only filter by destination
    if (values.destination) {
      fetchVenues(values.destination);
    } else {
      fetchVenues();
    }
  }

  return (
    <main className={styles.main}>
      {/* Top search bar shared with homepage etc. */}
      <BookingSearchBar onSearch={handleBookingSearch} />

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Available Venues</h1>
          <p className={styles.subtitle}>
            Browse and filter venues to find the perfect place for your stay.
          </p>
        </div>

        {(loading || searching) && (
          <span className={styles.statusText}>
            {searching ? "Searching…" : "Loading venues…"}
          </span>
        )}
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {!loading && !searching && venues.length === 0 && !error && (
        <p className={styles.emptyState}>
          No venues found. Try another search.
        </p>
      )}

      <section className={styles.grid}>
        {venues.map((venue) => {
          const imageUrl = venue.media?.[0]?.url || "";
          const city =
            venue.location?.city ||
            venue.location?.country ||
            "No location set";

          const rating = typeof venue.rating === "number" ? venue.rating : 0;

          // AMENITIES
          const amenities: string[] = [];
          if (venue.meta?.wifi) amenities.push("Wi-Fi");
          if (venue.meta?.parking) amenities.push("Parking");
          if (venue.meta?.breakfast) amenities.push("Breakfast");
          if (venue.meta?.pets) amenities.push("Pets allowed");

          // CAPACITY: guests
          const maxGuests =
            typeof venue.maxGuests === "number" ? venue.maxGuests : null;

          return (
            <Link
              key={venue.id}
              to={`/venues/${venue.id}`}
              className={styles.cardLink}
            >
              <article className={styles.card}>
                <div className={styles.imageWrapper}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={venue.media?.[0]?.alt || venue.name}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.imageFallback}>No image</div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>
                    {venue.name || "Untitled venue"}
                  </h3>

                  <p className={styles.cardLocation}>{city}</p>

                  {/* Rating + price row */}
                  <div className={styles.metaRow}>
                    <div className={styles.rating}>
                      <div className={styles.ratingStars}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <span
                            key={i}
                            className={
                              i < Math.round(rating)
                                ? styles.ratingStarFilled
                                : styles.ratingStarEmpty
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className={styles.ratingValue}>
                        {rating.toFixed(1)}
                      </span>
                    </div>

                    <p className={styles.cardPrice}>
                      <span>{venue.price} NOK</span>
                      <span className={styles.pricePerNight}> / night</span>
                    </p>
                  </div>

                  {/* Capacity: guests */}
                  {maxGuests !== null && maxGuests > 0 && (
                    <div className={styles.capacityRow}>
                      <div className={styles.capacityItem}>
                        <span className={styles.capacityIcon}>👥</span>
                        <span className={styles.capacityText}>
                          {maxGuests} guest{maxGuests === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {amenities.length > 0 && (
                    <div className={styles.amenities}>
                      {amenities.map((amenity) => (
                        <span key={amenity} className={styles.amenityTag}>
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
