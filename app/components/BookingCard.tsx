import { Link } from "react-router-dom";
import type { Booking } from "../api/bookings";
import styles from "../routes/Profile/profile.module.css";
type Props = {
  booking: Booking;
  onCancel?: (id: string) => void;
};

export default function BookingCard({ booking, onCancel }: Props) {
  const v = booking.venue;
  return (
    <li className={styles.bookingItem}>
      {v && (
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
            <p className={styles.bookingDates}>
              {booking.dateFrom.split("T")[0]} → {booking.dateTo.split("T")[0]}
            </p>
            <p className={styles.bookingGuests}>Guests: {booking.guests}</p>
          </div>
        </Link>
      )}

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
