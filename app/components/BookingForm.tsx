import { useState } from "react";
import { createBooking } from "../api/venues";
import { getToken } from "../api/auth";
import { useToast } from "./context/ToastContext";
import styles from "../styles/BookingForm.module.css";

interface BookingFormProps {
  venueId: string;
  maxGuests: number;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onClearDates: () => void;
  onBookingSuccess: () => Promise<void>;
  totalPrice?: number;
  numberOfNights?: number;
}

export default function BookingForm({
  venueId,
  maxGuests,
  dateFrom,
  dateTo,
  totalPrice,
  numberOfNights,
  onDateFromChange,
  onDateToChange,
  onClearDates,
  onBookingSuccess,
}: BookingFormProps) {
  // Local state for guests and UI feedback
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const token = getToken();
  const isLoggedIn = !!token;

  // Handle booking submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Basic client-side validation
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

      // Show success toast
      showToast({
        message: "Booking successful!",
        type: "success",
        duration: 3000,
      });

      // Reset state and notify parent
      onClearDates();
      setGuests(1);
      await onBookingSuccess();
    } catch (err) {
      const errorMsg = (err as Error).message || "Booking failed.";
      setMessage(errorMsg);

      // Show error toast
      showToast({
        message: errorMsg,
        type: "error",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }

  // If user is not logged in, show info box instead of the form
  if (!isLoggedIn) {
    return (
      <div className={styles.lockedBox}>
        <p className={styles.lockedTitle}>Please log in to book this venue.</p>
        <p className={styles.lockedText}>
          Once you're logged in, you'll be able to select dates and confirm your
          stay.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Error message (for validation / API errors) */}
      {message && !message.startsWith("✅") && (
        <p className={styles.msgError}>{message}</p>
      )}

      {/* Read-only date summary based on the calendar selection */}
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

      {/* Guests input */}
      <label className={styles.field}>
        <span className={styles.label}>Guests (max {maxGuests})</span>
        <input
          type="number"
          min={1}
          max={maxGuests}
          value={guests === 0 ? "" : guests}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") {
              // Allow empty string while typing, fix on blur
              setGuests(0);
            } else {
              const num = Number(val);
              if (num >= 1 && num <= maxGuests) {
                setGuests(num);
              }
            }
          }}
          onBlur={(e) => {
            // Ensure guests never stays below 1
            if (e.target.value === "" || Number(e.target.value) < 1) {
              setGuests(1);
            }
          }}
          required
          className={styles.input}
        />
      </label>

      {/* Inline total summary above the button.
          If no dates are selected, show a friendly placeholder instead of "0". */}
      <div className={styles.inlineTotal}>
        {numberOfNights && numberOfNights > 0 && totalPrice !== undefined ? (
          <>
            <span>Total:</span>
            <strong>NOK {totalPrice}</strong>
          </>
        ) : (
          <span className={styles.inlineTotalPlaceholder}>
            Select dates to see the total price
          </span>
        )}
      </div>

      {/* Submit button */}
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
