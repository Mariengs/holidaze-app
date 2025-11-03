import { Link } from "react-router-dom";
import type { Venue } from "../api/venues";
import styles from "../routes/Profile/profile.module.css";

type Props = {
  venue: Venue;
  onEdit?: (v: Venue) => void;
  onDelete?: (v: Venue) => void;
};

export default function VenueCard({ venue, onEdit, onDelete }: Props) {
  return (
    <li className={styles.venueItem}>
      <Link
        to={`/venues/${venue.id}`}
        className={styles.venueCardLink}
        aria-label={`Open ${venue.name}`}
      >
        {venue.media?.[0]?.url && (
          <img
            src={venue.media[0].url}
            alt={venue.media[0].alt || venue.name}
            className={styles.venueThumb}
          />
        )}

        <div className={styles.venueContent}>
          <h4 className={styles.venueInfoName}>{venue.name}</h4>

          {venue.location?.city && (
            <p className={styles.venueInfoLocation}>
              {venue.location.city}
              {venue.location.country ? `, ${venue.location.country}` : ""}
            </p>
          )}

          <p className={styles.venueInfoDesc}>
            {venue.description || "No description"}
          </p>

          <p className={styles.venueInfoMeta}>
            {venue.maxGuests} guests • {venue.price} NOK/night
          </p>

          {Array.isArray(venue.bookings) && venue.bookings.length > 0 && (
            <div className={styles.venueBookingsBox}>
              <p className={styles.venueBookingsTitle}>Upcoming bookings:</p>
              <ul className={styles.venueBookingsList}>
                {venue.bookings.map((bk) => (
                  <li key={bk.id} className={styles.venueBookingItem}>
                    <div className={styles.venueBookingDates}>
                      {bk.dateFrom.split("T")[0]} → {bk.dateTo.split("T")[0]}
                    </div>
                    <div className={styles.venueBookingInfo}>
                      {bk.guests} guests
                    </div>
                    <div className={styles.venueBookingInfo}>
                      {bk.customer?.name} ({bk.customer?.email})
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Link>

      <div className={styles.venueActions}>
        {onEdit && (
          <button className={styles.venueBtnEdit} onClick={() => onEdit(venue)}>
            Edit
          </button>
        )}
        {onDelete && (
          <button
            className={styles.venueBtnDelete}
            onClick={() => onDelete(venue)}
          >
            Delete
          </button>
        )}
      </div>
    </li>
  );
}
