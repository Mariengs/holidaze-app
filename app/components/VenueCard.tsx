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
              <p className={styles.venueBookingsTitle}>Upcoming bookings</p>
              <ul className={styles.venueBookingsList}>
                {venue.bookings.map((bk) => {
                  const start = new Date(bk.dateFrom);
                  const end = new Date(bk.dateTo);

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

                  const startUtc = Date.UTC(
                    start.getFullYear(),
                    start.getMonth(),
                    start.getDate()
                  );
                  const endUtc = Date.UTC(
                    end.getFullYear(),
                    end.getMonth(),
                    end.getDate()
                  );
                  const diffDays =
                    (endUtc - startUtc) / (1000 * 60 * 60 * 24) + 1;
                  const nights = diffDays > 0 ? diffDays : 0;
                  const hasValidRange = nights > 0 && Number.isFinite(nights);

                  const pricePerNight =
                    typeof venue.price === "number" ? venue.price : null;
                  const totalPrice =
                    hasValidRange && pricePerNight !== null
                      ? pricePerNight * nights
                      : null;

                  return (
                    <li key={bk.id} className={styles.venueBookingItem}>
                      {/* Dato + netter */}
                      <div className={styles.venueBookingDatesRow}>
                        <span className={styles.venueBookingDatesLabel}>
                          Stay
                        </span>
                        <span className={styles.venueBookingDatesRange}>
                          {startLabel} – {endLabel}
                        </span>
                        {hasValidRange && (
                          <span className={styles.venueBookingNights}>
                            · {nights} night{nights > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Guests + totalpris */}
                      <div className={styles.venueBookingMetaRow}>
                        <span className={styles.venueBookingGuests}>
                          {bk.guests} guests
                        </span>
                        {totalPrice !== null && (
                          <span className={styles.venueBookingPrice}>
                            NOK {totalPrice}
                          </span>
                        )}
                      </div>

                      {/* Kundedetaljer */}
                      <div className={styles.venueBookingCustomer}>
                        {bk.customer?.name} ({bk.customer?.email})
                      </div>
                    </li>
                  );
                })}
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
