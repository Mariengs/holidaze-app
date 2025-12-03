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
}

export default function BookingForm({
  venueId,
  maxGuests,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearDates,
  onBookingSuccess,
}: BookingFormProps) {
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

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

      // Show success toast
      showToast({
        message: "Booking successful!",
        type: "success",
        duration: 3000,
      });

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
      {message && !message.startsWith("✅") && (
        <p className={styles.msgError}>{message}</p>
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
          value={guests === 0 ? "" : guests}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") {
              setGuests(0);
            } else {
              const num = Number(val);
              if (num >= 1 && num <= maxGuests) {
                setGuests(num);
              }
            }
          }}
          onBlur={(e) => {
            // If field is empty on blur, set to 1
            if (e.target.value === "" || Number(e.target.value) < 1) {
              setGuests(1);
            }
          }}
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
