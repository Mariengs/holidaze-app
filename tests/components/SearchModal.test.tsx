import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// Mock react-date-range
vi.mock("react-date-range", () => ({
  DateRange: (props: any) => {
    const handleClick = () => {
      props.onChange({
        selection: {
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-01-05"),
          key: "selection",
        },
      });
    };

    return (
      <button type="button" onClick={handleClick}>
        Open date picker
      </button>
    );
  },
}));

import SearchModal from "../../app/components/SearchModal";

describe("SearchModal", () => {
  const onClose = vi.fn();
  const onSearch = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose,
    onSearch,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderModal = (props = {}) =>
    render(<SearchModal {...defaultProps} {...props} />);

  //  Rendering

  it("does not render when isOpen is false", () => {
    renderModal({ isOpen: false });

    expect(screen.queryByText(/search for stays/i)).not.toBeInTheDocument();
  });

  it("renders when open with heading and basic fields", () => {
    renderModal();

    expect(
      screen.getByRole("heading", { name: /search for stays/i })
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(/where do you want to go\?/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/check-in \/ check-out/i)).toBeInTheDocument();

    expect(screen.getByText(/number of guests/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  // Closing

  it("calls onClose when close button is clicked", () => {
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    renderModal();

    // Backdrop
    const container = screen.getByText(/search for stays/i).closest("div");
    const root = container?.parentElement?.parentElement;
    const backdrop = root?.querySelector("div");

    expect(backdrop).toBeTruthy();

    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Destination

  it("updates destination field when user types", () => {
    renderModal();

    const destinationInput = screen.getByPlaceholderText(
      /where do you want to go\?/i
    ) as HTMLInputElement;

    fireEvent.change(destinationInput, { target: { value: "Oslo" } });

    expect(destinationInput.value).toBe("Oslo");
  });

  // Guests

  it("updates guests when user types a valid number", () => {
    renderModal();

    const guestsInput = screen.getByLabelText(
      /number of guests/i
    ) as HTMLInputElement;

    fireEvent.change(guestsInput, { target: { value: "5" } });
    fireEvent.blur(guestsInput);

    expect(guestsInput.value).toBe("5");
  });

  it("ensures guests are at least 1 when an invalid value is entered", async () => {
    renderModal();

    const guestsInput = screen.getByLabelText(
      /number of guests/i
    ) as HTMLInputElement;

    // set guests to 0 and blur
    fireEvent.change(guestsInput, { target: { value: "0" } });
    fireEvent.blur(guestsInput);

    // mikrotick state update
    await Promise.resolve();

    // Submit form
    const form = screen
      .getByRole("button", { name: /search/i })
      .closest("form")!;
    fireEvent.submit(form);

    expect(onSearch).toHaveBeenCalledTimes(1);
    const values = onSearch.mock.calls[0][0];

    // Guests should be 1
    expect(values.guests).toBeGreaterThanOrEqual(1);
  });

  // Dates

  it("shows 'Select dates' before any date is selected", () => {
    renderModal();

    expect(screen.getByText(/select dates/i)).toBeInTheDocument();
  });

  it("updates date label after selecting dates via DateRange", () => {
    renderModal();

    // mock DateRange rendrer trigger onChange
    const datePickerButton = screen.getByRole("button", {
      name: /open date picker/i,
    });
    fireEvent.click(datePickerButton);

    // Date
    expect(screen.queryByText(/select dates/i)).not.toBeInTheDocument();
  });

  it("resets dates and label when 'Clear dates' is clicked", () => {
    renderModal();

    // DatePicker
    const datePickerButton = screen.getByRole("button", {
      name: /open date picker/i,
    });
    fireEvent.click(datePickerButton);
    expect(screen.queryByText(/select dates/i)).not.toBeInTheDocument();

    // Click 'Clear dates'
    const clearButton = screen.getByRole("button", { name: /clear dates/i });
    fireEvent.click(clearButton);

    // Label back to 'Select dates'
    expect(screen.getByText(/select dates/i)).toBeInTheDocument();
  });

  // Submit / onSearch
  it("calls onSearch with selected dates and guests", () => {
    renderModal();

    // Destination
    const destinationInput = screen.getByPlaceholderText(
      /where do you want to go\?/i
    ) as HTMLInputElement;
    fireEvent.change(destinationInput, { target: { value: "  Bergen  " } });

    // Guests
    const guestsInput = screen.getByLabelText(
      /number of guests/i
    ) as HTMLInputElement;
    fireEvent.change(guestsInput, { target: { value: "4" } });
    fireEvent.blur(guestsInput);

    // Dates via mocked DateRange
    const datePickerButton = screen.getByRole("button", {
      name: /open date picker/i,
    });
    fireEvent.click(datePickerButton);

    // Submit
    fireEvent.submit(
      screen.getByRole("button", { name: /search/i }).closest("form")!
    );

    expect(onSearch).toHaveBeenCalledTimes(1);
    const values = onSearch.mock.calls[0][0];

    expect(values.guests).toBeGreaterThanOrEqual(1);
    expect(values.checkIn).not.toBe("");
    expect(values.checkOut).not.toBe("");
  });

  it("calls onClose after successful search submit", () => {
    renderModal();

    fireEvent.submit(
      screen.getByRole("button", { name: /search/i }).closest("form")!
    );

    expect(onClose).toHaveBeenCalled();
  });
});
