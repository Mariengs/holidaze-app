import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookingSearchBar from "../../components/BookingSearchBar";
import { getAllVenues, type Venue } from "../../api/venues";
import styles from "./home.module.css";

export default function HomePage() {
  const navigate = useNavigate();

  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topVenues, setTopVenues] = useState<Venue[]>([]);

  function handleSearch(values: any) {
    const params = new URLSearchParams({
      destination: values.destination || "",
      checkIn: values.checkIn || "",
      checkOut: values.checkOut || "",
      guests: String(values.guests || 1),
    });

    navigate(`/venues?${params.toString()}`);
  }

  useEffect(() => {
    async function fetchVenues() {
      try {
        const all = await getAllVenues();

        const sorted = [...all].sort(
          (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
        );

        const selected = sorted.slice(0, 6);
        setTopVenues(selected);

        const images = selected
          .map((v) => v.media?.[0]?.url)
          .filter((u): u is string => Boolean(u));

        setHeroImages(images);
      } catch (err) {
        console.error("Failed to fetch venues:", err);
      }
    }

    fetchVenues();
  }, []);

  useEffect(() => {
    if (heroImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % heroImages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [heroImages]);

  const currentImage = heroImages[currentIndex];

  return (
    <main className={styles.page}>
      {/* HERO */}
      <section
        className={styles.hero}
        style={{
          backgroundImage: currentImage ? `url(${currentImage})` : "none",
        }}
      >
        <div className={styles.heroOverlay} />

        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>Find your perfect stay</h1>
          <p className={styles.heroSubtitle}>
            Discover highly rated venues trusted by thousands of travelers.
          </p>

          <BookingSearchBar
            className={styles.searchOnHero}
            onSearch={handleSearch}
          />
        </div>
      </section>

      {/* FEATURED VENUES – LARGE BANNERS */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Top rated stays</h2>

        <div className={styles.bannerList}>
          {topVenues.map((venue) => {
            const imageUrl = venue.media?.[0]?.url || "";
            const city =
              venue.location?.city || venue.location?.country || "No location";
            const rating =
              typeof venue.rating === "number"
                ? venue.rating.toFixed(1)
                : "0.0";

            return (
              <Link
                to={`/venues/${venue.id}`}
                key={venue.id}
                className={styles.bannerItem}
              >
                <div className={styles.bannerImageWrapper}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={venue.name}
                      className={styles.bannerImage}
                    />
                  ) : (
                    <div className={styles.bannerThumbFallback}>No image</div>
                  )}
                </div>

                <div className={styles.bannerContent}>
                  <div className={styles.bannerHeader}>
                    <h3 className={styles.bannerTitle}>
                      {venue.name || "Untitled venue"}
                    </h3>
                    <span className={styles.bannerRating}>★ {rating}</span>
                  </div>

                  <p className={styles.bannerLocation}>{city}</p>

                  {/* AMENITIES INSIDE BANNER */}
                  <div className={styles.bannerAmenities}>
                    {venue.meta?.wifi && <span>Wi-Fi</span>}
                    {venue.meta?.parking && <span>Parking</span>}
                    {venue.meta?.breakfast && <span>Breakfast</span>}
                    {venue.meta?.pets && <span>Pets allowed</span>}
                  </div>

                  <div className={styles.bannerFooter}>
                    <span className={styles.bannerPrice}>
                      {venue.price} NOK / night
                    </span>
                    <span className={styles.bannerGuests}>
                      {venue.maxGuests} guest
                      {venue.maxGuests === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
