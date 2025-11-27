import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookingSearchBar from "../../components/BookingSearchBar";
import SearchModal from "../../components/SearchModal";
import { getAllVenues, type Venue } from "../../api/venues";
import styles from "./home.module.css";

type BookingSearchValues = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export default function HomePage() {
  const navigate = useNavigate();

  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Different venue categories
  const [recentlyAdded, setRecentlyAdded] = useState<Venue[]>([]);
  const [familyFriendly, setFamilyFriendly] = useState<Venue[]>([]);
  const [luxuryEscapes, setLuxuryEscapes] = useState<Venue[]>([]);
  const [budgetFriendly, setBudgetFriendly] = useState<Venue[]>([]);

  function handleSearch(values: BookingSearchValues) {
    // Build query params
    const params = new URLSearchParams();
    if (values.destination) params.set("destination", values.destination);
    if (values.guests) params.set("guests", values.guests.toString());
    if (values.checkIn) params.set("checkIn", values.checkIn);
    if (values.checkOut) params.set("checkOut", values.checkOut);

    // Navigate to venues page with search params
    navigate(`/venues?${params.toString()}`);
  }

  useEffect(() => {
    async function fetchVenues() {
      try {
        const all = await getAllVenues();

        // Recently Added - newest venues (by created date)
        const recent = [...all]
          .sort((a, b) => {
            const dateA = new Date(a.created || 0).getTime();
            const dateB = new Date(b.created || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 4);
        setRecentlyAdded(recent);

        // Family Friendly - high maxGuests (6+) and good rating
        const family = [...all]
          .filter((v) => v.maxGuests >= 6 && (v.rating ?? 0) >= 3.5)
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 4);
        setFamilyFriendly(family);

        // Luxury Escapes - high price (>2000) and high rating
        const luxury = [...all]
          .filter((v) => v.price > 2000 && (v.rating ?? 0) >= 4.0)
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 4);
        setLuxuryEscapes(luxury);

        // Budget Friendly - low price (<1000) and decent rating
        const budget = [...all]
          .filter((v) => v.price < 1000 && (v.rating ?? 0) >= 3.5)
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 4);
        setBudgetFriendly(budget);

        // Hero images from top rated venues
        const topRated = [...all]
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 6);

        const images = topRated
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

  function renderVenueCard(venue: Venue) {
    const imageUrl = venue.media?.[0]?.url || "";
    const city =
      venue.location?.city || venue.location?.country || "No location";
    const rating =
      typeof venue.rating === "number" ? venue.rating.toFixed(1) : "0.0";

    return (
      <Link
        to={`/venues/${venue.id}`}
        key={venue.id}
        className={styles.categoryCard}
      >
        <div className={styles.categoryCardImage}>
          {imageUrl ? (
            <img src={imageUrl} alt={venue.name} />
          ) : (
            <div className={styles.categoryCardImageFallback}>No image</div>
          )}
        </div>

        <div className={styles.categoryCardContent}>
          <h3 className={styles.categoryCardTitle}>
            {venue.name || "Untitled venue"}
          </h3>
          <p className={styles.categoryCardLocation}>{city}</p>

          <div className={styles.categoryCardMeta}>
            <span className={styles.categoryCardRating}>★ {rating}</span>
            <span className={styles.categoryCardPrice}>
              {venue.price} NOK<span className={styles.perNight}>/night</span>
            </span>
          </div>

          {/* Amenities */}
          <div className={styles.categoryCardAmenities}>
            {venue.meta?.wifi && <span>Wi-Fi</span>}
            {venue.meta?.parking && <span>Parking</span>}
            {venue.meta?.breakfast && <span>Breakfast</span>}
            {venue.meta?.pets && <span>Pets</span>}
          </div>
        </div>
      </Link>
    );
  }

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

          {/* Desktop search bar */}
          <BookingSearchBar
            className={`${styles.searchOnHero} ${styles.desktopSearch}`}
            onSearch={handleSearch}
          />

          {/* Mobile search button */}
          <button
            className={styles.mobileSearchButton}
            onClick={() => setIsSearchModalOpen(true)}
          >
            🔍 Search for stays
          </button>
        </div>
      </section>

      {/* Search Modal for mobile */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSearch={handleSearch}
      />

      {/* ALL CATEGORIES IN GRID */}
      <div className={styles.allCategoriesWrapper}>
        {/* RECENTLY ADDED */}
        {recentlyAdded.length > 0 && (
          <section className={styles.categorySection}>
            <div className={styles.categorySectionHeader}>
              <h2 className={styles.categorySectionTitle}>Recently Added</h2>
              <p className={styles.categorySectionSubtitle}>
                Explore our newest venues
              </p>
            </div>
            <div className={styles.categoryGrid}>
              {recentlyAdded.slice(0, 3).map(renderVenueCard)}
            </div>
            <Link to="/venues?sort=none" className={styles.viewAllButton}>
              View all recently added →
            </Link>
          </section>
        )}

        {/* FAMILY FRIENDLY */}
        {familyFriendly.length > 0 && (
          <section className={styles.categorySection}>
            <div className={styles.categorySectionHeader}>
              <h2 className={styles.categorySectionTitle}>Best for Families</h2>
              <p className={styles.categorySectionSubtitle}>
                Spacious venues perfect for family getaways
              </p>
            </div>
            <div className={styles.categoryGrid}>
              {familyFriendly.slice(0, 3).map(renderVenueCard)}
            </div>
            <Link
              to="/venues?minGuests=6&minRating=3.5&sort=rating-high"
              className={styles.viewAllButton}
            >
              View all family-friendly →
            </Link>
          </section>
        )}

        {/* LUXURY ESCAPES */}
        {luxuryEscapes.length > 0 && (
          <section className={styles.categorySection}>
            <div className={styles.categorySectionHeader}>
              <h2 className={styles.categorySectionTitle}>Luxury Escapes</h2>
              <p className={styles.categorySectionSubtitle}>
                Premium venues for an unforgettable experience
              </p>
            </div>
            <div className={styles.categoryGrid}>
              {luxuryEscapes.slice(0, 3).map(renderVenueCard)}
            </div>
            <Link
              to="/venues?minPrice=2000&minRating=4.0&sort=rating-high"
              className={styles.viewAllButton}
            >
              View all luxury venues →
            </Link>
          </section>
        )}

        {/* BUDGET FRIENDLY */}
        {budgetFriendly.length > 0 && (
          <section className={styles.categorySection}>
            <div className={styles.categorySectionHeader}>
              <h2 className={styles.categorySectionTitle}>Budget Friendly</h2>
              <p className={styles.categorySectionSubtitle}>
                Great value stays without compromising quality
              </p>
            </div>
            <div className={styles.categoryGrid}>
              {budgetFriendly.slice(0, 3).map(renderVenueCard)}
            </div>
            <Link
              to="/venues?maxPrice=1000&minRating=3.5&sort=rating-high"
              className={styles.viewAllButton}
            >
              View all budget venues →
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
