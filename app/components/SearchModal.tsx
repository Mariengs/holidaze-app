import { useState, useEffect } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import styles from "../styles/SearchModal.module.css";

export interface BookingSearchValues {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (values: BookingSearchValues) => void;
}

type DateRangeItem = {
  startDate: Date;
  endDate: Date;
  key: string;
};

type DateSelection = {
  selection: DateRangeItem;
};

export default function SearchModal({
  isOpen,
  onClose,
  onSearch,
}: SearchModalProps) {
  const [destination, setDestination] = useState("");
  const [guests, setGuests] = useState(2);
  const [guestsInput, setGuestsInput] = useState("2");

  // Initialize with today and tomorrow as default date range
  const getDefaultDateRange = (): DateRangeItem[] => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      {
        startDate: today,
        endDate: tomorrow,
        key: "selection",
      },
    ];
  };

  const [dateRange, setDateRange] = useState<DateRangeItem[]>(
    getDefaultDateRange()
  );

  const [datesSelected, setDatesSelected] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  function toInputDate(date: Date | undefined): string {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  }

  function formatDateLabel(date: Date | undefined): string {
    if (!date) return "";
    if (!hasHydrated) {
      return date.toISOString().split("T")[0];
    }

    return date.toLocaleDateString("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function handleReset() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setDateRange([
      {
        startDate: today,
        endDate: tomorrow,
        key: "selection",
      },
    ]);
    setDatesSelected(false);
  }

  function handleDateChange(item: DateSelection) {
    setDateRange([item.selection]);
    setDatesSelected(true);
  }

  function handleGuestsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setGuestsInput(value);

    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      setGuests(numValue);
    }
  }

  function handleGuestsBlur() {
    const numValue = parseInt(guestsInput);
    if (isNaN(numValue) || numValue < 1) {
      setGuests(1);
      setGuestsInput("1");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const selection = dateRange[0];

    const values: BookingSearchValues = {
      destination: destination.trim(),
      checkIn: toInputDate(selection.startDate),
      checkOut: toInputDate(selection.endDate),
      guests,
    };

    onSearch(values);
    onClose();
  }

  if (!isOpen) return null;

  const selection = dateRange[0];
  const dateLabel = datesSelected
    ? `${formatDateLabel(selection.startDate)} – ${formatDateLabel(selection.endDate)}`
    : "Select dates";

  // Get today's date at midnight for minDate
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Search for stays</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalContent}>
          {/* Destination */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <span className={styles.labelText}>Destination</span>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where do you want to go?"
                className={styles.input}
              />
            </label>
          </div>

          {/* Dates */}
          <div className={styles.inputGroup}>
            <span className={styles.labelText}>Check-in / Check-out</span>
            <div className={styles.dateDisplay}>{dateLabel}</div>
            <DateRange
              ranges={dateRange}
              onChange={handleDateChange}
              moveRangeOnFirstSelection={false}
              months={1}
              direction="vertical"
              rangeColors={["#2563eb"]}
              minDate={today}
              disabledDay={(date: Date) => date < today}
            />
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleReset}
            >
              Clear dates
            </button>
          </div>

          {/* Guests */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <span className={styles.labelText}>Number of guests</span>
              <input
                type="number"
                min={1}
                value={guestsInput}
                onChange={handleGuestsChange}
                onBlur={handleGuestsBlur}
                className={styles.input}
              />
            </label>
          </div>

          {/* Submit */}
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>
      </div>
    </>
  );
}
