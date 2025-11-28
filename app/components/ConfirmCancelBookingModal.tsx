import { useState } from "react";
import { deleteBooking } from "../api/bookings";
import { useToast } from "./context/ToastContext";
import styles from "../styles/ProfileModal.module.css";

interface ConfirmCancelBookingModalProps {
  isOpen: boolean;
  bookingId: string | null;
  venueName?: string;
  onClose: () => void;
  onCancelled: (bookingId: string) => void;
}

export default function ConfirmCancelBookingModal({
  isOpen,
  bookingId,
  venueName,
  onClose,
  onCancelled,
}: ConfirmCancelBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { showToast } = useToast();

  if (!isOpen || !bookingId) return null;

  async function handleCancel() {
    if (!bookingId) return;

    setErr(null);
    setLoading(true);
    try {
      await deleteBooking(bookingId);
      onCancelled(bookingId);

      // Show success toast
      showToast({
        message: "Booking cancelled successfully!",
        type: "success",
        duration: 3000,
      });

      onClose();
    } catch (e) {
      const errorMsg = (e as Error).message || "Failed to cancel booking";
      setErr(errorMsg);

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

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${styles.modalSmall}`}>
        <h2 className={styles.headingDanger}>Cancel booking?</h2>

        <p className={styles.text}>
          Are you sure you want to cancel your booking
          {venueName && (
            <>
              {" "}
              for <strong>{venueName}</strong>
            </>
          )}
          ? This cannot be undone.
        </p>

        {err && <p className={styles.error}>{err}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`${styles.btn} ${styles.btnOutline}`}
          >
            Keep booking
          </button>

          <button
            onClick={handleCancel}
            disabled={loading}
            className={`${styles.btn} ${styles.btnDanger}`}
          >
            {loading ? "Cancelling..." : "Cancel booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
