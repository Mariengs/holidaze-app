// SingleVenue.tsx
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

  // calender + form
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Calender
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
  const startWeekday = firstOfMonth.getDay(); // 0=sun

  // Helpers
  const toIso = (d: Date) => {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd.toISOString().split("T")[0];
  };
  const isRangeBlocked = (startIso: string, endIso: string) => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (bookedSet.has(toIso(d))) return true;
    }
    return false;
  };

  // Calender handler
  function handleDayClick(iso?: string, disabled?: boolean) {
    if (!iso || disabled) return;
    const clicked = new Date(iso);
    if (clicked < startOfToday) return;
    if (bookedSet.has(iso)) return;
    if (!dateFrom) {
      setDateFrom(iso);
      setDateTo("");
      return;
    }
    if (dateFrom && !dateTo) {
      if (new Date(iso) < new Date(dateFrom)) {
        setDateFrom(iso);
        setDateTo("");
        return;
      }
      if (isRangeBlocked(dateFrom, iso)) {
        setDateFrom(iso);
        setDateTo("");
        return;
      }
      setDateTo(iso);
      return;
    }
    setDateFrom(iso);
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

    let inRange = false;
    if (dateFrom && dateTo) {
      const s = new Date(dateFrom);
      const e = new Date(dateTo);
      s.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);
      inRange = dateObj > s && dateObj < e;
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

  // ---------- NEW: Amenities helper ----------
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

  return (
    <main className={styles.page}>
      {/* Hero-bilde */}
      {venue.media?.[0]?.url && (
        <img
          src={venue.media[0].url}
          alt={venue.media[0].alt || venue.name}
          className={styles.hero}
        />
      )}

      {/* Info-header */}
      <header className={styles.header}>
        <h1 className={styles.title}>{venue.name}</h1>
        <p className={styles.location}>
          {venue.location?.city}, {venue.location?.country}
        </p>
        <p className={styles.description}>{venue.description}</p>
      </header>

      {/* Pris / rating / gjester */}
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

      {/* ---------- NEW: Amenities ---------- */}
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

      {/* Eier-info */}
      {venue.owner && (
        <section className={styles.host}>
          <h3 className={styles.hostTitle}>Hosted by {venue.owner.name}</h3>
          <p className={styles.hostEmail}>{venue.owner.email}</p>
        </section>
      )}

      {/* Kalender */}
      <section className={styles.calendarSection}>
        <div className={styles.sectionHeader}>
          <h2>Availability</h2>
          <span className={styles.legend}>
            <span className={`${styles.dot} ${styles.dotBooked}`} /> Booked
            <span className={`${styles.dot} ${styles.dotToday}`} /> Today
            <span className={`${styles.dot} ${styles.dotSelected}`} /> Selected
          </span>
        </div>

        <div className={styles.calendarCard}>
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
              {currentDate.toLocaleString("default", { month: "long" })} {year}
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

          <div className={styles.weekdays}>
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className={styles.grid}>
            {cells.map((cell, idx) => {
              const state = cell.booked
                ? styles.dayBooked
                : cell.isStart || cell.isEnd
                  ? styles.daySelectedEdge
                  : cell.inRange
                    ? styles.dayInRange
                    : cell.isToday
                      ? styles.dayToday
                      : styles.dayFree;

              return (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.day} ${state}`}
                  onClick={() => handleDayClick(cell.iso, cell.disabled)}
                  disabled={!cell.iso || cell.disabled}
                  aria-label={cell.iso ? `Select ${cell.iso}` : undefined}
                >
                  {cell.label && (
                    <span className={styles.dayLabel}>{cell.label}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Valgindikator under kalender */}
          <div className={styles.selectionRow}>
            <div>
              <strong>From:</strong> {dateFrom || "—"}
            </div>
            <div>
              <strong>To:</strong> {dateTo || "—"}
            </div>
          </div>
        </div>
      </section>

      {/* Booking form (synkronisert med valgene fra kalenderen) */}
      <section className={styles.formSection}>
        <h2>Book this venue</h2>
        <BookingForm
          venueId={venue.id}
          maxGuests={venue.maxGuests}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={(val) => {
            // ikke tillat range med bookede dager
            if (dateFrom && val && isRangeBlocked(dateFrom, val)) {
              // om ulovlig, flytt start til val i stedet
              setDateFrom(val);
              setDateTo("");
              return;
            }
            setDateTo(val);
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
}: {
  venueId: string;
  maxGuests: number;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
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
      setMessage("Please select a start and end date.");
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
      onDateFromChange("");
      onDateToChange("");
      setGuests(1);
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
          Once you’re logged in, you’ll be able to select dates and confirm your
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

      <label className={styles.field}>
        <span className={styles.label}>From</span>
        <input
          type="date"
          value={dateFrom}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => onDateFromChange(e.target.value)}
          required
          className={styles.input}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>To</span>
        <input
          type="date"
          value={dateTo}
          min={dateFrom || new Date().toISOString().split("T")[0]}
          onChange={(e) => onDateToChange(e.target.value)}
          required
          className={styles.input}
        />
      </label>

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

      <button type="submit" disabled={loading} className={styles.button}>
        {loading ? "Booking..." : "Book now"}
      </button>
    </form>
  );
}
