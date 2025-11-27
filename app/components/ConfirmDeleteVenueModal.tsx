import { useState } from "react";
import { deleteVenue } from "../api/venues";
import styles from "../styles/ProfileModal.module.css";

interface ConfirmDeleteVenueModalProps {
  isOpen: boolean;
  venueId: string | null;
  venueName?: string;
  onClose: () => void;
  onDeleted: (deletedVenueId: string) => void;
}

export default function ConfirmDeleteVenueModal({
  isOpen,
  venueId,
  venueName,
  onClose,
  onDeleted,
}: ConfirmDeleteVenueModalProps) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!isOpen || !venueId) return null;

  async function handleDelete() {
    if (!venueId) return;

    setErr(null);
    setLoading(true);
    try {
      await deleteVenue(venueId);
      onDeleted(venueId);
      onClose();
    } catch (e) {
      setErr((e as Error).message || "Failed to delete venue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${styles.modalSmall}`}>
        <h2 className={styles.headingDanger}>Delete venue?</h2>

        <p className={styles.text}>
          Are you sure you want to delete{" "}
          <strong>{venueName || "this venue"}</strong>? This cannot be undone.
        </p>

        {err && <p className={styles.error}>{err}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`${styles.btn} ${styles.btnOutline}`}
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className={`${styles.btn} ${styles.btnDanger}`}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
