import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import BookingCard from "../../app/components/BookingCard";
import type { Booking } from "../../app/api/bookings";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// Base booking-mock – castes via unknown for type-safety
const baseBooking = {
  id: "booking-1",
  dateFrom: "2025-01-02T10:00:00.000Z",
  dateTo: "2025-01-05T15:30:00.000Z",
  guests: 3,
  venue: {
    id: "venue-1",
    name: "Nice Hotel",
    media: [
      {
        url: "https://example.com/hotel.jpg",
        alt: "Hotel front",
      },
    ],
  },
} as unknown as Booking;

describe("BookingCard", () => {
  afterEach(() => {
    cleanup();
  });

  const setup = (
    overrides: Partial<Booking> = {},
    props?: { onCancel?: (id: string) => void }
  ) => {
    const booking: Booking = { ...baseBooking, ...overrides };

    const onCancel = props?.onCancel;

    renderWithRouter(<BookingCard booking={booking} onCancel={onCancel} />);

    return { booking, onCancel };
  };

  it("renders venue name, dates and guest count when venue is present", () => {
    const { booking } = setup();

    // Venue-navn
    expect(
      screen.getByRole("heading", {
        name: booking.venue!.name,
      })
    ).toBeInTheDocument();

    // Dates should be without time (split på T)
    expect(screen.getByText("2025-01-02 → 2025-01-05")).toBeInTheDocument();

    // Guests-text
    expect(screen.getByText(/guests:\s*3/i)).toBeInTheDocument();
  });

  it("renders venue image when media is provided", () => {
    const { booking } = setup();

    const img = screen.getByRole("img", { name: /hotel front/i });

    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", booking.venue!.media?.[0]?.url);
    expect(img).toHaveAttribute(
      "alt",
      booking.venue!.media?.[0]?.alt || booking.venue!.name
    );
  });

  it("does not render image when venue has no media", () => {
    setup({
      venue: {
        ...(baseBooking as any).venue,
        media: [],
      } as any,
    });

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders link to venue details with correct href and aria-label", () => {
    const { booking } = setup();

    const link = screen.getByRole("link", {
      name: `View ${booking.venue!.name}`,
    });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", `/venues/${booking.venue!.id}`);
  });

  it("does not render venue link content when booking has no venue", () => {
    setup({ venue: undefined as any });

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders Cancel button only when onCancel is provided", () => {
    // Uten onCancel
    setup({}, { onCancel: undefined });

    expect(
      screen.queryByRole("button", { name: /cancel/i })
    ).not.toBeInTheDocument();

    cleanup();

    // Med onCancel
    const onCancel = vi.fn();
    setup({}, { onCancel });

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onCancel with booking id when Cancel button is clicked", () => {
    const onCancel = vi.fn();
    const { booking } = setup({}, { onCancel });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledWith(booking.id);
  });

  it("renders Cancel button even if venue is missing when onCancel is provided", () => {
    const onCancel = vi.fn();
    setup({ venue: undefined as any }, { onCancel });

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });
});
