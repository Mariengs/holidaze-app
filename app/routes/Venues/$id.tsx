import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getVenueById,
  createBooking,
  type Venue,
  type Booking,
} from "../../api/venues";
import { getToken } from "../../api/auth";

export default function SingleVenue() {
  const params = useParams<{ id: string }>();
  const id = params.id as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // helper: lag en liste med alle datoer (yyyy-mm-dd) som er booket
  function getBookedDates(bookings: Booking[] | undefined): string[] {
    if (!bookings || bookings.length === 0) return [];

    const allDates: string[] = [];

    for (const booking of bookings) {
      const start = new Date(booking.dateFrom);
      const end = new Date(booking.dateTo);

      // gå dag for dag fra start til slutt (inkludert)
      const current = new Date(start);
      while (current <= end) {
        const iso = current.toISOString().split("T")[0]; // "2025-10-28"
        allDates.push(iso);
        current.setDate(current.getDate() + 1);
      }
    }

    return allDates;
  }

  useEffect(() => {
    async function fetchVenue() {
      try {
        const data = await getVenueById(id);
        setVenue(data);
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchVenue();
  }, [id]);

  if (loading) return <p>Loading venue...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!venue) return <p>No venue found.</p>;

  // lag liste over bookede datoer
  const bookedDates = getBookedDates(venue.bookings);

  // lag en enkel "kalender" for inneværende måned
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-11
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastOfMonth.getDate();

  // hvilken ukedag starter måneden på? (0 = søn, 1 = man, ...)
  const startWeekday = firstOfMonth.getDay();

  const cells: Array<{
    label: string;
    iso?: string;
    booked?: boolean;
  }> = [];

  // legg inn tomme celler før 1.
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ label: "" });
  }

  // legg inn alle dager i måneden
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const iso = dateObj.toISOString().split("T")[0];
    cells.push({
      label: String(day),
      iso,
      booked: bookedDates.includes(iso),
    });
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      {/* Bilde */}
      {venue.media?.[0]?.url && (
        <img
          src={venue.media[0].url}
          alt={venue.media[0].alt || venue.name}
          style={{
            width: "100%",
            height: "350px",
            objectFit: "cover",
            borderRadius: "12px",
            marginBottom: "1.5rem",
          }}
        />
      )}

      {/* Info */}
      <h1 style={{ marginBottom: "0.5rem" }}>{venue.name}</h1>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        {venue.location?.city}, {venue.location?.country}
      </p>
      <p style={{ lineHeight: 1.6 }}>{venue.description}</p>

      {/* Pris og rating */}
      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>${venue.price}</strong> / night
        </p>
        <p style={{ margin: 0 }}>⭐ {venue.rating || "No rating yet"}</p>
        <p style={{ margin: 0 }}>
          Max guests: <strong>{venue.maxGuests ?? "N/A"}</strong>
        </p>
      </div>

      {/* Eier-info */}
      {venue.owner && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3>Hosted by {venue.owner.name}</h3>
          <p style={{ color: "#555" }}>{venue.owner.email}</p>
        </div>
      )}

      {/* Kalender */}
      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>Availability</h2>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#555",
            marginBottom: "1rem",
          }}
        >
          Booked dates are marked in red.
        </p>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "1rem",
            maxWidth: "380px",
            backgroundColor: "#fff",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontWeight: 600,
              marginBottom: "0.5rem",
            }}
          >
            {today.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              fontSize: "0.8rem",
              textAlign: "center",
              color: "#555",
              marginBottom: "0.5rem",
            }}
          >
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "0.4rem",
              fontSize: "0.9rem",
              textAlign: "center",
            }}
          >
            {cells.map((cell, idx) => (
              <div
                key={idx}
                style={{
                  padding: "0.6rem 0",
                  borderRadius: "6px",
                  backgroundColor: cell.booked ? "#fecaca" : "#f9fafb",
                  border: cell.booked
                    ? "1px solid #dc2626"
                    : "1px solid #e5e7eb",
                  color: cell.booked ? "#991b1b" : "#111827",
                  minHeight: "2.5rem",
                }}
              >
                {cell.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking form */}
      <section style={{ marginTop: "3rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Book this venue</h2>
        <BookingForm venueId={venue.id} maxGuests={venue.maxGuests} />
      </section>
    </main>
  );
}

/* ---------------------------------
   BookingForm (local component)
--------------------------------- */

function BookingForm({
  venueId,
  maxGuests,
}: {
  venueId: string;
  maxGuests: number;
}) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 👇 Sjekk om bruker er logget inn
  const token = getToken();
  const isLoggedIn = !!token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isLoggedIn) {
      setMessage("⚠️ You must be logged in to make a booking.");
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
      setDateFrom("");
      setDateTo("");
      setGuests(1);
    } catch (err) {
      setMessage((err as Error).message || "Booking failed.");
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Hvis ikke innlogget: vis tydelig melding og disable alt
  if (!isLoggedIn) {
    return (
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          background: "#f9fafb",
          padding: "1.5rem",
          maxWidth: "400px",
        }}
      >
        <p
          style={{
            color: "#b91c1c",
            fontWeight: 500,
            marginBottom: "1rem",
            fontSize: "1rem",
          }}
        >
          ⚠️ Please log in to book this venue.
        </p>
        <p style={{ fontSize: "0.9rem", color: "#555" }}>
          Once you’re logged in, you’ll be able to select dates and confirm your
          stay.
        </p>
      </div>
    );
  }

  // 🔹 Hvis innlogget: vis det faktiske skjemaet
  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: "0.8rem",
        maxWidth: "400px",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
        backgroundColor: "#fff",
      }}
    >
      {message && (
        <p
          style={{
            color: message.startsWith("✅") ? "green" : "red",
            fontSize: "0.9rem",
          }}
        >
          {message}
        </p>
      )}

      <label style={{ display: "grid", gap: "0.3rem" }}>
        From:
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          required
          style={{
            padding: "0.5rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </label>

      <label style={{ display: "grid", gap: "0.3rem" }}>
        To:
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          required
          style={{
            padding: "0.5rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </label>

      <label style={{ display: "grid", gap: "0.3rem" }}>
        Guests (max {maxGuests}):
        <input
          type="number"
          min={1}
          max={maxGuests}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          required
          style={{
            padding: "0.5rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        style={{
          background: "#111827",
          color: "#fff",
          border: "none",
          padding: "0.6rem",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {loading ? "Booking..." : "Book now"}
      </button>
    </form>
  );
}
