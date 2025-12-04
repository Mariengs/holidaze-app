import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAllVenues, type Venue } from "../../api/venues";
import styles from "./Venues.module.css";
import BookingSearchBar from "../../components/BookingSearchBar";
import SearchModal from "../../components/SearchModal";

type BookingSearchValues = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

type SortOption =
  | "none"
  | "rating-high"
  | "rating-low"
  | "price-high"
  | "price-low";

export default function Venues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Filter states
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(5);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minGuests, setMinGuests] = useState(0);

  // Input states for text fields
  const [minRatingInput, setMinRatingInput] = useState("0");
  const [maxRatingInput, setMaxRatingInput] = useState("5");
  const [minPriceInput, setMinPriceInput] = useState("0");
  const [maxPriceInput, setMaxPriceInput] = useState("10000");
  const [minGuestsInput, setMinGuestsInput] = useState("0");

  // Reset key to force BookingSearchBar to remount
  const [resetKey, setResetKey] = useState(0);

  async function fetchVenues() {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllVenues();
      setAllVenues(data);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
      setFilteredVenues([]);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }

  useEffect(() => {
    fetchVenues();
  }, []);

  // Apply search from URL params when venues are loaded
  useEffect(() => {
    if (loading || allVenues.length === 0) return;

    const destination = searchParams.get("destination") || "";
    const guests = parseInt(searchParams.get("guests") || "0");

    // Read filter parameters from URL
    const urlSort = searchParams.get("sort") as SortOption | null;
    const urlMinPrice = searchParams.get("minPrice");
    const urlMaxPrice = searchParams.get("maxPrice");
    const urlMinRating = searchParams.get("minRating");
    const urlMinGuests = searchParams.get("minGuests");

    // Apply URL parameters to filters
    if (urlSort && urlSort !== sortBy) setSortBy(urlSort);
    if (urlMinPrice) {
      const val = parseInt(urlMinPrice);
      setMinPrice(val);
      setMinPriceInput(val.toString());
    }
    if (urlMaxPrice) {
      const val = parseInt(urlMaxPrice);
      setMaxPrice(val);
      setMaxPriceInput(val.toString());
    }
    if (urlMinRating) {
      const val = parseFloat(urlMinRating);
      setMinRating(val);
      setMinRatingInput(val.toString());
    }
    if (urlMinGuests) {
      const val = parseInt(urlMinGuests);
      setMinGuests(val);
      setMinGuestsInput(val.toString());
    }

    if (destination || guests > 0) {
      setFiltering(true);
      setTimeout(() => {
        filterAndSortVenues({ destination, guests });
        setFiltering(false);
      }, 100);
    } else {
      filterAndSortVenues({ destination: "", guests: 0 });
    }
  }, [allVenues, searchParams, loading]);

  // Re-filter when filter states change
  useEffect(() => {
    if (loading || allVenues.length === 0) return;

    const destination = searchParams.get("destination") || "";
    const guests = parseInt(searchParams.get("guests") || "0");
    filterAndSortVenues({ destination, guests });
  }, [
    sortBy,
    minRating,
    maxRating,
    minPrice,
    maxPrice,
    selectedAmenities,
    minGuests,
  ]);

  function filterAndSortVenues({
    destination,
    guests,
  }: {
    destination: string;
    guests: number;
  }) {
    let filtered = [...allVenues];

    // Filter by destination
    if (destination) {
      const query = destination.toLowerCase().trim();
      filtered = filtered.filter((venue) => {
        return (
          venue.name?.toLowerCase().includes(query) ||
          venue.location?.city?.toLowerCase().includes(query) ||
          venue.location?.country?.toLowerCase().includes(query) ||
          venue.location?.address?.toLowerCase().includes(query) ||
          venue.location?.continent?.toLowerCase().includes(query)
        );
      });
    }

    // Filter by guests (from search bar or manual filter)
    const guestsToFilter = Math.max(guests, minGuests);
    if (guestsToFilter > 0) {
      filtered = filtered.filter((venue) => venue.maxGuests >= guestsToFilter);
    }

    // Filter by rating range
    filtered = filtered.filter((venue) => {
      const rating = venue.rating ?? 0;
      return rating >= minRating && rating <= maxRating;
    });

    // Filter by price range
    filtered = filtered.filter((venue) => {
      return venue.price >= minPrice && venue.price <= maxPrice;
    });

    // Filter by amenities
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter((venue) => {
        return selectedAmenities.every((amenity) => {
          switch (amenity) {
            case "wifi":
              return venue.meta?.wifi === true;
            case "parking":
              return venue.meta?.parking === true;
            case "breakfast":
              return venue.meta?.breakfast === true;
            case "pets":
              return venue.meta?.pets === true;
            default:
              return false;
          }
        });
      });
    }

    // Sort venues
    if (sortBy !== "none") {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "rating-high":
            return (b.rating ?? 0) - (a.rating ?? 0);
          case "rating-low":
            return (a.rating ?? 0) - (b.rating ?? 0);
          case "price-high":
            return b.price - a.price;
          case "price-low":
            return a.price - b.price;
          default:
            return 0;
        }
      });
    }

    setFilteredVenues(filtered);
  }

  function handleBookingSearch(values: BookingSearchValues) {
    const params = new URLSearchParams();
    if (values.destination) params.set("destination", values.destination);
    if (values.guests) params.set("guests", values.guests.toString());
    if (values.checkIn) params.set("checkIn", values.checkIn);
    if (values.checkOut) params.set("checkOut", values.checkOut);

    setSearchParams(params);

    setFiltering(true);
    setTimeout(() => {
      filterAndSortVenues({
        destination: values.destination,
        guests: values.guests,
      });
      setFiltering(false);
    }, 100);
  }

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  }

  // Rating handlers
  function handleMinRatingChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setMinRatingInput(value);

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 5) {
      setMinRating(Math.min(numValue, maxRating));
    }
  }

  function handleMinRatingBlur() {
    const numValue = parseFloat(minRatingInput);
    if (isNaN(numValue) || numValue < 0) {
      setMinRating(0);
      setMinRatingInput("0");
    } else if (numValue > 5) {
      setMinRating(5);
      setMinRatingInput("5");
    } else {
      setMinRating(Math.min(numValue, maxRating));
      setMinRatingInput(Math.min(numValue, maxRating).toString());
    }
  }

  function handleMaxRatingChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setMaxRatingInput(value);

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 5) {
      setMaxRating(Math.max(numValue, minRating));
    }
  }

  function handleMaxRatingBlur() {
    const numValue = parseFloat(maxRatingInput);
    if (isNaN(numValue) || numValue < 0) {
      setMaxRating(0);
      setMaxRatingInput("0");
    } else if (numValue > 5) {
      setMaxRating(5);
      setMaxRatingInput("5");
    } else {
      setMaxRating(Math.max(numValue, minRating));
      setMaxRatingInput(Math.max(numValue, minRating).toString());
    }
  }

  // Price handlers
  function handleMinPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setMinPriceInput(value);

    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setMinPrice(Math.min(numValue, maxPrice));
    }
  }

  function handleMinPriceBlur() {
    const numValue = parseInt(minPriceInput);
    if (isNaN(numValue) || numValue < 0) {
      setMinPrice(0);
      setMinPriceInput("0");
    } else {
      setMinPrice(Math.min(numValue, maxPrice));
      setMinPriceInput(Math.min(numValue, maxPrice).toString());
    }
  }

  function handleMaxPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setMaxPriceInput(value);

    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setMaxPrice(Math.max(numValue, minPrice));
    }
  }

  function handleMaxPriceBlur() {
    const numValue = parseInt(maxPriceInput);
    if (isNaN(numValue) || numValue < 0) {
      setMaxPrice(0);
      setMaxPriceInput("0");
    } else {
      setMaxPrice(Math.max(numValue, minPrice));
      setMaxPriceInput(Math.max(numValue, minPrice).toString());
    }
  }

  // Guests handlers
  function handleMinGuestsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setMinGuestsInput(value);

    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setMinGuests(numValue);
    }
  }

  function handleMinGuestsBlur() {
    const numValue = parseInt(minGuestsInput);
    if (isNaN(numValue) || numValue < 0) {
      setMinGuests(0);
      setMinGuestsInput("0");
    } else {
      setMinGuests(numValue);
      setMinGuestsInput(numValue.toString());
    }
  }

  function resetFilters() {
    setSortBy("none");
    setMinRating(0);
    setMaxRating(5);
    setMinPrice(0);
    setMaxPrice(10000);
    setSelectedAmenities([]);
    setMinGuests(0);
    setMinRatingInput("0");
    setMaxRatingInput("5");
    setMinPriceInput("0");
    setMaxPriceInput("10000");
    setMinGuestsInput("0");

    setSearchParams({});

    setResetKey((prev) => prev + 1);
  }

  const currentDestination = searchParams.get("destination") || "";
  const isLoading = loading || filtering;

  return (
    <main className={styles.main}>
      {/* Desktop search bar */}
      <div className={styles.desktopSearch}>
        <BookingSearchBar key={resetKey} onSearch={handleBookingSearch} />
      </div>

      {/* Mobile search button */}
      <button
        className={styles.mobileSearchButton}
        onClick={() => setIsSearchModalOpen(true)}
      >
        🔍 Search for stays
      </button>

      {/* Search Modal for mobile */}
      <SearchModal
        key={resetKey}
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSearch={handleBookingSearch}
      />

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Available Venues</h1>
          <p className={styles.subtitle}>
            Browse and filter venues to find the perfect place for your stay.
          </p>
        </div>

        {isLoading && (
          <span className={styles.statusText}>
            {filtering ? "Searching…" : "Loading venues…"}
          </span>
        )}
      </header>

      {/* FILTERS AND SORTING */}
      <section className={styles.filterSection}>
        {/* Mobile: Collapsible header */}
        <button
          className={styles.filterToggle}
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        >
          <span className={styles.filterToggleText}>
            Sort & Filter
            {(sortBy !== "none" ||
              minRating > 0 ||
              maxRating < 5 ||
              minPrice > 0 ||
              maxPrice < 10000 ||
              selectedAmenities.length > 0 ||
              minGuests > 0) && (
              <span className={styles.activeFilterBadge}>
                {
                  [
                    sortBy !== "none",
                    minRating > 0 || maxRating < 5,
                    minPrice > 0 || maxPrice < 10000,
                    selectedAmenities.length > 0,
                    minGuests > 0,
                  ].filter(Boolean).length
                }
              </span>
            )}
          </span>
          <span
            className={`${styles.filterToggleIcon} ${isFiltersOpen ? styles.filterToggleIconOpen : ""}`}
          >
            ▼
          </span>
        </button>

        {/* Filter content - desktop, collapsible on mobile */}
        <div
          className={`${styles.filterContent} ${isFiltersOpen ? styles.filterContentOpen : ""}`}
        >
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <span className={styles.labelText}>Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className={styles.filterSelect}
                >
                  <option value="none">No Sorting</option>
                  <option value="rating-high">Rating (High to Low)</option>
                  <option value="rating-low">Rating (Low to High)</option>
                  <option value="price-high">Price (High to Low)</option>
                  <option value="price-low">Price (Low to High)</option>
                </select>
              </label>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.labelText}>Rating</span>
              <div className={styles.rangeInputs}>
                <input
                  type="text"
                  value={minRatingInput}
                  onChange={handleMinRatingChange}
                  onBlur={handleMinRatingBlur}
                  className={styles.filterInputSmall}
                  placeholder="Min"
                />
                <span className={styles.rangeSeparator}>–</span>
                <input
                  type="text"
                  value={maxRatingInput}
                  onChange={handleMaxRatingChange}
                  onBlur={handleMaxRatingBlur}
                  className={styles.filterInputSmall}
                  placeholder="Max"
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.labelText}>Price (NOK)</span>
              <div className={styles.rangeInputs}>
                <input
                  type="text"
                  value={minPriceInput}
                  onChange={handleMinPriceChange}
                  onBlur={handleMinPriceBlur}
                  className={styles.filterInputSmall}
                  placeholder="Min"
                />
                <span className={styles.rangeSeparator}>–</span>
                <input
                  type="text"
                  value={maxPriceInput}
                  onChange={handleMaxPriceChange}
                  onBlur={handleMaxPriceBlur}
                  className={styles.filterInputSmall}
                  placeholder="Max"
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <span className={styles.labelText}>Min Guests</span>
                <input
                  type="text"
                  value={minGuestsInput}
                  onChange={handleMinGuestsChange}
                  onBlur={handleMinGuestsBlur}
                  className={styles.filterInput}
                  placeholder="Any"
                />
              </label>
            </div>
          </div>

          <div className={styles.amenityRow}>
            <span className={styles.labelText}>Amenities</span>
            <div className={styles.amenityFilters}>
              <label className={styles.amenityCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes("wifi")}
                  onChange={() => toggleAmenity("wifi")}
                />
                <span>Wi-Fi</span>
              </label>
              <label className={styles.amenityCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes("parking")}
                  onChange={() => toggleAmenity("parking")}
                />
                <span>Parking</span>
              </label>
              <label className={styles.amenityCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes("breakfast")}
                  onChange={() => toggleAmenity("breakfast")}
                />
                <span>Breakfast</span>
              </label>
              <label className={styles.amenityCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes("pets")}
                  onChange={() => toggleAmenity("pets")}
                />
                <span>Pets</span>
              </label>
            </div>
          </div>

          <div className={styles.filterActions}>
            <button
              onClick={resetFilters}
              className={styles.resetFiltersButton}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      {error && <p className={styles.error}>{error}</p>}

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>
            {filtering ? "Searching venues..." : "Loading venues..."}
          </p>
        </div>
      ) : filteredVenues.length === 0 &&
        !error &&
        hasLoadedOnce &&
        allVenues.length > 0 ? (
        <p className={styles.emptyState}>
          {currentDestination
            ? `No venues found for "${currentDestination}". Try another search.`
            : "No venues found matching your filters."}
        </p>
      ) : (
        <section className={styles.grid}>
          {filteredVenues.map((venue) => {
            const imageUrl = venue.media?.[0]?.url || "";
            const city =
              venue.location?.city ||
              venue.location?.country ||
              "No location set";

            const rating = typeof venue.rating === "number" ? venue.rating : 0;

            const amenities: string[] = [];
            if (venue.meta?.wifi) amenities.push("Wi-Fi");
            if (venue.meta?.parking) amenities.push("Parking");
            if (venue.meta?.breakfast) amenities.push("Breakfast");
            if (venue.meta?.pets) amenities.push("Pets allowed");

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
      )}
    </main>
  );
}
