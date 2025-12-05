import { Link } from "react-router-dom";
import type { Booking } from "../api/bookings";
import styles from "../routes/Profile/profile.module.css";

type Props = {
  booking: Booking;
  onCancel?: (id: string) => void;
};

export default function BookingCard({ booking, onCancel }: Props) {
  const v = booking.venue;

  // If the venue is missing (e.g. deleted), just skip rendering this card
  if (!v) return null;

  // Parse dates from API (ISO strings)
  const start = new Date(booking.dateFrom);
  const end = new Date(booking.dateTo);

  // Format dates
  const startLabel = start.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const endLabel = end.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Calculate number of nights
  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = (endUtc - startUtc) / (1000 * 60 * 60 * 24) + 1;
  const nights = diffDays > 0 ? diffDays : 0;
  const hasValidRange = nights > 0 && Number.isFinite(nights);
  const pricePerNight = (v as any).price;
  const hasPrice = typeof pricePerNight === "number";
  const totalPrice = hasValidRange && hasPrice ? pricePerNight * nights : null;

  return (
    <li className={styles.bookingItem}>
      <Link
        to={`/venues/${v.id}`}
        className={styles.bookingCardLink}
        aria-label={`View ${v.name}`}
      >
        {v.media?.[0]?.url && (
          <img
            src={v.media[0].url}
            alt={v.media[0].alt || v.name}
            className={styles.bookingThumb}
          />
        )}

        <div className={styles.bookingContent}>
          <h4 className={styles.bookingVenueName}>{v.name}</h4>

          {/* Stay dates + number of nights */}
          <p className={styles.bookingDates}>
            <span className={styles.bookingDatesLabel}>Stay</span>
            <span className={styles.bookingDatesRange}>
              {startLabel} – {endLabel}
            </span>
            {hasValidRange && (
              <span className={styles.bookingNights}>
                · {nights} night{nights > 1 ? "s" : ""}
              </span>
            )}
          </p>

          {/* Guests */}
          <p className={styles.bookingGuests}>Guests: {booking.guests}</p>

          {/* Total price */}
          {totalPrice !== null && (
            <p className={styles.bookingPriceRow}>
              <span className={styles.bookingPriceLabel}>Total</span>
              <span className={styles.bookingPriceValue}>NOK {totalPrice}</span>
            </p>
          )}
        </div>
      </Link>

      {onCancel && (
        <button
          onClick={() => onCancel(booking.id)}
          className={styles.cancelBtn}
        >
          Cancel
        </button>
      )}
    </li>
  );
}
