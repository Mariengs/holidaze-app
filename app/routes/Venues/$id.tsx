import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getVenueById,
  createBooking,
  type Venue,
  type Booking,
} from "../../api/venues";
import { getToken } from "../../api/auth";
import styles from "./$id.module.css";

export default function SingleVenue() {
  const params = useParams<{ id: string }>();
  const id = params.id as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Image gallery state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Calendar + form
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Calendar
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const [currentDate, setCurrentDate] = useState<Date>(startOfToday);
  const isAtCurrentMonth =
    currentDate.getFullYear() === startOfToday.getFullYear() &&
    currentDate.getMonth() === startOfToday.getMonth();

  function handlePrevMonth() {
    if (isAtCurrentMonth) return;
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function handleGoToday() {
    setCurrentDate(new Date(startOfToday));
  }

  function getBookedDates(bookings: Booking[] | undefined): string[] {
    if (!bookings || bookings.length === 0) return [];
    const all: string[] = [];
    for (const b of bookings) {
      const s = new Date(b.dateFrom);
      const e = new Date(b.dateTo);
      const cur = new Date(s);
      cur.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);
      while (cur <= e) {
        all.push(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return all;
  }

  // Image gallery functions
  function openLightbox(index: number) {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  function nextImage() {
    if (!venue?.media) return;
    setCurrentImageIndex((prev) => (prev + 1) % venue.media.length);
  }

  function prevImage() {
    if (!venue?.media) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? venue.media.length - 1 : prev - 1
    );
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, venue?.media]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getVenueById(id);
        if (active) setVenue(data);
      } catch (err) {
        console.error(err);
        if (active) setError((err as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <p className={styles.muted}>Loading venue...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!venue) return <p className={styles.muted}>No venue found.</p>;

  // Calendar logic
  const bookedDates = getBookedDates(venue.bookings);
  const bookedSet = new Set(bookedDates);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastOfMonth.getDate();

  // Start week on Monday (1) instead of Sunday (0)
  let startWeekday = firstOfMonth.getDay();
  startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;

  // Helpers
  const toIso = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isRangeBlocked = (startIso: string, endIso: string) => {
    const [startYear, startMonth, startDay] = startIso.split("-").map(Number);
    const [endYear, endMonth, endDay] = endIso.split("-").map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    const current = new Date(start);

    while (current <= end) {
      const currentIso = toIso(current);
      if (bookedSet.has(currentIso)) return true;
      current.setDate(current.getDate() + 1);
    }
    return false;
  };

  // Calendar handler
  function handleDayClick(iso: string) {
    const [year, month, day] = iso.split("-").map(Number);
    const clicked = new Date(year, month - 1, day);

    // Can't select past dates or booked dates
    if (clicked < startOfToday || bookedSet.has(iso)) return;

    // No dates selected - set start date
    if (!dateFrom && !dateTo) {
      setDateFrom(iso);
      return;
    }

    // Only start date selected
    if (dateFrom && !dateTo) {
      const [fromYear, fromMonth, fromDay] = dateFrom.split("-").map(Number);
      const fromDate = new Date(fromYear, fromMonth - 1, fromDay);

      // Clicked same date as start - clear selection
      if (clicked.getTime() === fromDate.getTime()) {
        setDateFrom("");
        return;
      }

      // Clicked before start date - restart selection
      if (clicked < fromDate) {
        setDateFrom(iso);
        return;
      }

      // Check if range has booked dates
      if (isRangeBlocked(dateFrom, iso)) {
        // Range blocked - restart selection from clicked date
        setDateFrom(iso);
        setDateTo("");
        return;
      }

      // Valid range - set end date
      setDateTo(iso);
      return;
    }

    // Both dates selected - start new selection
    setDateFrom(iso);
    setDateTo("");
  }

  // Clear selection
  function handleClearDates() {
    setDateFrom("");
    setDateTo("");
  }

  const cells: Array<{
    label: string;
    iso?: string;
    booked?: boolean;
    isToday?: boolean;
    inRange?: boolean;
    isStart?: boolean;
    isEnd?: boolean;
    disabled?: boolean;
  }> = [];

  for (let i = 0; i < startWeekday; i++) cells.push({ label: "" });

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    dateObj.setHours(0, 0, 0, 0);
    const iso = toIso(dateObj);
    const isToday = dateObj.getTime() === startOfToday.getTime();
    const booked = bookedSet.has(iso);
    const isPast = dateObj < startOfToday;
    const isStart = Boolean(dateFrom) && iso === dateFrom;
    const isEnd = Boolean(dateTo) && iso === dateTo;

    // Include all dates between start and end (inclusive)
    let inRange = false;
    if (dateFrom && dateTo) {
      const [fromYear, fromMonth, fromDay] = dateFrom.split("-").map(Number);
      const [toYear, toMonth, toDay] = dateTo.split("-").map(Number);
      const s = new Date(fromYear, fromMonth - 1, fromDay);
      const e = new Date(toYear, toMonth - 1, toDay);
      inRange = dateObj >= s && dateObj <= e;
    }

    cells.push({
      label: String(day),
      iso,
      booked,
      isToday,
      inRange,
      isStart,
      isEnd,
      disabled: booked || isPast,
    });
  }

  // Amenities helper
  function renderAmenity(label: string, value?: boolean) {
    const active = !!value;
    return (
      <li
        key={label}
        className={`${styles.amenity} ${active ? styles.amenityOn : styles.amenityOff}`}
        aria-label={`${label}: ${active ? "included" : "not included"}`}
        title={active ? `${label} included` : `${label} not included`}
      >
        <span className={styles.amenityIcon}>{active ? "✓" : "–"}</span>
        <span className={styles.amenityText}>{label}</span>
      </li>
    );
  }

  const images = venue.media || [];
  const hasMultipleImages = images.length > 1;

  return (
    <main className={styles.page}>
      {/* Image Gallery */}
      {images.length > 0 && (
        <section className={styles.gallery}>
          {/* Main image */}
          <div
            className={styles.mainImage}
            onClick={() => openLightbox(0)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openLightbox(0);
              }
            }}
          >
            <img
              src={images[0].url}
              alt={images[0].alt || venue.name}
              className={styles.mainImg}
            />
            {hasMultipleImages && (
              <div className={styles.imageCount}>
                📷 {images.length} {images.length === 1 ? "photo" : "photos"}
              </div>
            )}
          </div>

          {/* Thumbnail grid - only show if multiple images */}
          {hasMultipleImages && (
            <div className={styles.thumbnails}>
              {images.slice(1, 5).map((img, idx) => (
                <div
                  key={idx}
                  className={styles.thumbnail}
                  onClick={() => openLightbox(idx + 1)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openLightbox(idx + 1);
                    }
                  }}
                >
                  <img src={img.url} alt={img.alt || venue.name} />
                  {idx === 3 && images.length > 5 && (
                    <div className={styles.moreImages}>
                      +{images.length - 5}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div className={styles.lightbox} onClick={closeLightbox}>
          <button
            className={styles.lightboxClose}
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            ✕
          </button>

          <div
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[currentImageIndex].url}
              alt={images[currentImageIndex].alt || venue.name}
              className={styles.lightboxImage}
            />

            {hasMultipleImages && (
              <>
                <button
                  className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  ›
                </button>

                <div className={styles.lightboxCounter}>
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info header */}
      <header className={styles.header}>
        <h1 className={styles.title}>{venue.name}</h1>
        <p className={styles.location}>
          {venue.location?.city}, {venue.location?.country}
        </p>
        <p className={styles.description}>{venue.description}</p>
      </header>

      {/* Price / rating / guests */}
      <section className={styles.metaRow}>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>Price</span>
          <span className={styles.metaValue}>${venue.price} / night</span>
        </div>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>Rating</span>
          <span className={styles.metaValue}>
            ⭐ {venue.rating ?? "No rating yet"}
          </span>
        </div>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>Max guests</span>
          <span className={styles.metaValue}>{venue.maxGuests ?? "N/A"}</span>
        </div>
      </section>

      {/* Amenities */}
      <section className={styles.amenitiesSection}>
        <h3 className={styles.amenitiesTitle}>Amenities</h3>

        {venue.meta &&
        (venue.meta.wifi ||
          venue.meta.parking ||
          venue.meta.breakfast ||
          venue.meta.pets) ? (
          <ul className={styles.amenitiesList}>
            {renderAmenity("Wi-Fi", venue.meta?.wifi)}
            {renderAmenity("Parking", venue.meta?.parking)}
            {renderAmenity("Breakfast", venue.meta?.breakfast)}
            {renderAmenity("Pets allowed", venue.meta?.pets)}
          </ul>
        ) : (
          <p className={styles.muted}>No amenities listed.</p>
        )}
      </section>

      {/* Host info */}
      {venue.owner && (
        <section className={styles.host}>
          <h3 className={styles.hostTitle}>Hosted by {venue.owner.name}</h3>
          <p className={styles.hostEmail}>{venue.owner.email}</p>
        </section>
      )}

      {/* Calendar */}
      <section className={styles.calendarSection}>
        <div className={styles.sectionHeader}>
          <h2>Availability</h2>
        </div>

        <div className={styles.calendarCard}>
          <div className={styles.calendarTop}>
            <div className={styles.calendarHeader}>
              <div className={styles.navGroup}>
                <button
                  onClick={handlePrevMonth}
                  className={styles.navButton}
                  aria-label="Previous month"
                  type="button"
                  disabled={isAtCurrentMonth}
                >
                  ‹
                </button>
                <button
                  onClick={handleNextMonth}
                  className={styles.navButton}
                  aria-label="Next month"
                  type="button"
                >
                  ›
                </button>
              </div>

              <span className={styles.monthName}>
                {currentDate.toLocaleString("default", { month: "long" })}{" "}
                {year}
              </span>

              <button
                onClick={handleGoToday}
                className={styles.todayButton}
                type="button"
                disabled={isAtCurrentMonth}
              >
                Today
              </button>
            </div>

            <span className={styles.legend}>
              <span>
                <span className={`${styles.dot} ${styles.dotBooked}`} /> Booked
              </span>
              <span>
                <span className={`${styles.dot} ${styles.dotToday}`} /> Today
              </span>
              <span>
                <span className={`${styles.dot} ${styles.dotSelected}`} />{" "}
                Selected
              </span>
            </span>
          </div>

          <div className={styles.weekdays}>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          <div className={styles.grid}>
            {cells.map((cell, idx) => {
              if (!cell.iso) {
                return <div key={idx} className={styles.dayEmpty} />;
              }

              const isInSelectedRange =
                cell.inRange && !cell.isStart && !cell.isEnd;
              const state = cell.booked
                ? styles.dayBooked
                : cell.isStart || cell.isEnd
                  ? styles.daySelectedEdge
                  : isInSelectedRange
                    ? styles.dayInRange
                    : cell.isToday
                      ? styles.dayToday
                      : styles.dayFree;

              return (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.day} ${state}`}
                  onClick={() => handleDayClick(cell.iso!)}
                  disabled={cell.disabled}
                  aria-label={`Select ${cell.iso}`}
                >
                  <span className={styles.dayLabel}>{cell.label}</span>
                </button>
              );
            })}
          </div>

          {/* Selection indicator */}
          <div className={styles.selectionRow}>
            <div>
              <strong>From:</strong> {dateFrom || "—"}
            </div>
            <div>
              <strong>To:</strong> {dateTo || "—"}
            </div>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={handleClearDates}
                className={styles.clearButton}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Booking form */}
      <section className={styles.formSection}>
        <h2>Book this venue</h2>
        <BookingForm
          venueId={venue.id}
          maxGuests={venue.maxGuests}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onClearDates={handleClearDates}
          onBookingSuccess={async () => {
            // Refresh venue data to show updated bookings
            try {
              const data = await getVenueById(id);
              setVenue(data);
            } catch (err) {
              console.error("Failed to refresh venue:", err);
            }
          }}
        />
      </section>
    </main>
  );
}

/* ---------------------------------
   BookingForm 
--------------------------------- */

function BookingForm({
  venueId,
  maxGuests,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearDates,
  onBookingSuccess,
}: {
  venueId: string;
  maxGuests: number;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onClearDates: () => void;
  onBookingSuccess: () => Promise<void>;
}) {
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token = getToken();
  const isLoggedIn = !!token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isLoggedIn) {
      setMessage("You must be logged in to make a booking.");
      return;
    }
    if (!dateFrom || !dateTo) {
      setMessage(
        "Please select both check-in and check-out dates from the calendar above."
      );
      return;
    }
    if (guests > maxGuests) {
      setMessage(`Maximum guests allowed: ${maxGuests}`);
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await createBooking({ dateFrom, dateTo, guests, venueId });
      setMessage("✅ Booking successful!");
      onClearDates();
      setGuests(1);
      await onBookingSuccess();
    } catch (err) {
      setMessage((err as Error).message || "Booking failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className={styles.lockedBox}>
        <p className={styles.lockedTitle}>
          ⚠️ Please log in to book this venue.
        </p>
        <p className={styles.lockedText}>
          Once you're logged in, you'll be able to select dates and confirm your
          stay.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {message && (
        <p
          className={
            message.startsWith("✅") ? styles.msgSuccess : styles.msgError
          }
        >
          {message}
        </p>
      )}

      <div className={styles.dateDisplay}>
        <div className={styles.field}>
          <span className={styles.label}>Check-in</span>
          <div className={styles.dateValue}>
            {dateFrom
              ? (() => {
                  const [year, month, day] = dateFrom.split("-").map(Number);
                  return new Date(year, month - 1, day).toLocaleDateString();
                })()
              : "Select from calendar"}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Check-out</span>
          <div className={styles.dateValue}>
            {dateTo
              ? (() => {
                  const [year, month, day] = dateTo.split("-").map(Number);
                  return new Date(year, month - 1, day).toLocaleDateString();
                })()
              : "Select from calendar"}
          </div>
        </div>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Guests (max {maxGuests})</span>
        <input
          type="number"
          min={1}
          max={maxGuests}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          required
          className={styles.input}
        />
      </label>

      <button
        type="submit"
        disabled={loading || !dateFrom || !dateTo}
        className={styles.button}
      >
        {loading ? "Booking..." : "Book now"}
      </button>
    </form>
  );
}
