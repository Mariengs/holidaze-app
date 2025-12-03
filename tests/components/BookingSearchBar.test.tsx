import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// Mock react-date-range så vi har full kontroll
vi.mock("react-date-range", () => ({
  DateRange: (props: any) => {
    const handleClick = () => {
      // Simuler at brukeren velger en bestemt periode
      props.onChange({
        selection: {
          startDate: new Date("2025-01-10"),
          endDate: new Date("2025-01-12"),
          key: "selection",
        },
      });
    };

    return (
      <button type="button" onClick={handleClick}>
        Mock Date Picker
      </button>
    );
  },
}));

import BookingSearchBar from "../../app/components/BookingSearchBar";

describe("BookingSearchBar", () => {
  const onSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderBar = (props = {}) =>
    render(<BookingSearchBar onSearch={onSearch} {...props} />);

  // ---------- Rendering ----------

  it("renders destination, dates, guests and search button", () => {
    renderBar();

    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/guests/i)).toBeInTheDocument();

    expect(screen.getByText(/check-in \/ check-out/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  // ---------- Inputs ----------

  it("updates destination when user types", () => {
    renderBar();

    const destinationInput = screen.getByLabelText(
      /destination/i
    ) as HTMLInputElement;

    fireEvent.change(destinationInput, { target: { value: "Oslo" } });

    expect(destinationInput.value).toBe("Oslo");
  });

  it("updates guests when user types a number", () => {
    renderBar();

    const guestsInput = screen.getByLabelText(/guests/i) as HTMLInputElement;

    fireEvent.change(guestsInput, { target: { value: "4" } });

    expect(guestsInput.value).toBe("4");
  });

  // ---------- Calendar toggle ----------

  it("shows calendar popup when date button is clicked", () => {
    renderBar();

    // Finn date-knappen (den som viser dd/mm/yyyy / dd/mm/yyyy)
    const dateButton = screen.getByRole("button", {
      name: /\d{2}\/\d{2}\/\d{4} \/ \d{2}\/\d{2}\/\d{4}/,
    });

    fireEvent.click(dateButton);

    expect(
      screen.getByRole("button", { name: /mock date picker/i })
    ).toBeInTheDocument();
  });

  it("hides calendar popup when close button is clicked", () => {
    renderBar();

    const dateButton = screen.getByRole("button", {
      name: /\d{2}\/\d{2}\/\d{4} \/ \d{2}\/\d{2}\/\d{4}/,
    });

    fireEvent.click(dateButton);

    const closeButton = screen.getByRole("button", {
      name: /close calendar/i,
    });

    fireEvent.click(closeButton);

    expect(
      screen.queryByRole("button", { name: /mock date picker/i })
    ).not.toBeInTheDocument();
  });

  // ---------- Date selection & reset ----------

  it("updates date display after selecting dates from DateRange", () => {
    renderBar();

    const dateButton = screen.getByRole("button", {
      name: /\d{2}\/\d{2}\/\d{4} \/ \d{2}\/\d{2}\/\d{4}/,
    });

    // Åpne kalender
    fireEvent.click(dateButton);

    // Klikk på mokket DateRange-knapp for å trigge onChange
    const mockPickerButton = screen.getByRole("button", {
      name: /mock date picker/i,
    });
    fireEvent.click(mockPickerButton);

    // Nå skal teksten være basert på 10.01.2025–12.01.2025
    expect(
      screen.getByRole("button", {
        name: /10\/01\/2025 \/ 12\/01\/2025/,
      })
    ).toBeInTheDocument();
  });

  it("resets dates when 'Reset Dates' is clicked", () => {
    renderBar();

    const dateButton = screen.getByRole("button", {
      name: /\d{2}\/\d{2}\/\d{4} \/ \d{2}\/\d{2}\/\d{4}/,
    });

    // Åpne kalender og velg mock-datoer
    fireEvent.click(dateButton);
    const mockPickerButton = screen.getByRole("button", {
      name: /mock date picker/i,
    });
    fireEvent.click(mockPickerButton);

    // Sjekk at vi faktisk har fått den nye dato-labelen
    expect(
      screen.getByRole("button", {
        name: /10\/01\/2025 \/ 12\/01\/2025/,
      })
    ).toBeInTheDocument();

    // Click Reset Dates
    const resetButton = screen.getByRole("button", {
      name: /reset dates/i,
    });
    fireEvent.click(resetButton);

    // After reset - not 10/01/2025–12/01/2025
    expect(
      screen.queryByRole("button", {
        name: /10\/01\/2025 \/ 12\/01\/2025/,
      })
    ).not.toBeInTheDocument();
  });

  // ---------- Search ----------

  it("calls onSearch with dates and guests", () => {
    renderBar();

    // Set destination
    const destinationInput = screen.getByLabelText(
      /destination/i
    ) as HTMLInputElement;
    fireEvent.change(destinationInput, { target: { value: "Bergen" } });

    // Sett guests
    const guestsInput = screen.getByLabelText(/guests/i) as HTMLInputElement;
    fireEvent.change(guestsInput, { target: { value: "3" } });

    // Åpne kalender og velg mock-datoer
    const dateButton = screen.getByRole("button", {
      name: /\d{2}\/\d{2}\/\d{4} \/ \d{2}\/\d{2}\/\d{4}/,
    });
    fireEvent.click(dateButton);

    const mockPickerButton = screen.getByRole("button", {
      name: /mock date picker/i,
    });
    fireEvent.click(mockPickerButton);

    // Click Search
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(onSearch).toHaveBeenCalledTimes(1);

    const values = onSearch.mock.calls[0][0];

    expect(typeof values.destination).toBe("string");
    expect(values.guests).toBeGreaterThanOrEqual(1);
    expect(values.checkIn).toBe("2025-01-10");
    expect(values.checkOut).toBe("2025-01-12");
  });

  it("uses default dates when user does not open calendar", () => {
    renderBar();

    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(onSearch).toHaveBeenCalledTimes(1);
    const values = onSearch.mock.calls[0][0];

    expect(values.checkIn).not.toBe("");
    expect(values.checkOut).not.toBe("");
  });
});
