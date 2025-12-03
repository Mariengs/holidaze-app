import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import VenueCard from "../../app/components/VenueCard";
import type { Venue } from "../../app/api/venues";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// Base mock-venue – castes som unknown først, så som Venue for å slippe TS-gnål
const baseVenue = {
  id: "venue-1",
  name: "Cozy Cabin",
  description: "A nice cozy cabin in the woods",
  media: [
    {
      url: "https://example.com/image.jpg",
      alt: "Cabin image",
    },
  ],
  location: {
    city: "Oslo",
    country: "Norway",
  },
  maxGuests: 4,
  price: 1200,
  rating: 4,
  meta: {
    wifi: true,
    parking: false,
    breakfast: false,
    pets: false,
  },
  owner: {
    name: "Owner",
    email: "owner@example.com",
  },
  bookings: [
    {
      id: "booking-1",
      dateFrom: "2025-01-01T12:00:00.000Z",
      dateTo: "2025-01-03T12:00:00.000Z",
      guests: 2,
      customer: {
        name: "John Doe",
        email: "john@example.com",
      },
    },
  ],
} as unknown as Venue;

describe("VenueCard", () => {
  afterEach(() => {
    cleanup();
  });

  const setup = (
    overrides: Partial<Venue> = {},
    props?: { onEdit?: (v: Venue) => void; onDelete?: (v: Venue) => void }
  ) => {
    const venue: Venue = { ...baseVenue, ...overrides };

    const onEdit = props?.onEdit;
    const onDelete = props?.onDelete;

    renderWithRouter(
      <VenueCard venue={venue} onEdit={onEdit} onDelete={onDelete} />
    );

    return { venue, onEdit, onDelete };
  };

  it("renders basic venue info", () => {
    const { venue } = setup();

    expect(
      screen.getByRole("heading", { name: venue.name })
    ).toBeInTheDocument();

    expect(screen.getByText("Oslo, Norway")).toBeInTheDocument();
    expect(screen.getByText(venue.description!)).toBeInTheDocument();
    expect(screen.getByText(/4 guests • 1200 NOK\/night/i)).toBeInTheDocument();
  });

  it("renders media image when media is provided", () => {
    const { venue } = setup();

    const img = screen.getByRole("img", { name: /cabin image/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", venue.media?.[0]?.url);
    expect(img).toHaveAttribute("alt", venue.media?.[0]?.alt || venue.name);
  });

  it("does not render image when media array is empty", () => {
    setup({ media: [] as any });

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("falls back to 'No description' when description is missing", () => {
    setup({ description: "" as any });

    expect(screen.getByText(/no description/i)).toBeInTheDocument();
  });

  it("renders link to venue details with correct href and aria-label", () => {
    const { venue } = setup();

    const link = screen.getByRole("link", { name: `Open ${venue.name}` });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", `/venues/${venue.id}`);
  });

  it("renders upcoming bookings when bookings are present", () => {
    setup();

    expect(screen.getByText(/upcoming bookings:/i)).toBeInTheDocument();

    expect(screen.getByText("2025-01-01 → 2025-01-03")).toBeInTheDocument();

    expect(screen.getByText(/2 guests/i)).toBeInTheDocument();
    expect(
      screen.getByText(/john doe \(john@example.com\)/i)
    ).toBeInTheDocument();
  });

  it("does not render bookings section when bookings is empty", () => {
    setup({ bookings: [] as any });

    expect(screen.queryByText(/upcoming bookings:/i)).not.toBeInTheDocument();
  });

  it("does not render bookings section when bookings is undefined", () => {
    setup({ bookings: undefined as any });

    expect(screen.queryByText(/upcoming bookings:/i)).not.toBeInTheDocument();
  });

  it("renders Edit and Delete buttons only when handlers are provided", () => {
    // Uten handlers
    setup({}, { onEdit: undefined, onDelete: undefined });

    expect(
      screen.queryByRole("button", { name: /edit/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /delete/i })
    ).not.toBeInTheDocument();

    cleanup();

    // Med handlers
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    setup({}, { onEdit, onDelete });

    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("calls onEdit with venue when Edit button is clicked", () => {
    const onEdit = vi.fn();
    const { venue } = setup({}, { onEdit });

    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(venue);
  });

  it("calls onDelete with venue when Delete button is clicked", () => {
    const onDelete = vi.fn();
    const { venue } = setup({}, { onDelete });

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(venue);
  });
});
