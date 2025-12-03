import { useState } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import styles from "../styles/BookingSearchBar.module.css";

type BookingSearchBarProps = {
  onSearch: (values: {
    destination: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => void;
  className?: string;
};

export default function BookingSearchBar({
  onSearch,
  className = "",
}: BookingSearchBarProps) {
  const [destination, setDestination] = useState("");
  const [guests, setGuests] = useState(2);
  const [showCalendar, setShowCalendar] = useState(false);

  // Initialize with today and tomorrow as default date range
  const getDefaultDateRange = () => {
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

  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  function formatDate(date: Date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function handleSearch() {
    const checkIn = dateRange[0].startDate.toISOString().split("T")[0];
    const checkOut = dateRange[0].endDate.toISOString().split("T")[0];

    onSearch({
      destination,
      checkIn,
      checkOut,
      guests,
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
    setShowCalendar(false);
  }

  const displayCheckIn = formatDate(dateRange[0].startDate);
  const displayCheckOut = formatDate(dateRange[0].endDate);

  // Get today's date at midnight for minDate
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.searchBar}>
        {/* Destination */}
        <div className={styles.field}>
          <span className={styles.icon}>🔍</span>
          <div className={styles.fieldContent}>
            <label htmlFor="destination" className={styles.fieldLabel}>
              Destination
            </label>
            <input
              id="destination"
              type="text"
              className={styles.fieldInput}
              placeholder="Where do you want to go"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.divider} />

        {/* Check-in / Check-out */}
        <div className={styles.field}>
          <span className={styles.icon}>📅</span>
          <div className={styles.fieldContent}>
            <label className={styles.fieldLabel}>Check-in / Check-out</label>
            <button
              type="button"
              className={styles.dateButton}
              onClick={() => setShowCalendar(!showCalendar)}
            >
              {displayCheckIn} / {displayCheckOut}
            </button>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Guests */}
        <div className={styles.field}>
          <span className={styles.icon}>👥</span>
          <div className={styles.fieldContent}>
            <label htmlFor="guests" className={styles.fieldLabel}>
              Guests
            </label>
            <input
              id="guests"
              type="number"
              className={styles.fieldInput}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              min="1"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          type="button"
          className={styles.submitButton}
          onClick={handleSearch}
        >
          Search
        </button>
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <>
          <div
            className={styles.calendarBackdrop}
            onClick={() => setShowCalendar(false)}
          />
          <div className={styles.calendarPopup}>
            <button
              className={styles.closeButton}
              onClick={() => setShowCalendar(false)}
              aria-label="Close calendar"
            >
              ×
            </button>
            <DateRange
              editableDateInputs={true}
              onChange={(item: any) => setDateRange([item.selection])}
              moveRangeOnFirstSelection={false}
              ranges={dateRange}
              months={2}
              direction="horizontal"
              minDate={today}
              disabledDay={(date: Date) => date < today}
            />
            <div className={styles.calendarActions}>
              <button className={styles.resetButton} onClick={handleReset}>
                Reset Dates
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
