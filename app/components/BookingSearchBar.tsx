import { useState, useEffect, useRef } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import styles from "./BookingSearchBar.module.css";

export interface BookingSearchValues {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface BookingSearchBarProps {
  onSearch?: (values: BookingSearchValues) => void;
  className?: string;
}

type DateRangeItem = {
  startDate: Date;
  endDate: Date;
  key: string;
};

type DateSelection = {
  selection: DateRangeItem;
};

export default function BookingSearchBar({
  onSearch,
  className,
}: BookingSearchBarProps) {
  const [destination, setDestination] = useState("");
  const [guests, setGuests] = useState(2);
  const [guestsInput, setGuestsInput] = useState("2");

  const [dateRange, setDateRange] = useState<DateRangeItem[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const [datesSelected, setDatesSelected] = useState(false); // Track if dates have been selected

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  const calendarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleResize() {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 640);
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isCalendarOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isCalendarOpen]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

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
    setDateRange([
      {
        startDate: today,
        endDate: today,
        key: "selection",
      },
    ]);
    setDatesSelected(false); // Reset the flag
  }

  function handleDateChange(item: DateSelection) {
    setDateRange([item.selection]);
    setDatesSelected(true); // Mark that dates have been selected
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

    onSearch?.(values);
  }

  const selection = dateRange[0];
  const dateLabel = datesSelected
    ? `${formatDateLabel(selection.startDate)} – ${formatDateLabel(selection.endDate)}`
    : "-- / -- / ---- – -- / -- / ----";

  return (
    <section className={`${styles.wrapper} ${className || ""}`}>
      <form onSubmit={handleSubmit} className={styles.searchBar}>
        {/* Destination */}
        <div className={styles.field}>
          <span className={styles.icon} aria-hidden="true">
            🔍
          </span>
          <div className={styles.fieldContent}>
            <span className={styles.fieldLabel}>Destination</span>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Where do you want to go?"
              className={styles.fieldInput}
              aria-label="Destination"
            />
          </div>
        </div>

        <div className={styles.divider} />

        {/* Dates with popup calendar */}
        <div className={styles.field}>
          <span className={styles.icon} aria-hidden="true">
            📅
          </span>
          <div className={styles.fieldContent}>
            <span className={styles.fieldLabel}>Check-in / Check-out</span>

            <button
              type="button"
              className={styles.dateButton}
              onClick={() => setIsCalendarOpen((prev) => !prev)}
            >
              {dateLabel}
            </button>

            {isCalendarOpen && (
              <div className={styles.calendarPopup} ref={calendarRef}>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={() => setIsCalendarOpen(false)}
                  aria-label="Close calendar"
                >
                  ✕
                </button>

                <DateRange
                  ranges={dateRange}
                  onChange={handleDateChange}
                  moveRangeOnFirstSelection={false}
                  months={isMobile ? 1 : 2}
                  direction={isMobile ? "vertical" : "horizontal"}
                  rangeColors={["#2563eb"]}
                />

                <div className={styles.calendarActions}>
                  <button
                    type="button"
                    className={styles.resetButton}
                    onClick={handleReset}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.divider} />

        {/* Guests */}
        <div className={styles.field}>
          <span className={styles.icon} aria-hidden="true">
            👥
          </span>
          <div className={styles.fieldContent}>
            <span className={styles.fieldLabel}>Guests</span>
            <input
              type="number"
              min={1}
              value={guestsInput}
              onChange={handleGuestsChange}
              onBlur={handleGuestsBlur}
              className={styles.fieldInput}
              aria-label="Number of guests"
            />
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className={styles.submitButton}>
          Search
        </button>
      </form>

      {/* Backdrop ETTER form - så kalenderen kommer over */}
      {isCalendarOpen && (
        <div
          className={styles.calendarBackdrop}
          onClick={() => setIsCalendarOpen(false)}
        />
      )}
    </section>
  );
}
