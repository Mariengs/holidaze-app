import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import BookingForm from "../../app/components/BookingForm";
import * as authApi from "../../app/api/auth";
import * as venuesApi from "../../app/api/venues";
import { ToastProvider } from "../../app/components/context/ToastContext";

// Mock the API modules
vi.mock("../../app/api/auth");
vi.mock("../../app/api/venues");

// Helper to render with providers
function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("BookingForm", () => {
  const mockProps = {
    venueId: "test-venue-123",
    maxGuests: 4,
    dateFrom: "2025-01-15",
    dateTo: "2025-01-20",
    onDateFromChange: vi.fn(),
    onDateToChange: vi.fn(),
    onClearDates: vi.fn(),
    onBookingSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Not logged in state", () => {
    beforeEach(() => {
      vi.mocked(authApi.getToken).mockReturnValue(null);
    });

    it("should display locked message when user is not logged in", () => {
      renderWithProviders(<BookingForm {...mockProps} />);

      expect(
        screen.getByText("Please log in to book this venue.")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Once you're logged in, you'll be able to select dates/
        )
      ).toBeInTheDocument();
    });

    it("should not display the booking form when user is not logged in", () => {
      renderWithProviders(<BookingForm {...mockProps} />);

      expect(
        screen.queryByRole("button", { name: /book now/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Guests/i)).not.toBeInTheDocument();
    });
  });

  describe("Logged in state", () => {
    beforeEach(() => {
      vi.mocked(authApi.getToken).mockReturnValue("fake-token-123");
    });

    it("should display the booking form when user is logged in", () => {
      renderWithProviders(<BookingForm {...mockProps} />);

      expect(
        screen.getByRole("button", { name: /book now/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Guests \(max 4\)/i)).toBeInTheDocument();
    });

    it("should display formatted check-in and check-out dates", () => {
      renderWithProviders(<BookingForm {...mockProps} />);

      expect(screen.getByText("Check-in")).toBeInTheDocument();
      expect(screen.getByText("Check-out")).toBeInTheDocument();
    });

    it("should show placeholder text when dates are not selected", () => {
      const propsWithoutDates = { ...mockProps, dateFrom: "", dateTo: "" };
      renderWithProviders(<BookingForm {...propsWithoutDates} />);

      const placeholders = screen.getAllByText("Select from calendar");
      expect(placeholders).toHaveLength(2);
    });

    it("should initialize guests input with value of 1", () => {
      renderWithProviders(<BookingForm {...mockProps} />);

      const guestsInput = screen.getByLabelText(/Guests \(max 4\)/i);
      expect(guestsInput).toHaveValue(1);
    });

    it("should have submit button disabled when dates are missing", () => {
      const propsWithoutDates = { ...mockProps, dateFrom: "", dateTo: "" };
      renderWithProviders(<BookingForm {...propsWithoutDates} />);

      const submitButton = screen.getByRole("button", { name: /book now/i });
      expect(submitButton).toBeDisabled();
    });

    it("should have max attribute set correctly on guests input", () => {
      renderWithProviders(<BookingForm {...mockProps} />);

      const guestsInput = screen.getByLabelText(/Guests \(max 4\)/i);
      expect(guestsInput).toHaveAttribute("max", "4");
      expect(guestsInput).toHaveAttribute("min", "1");
    });
  });

  describe("Successful booking", () => {
    beforeEach(() => {
      vi.mocked(authApi.getToken).mockReturnValue("fake-token-123");
      vi.mocked(venuesApi.createBooking).mockResolvedValue({
        id: "booking-123",
        dateFrom: "2025-01-15",
        dateTo: "2025-01-20",
        guests: 2,
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
      });
    });

    it("should call createBooking with correct parameters on submit", async () => {
      const { container } = renderWithProviders(<BookingForm {...mockProps} />);

      const submitButton = screen.getByRole("button", { name: /book now/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(venuesApi.createBooking).toHaveBeenCalledWith({
            dateFrom: "2025-01-15",
            dateTo: "2025-01-20",
            guests: 1,
            venueId: "test-venue-123",
          });
        },
        { container }
      );
    });

    it("should show success toast on successful booking", async () => {
      const { container } = renderWithProviders(<BookingForm {...mockProps} />);

      const submitButton = screen.getByRole("button", { name: /book now/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText("Booking successful!")).toBeInTheDocument();
        },
        { container }
      );
    });

    it("should call onBookingSuccess callback after successful booking", async () => {
      const onBookingSuccess = vi.fn().mockResolvedValue(undefined);
      const { container } = renderWithProviders(
        <BookingForm {...mockProps} onBookingSuccess={onBookingSuccess} />
      );

      const submitButton = screen.getByRole("button", { name: /book now/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(onBookingSuccess).toHaveBeenCalled();
        },
        { container }
      );
    });

    it("should call onClearDates after successful booking", async () => {
      const onClearDates = vi.fn();
      const { container } = renderWithProviders(
        <BookingForm {...mockProps} onClearDates={onClearDates} />
      );

      const submitButton = screen.getByRole("button", { name: /book now/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(onClearDates).toHaveBeenCalled();
        },
        { container }
      );
    });

    it("should show loading state during submission", async () => {
      // Make the API call take time
      vi.mocked(venuesApi.createBooking).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: "booking-123",
                  dateFrom: "2025-01-15",
                  dateTo: "2025-01-20",
                  guests: 1,
                  created: "2025-01-01T00:00:00.000Z",
                  updated: "2025-01-01T00:00:00.000Z",
                }),
              100
            )
          )
      );

      const { container } = renderWithProviders(<BookingForm {...mockProps} />);

      const submitButton = screen.getByRole("button", { name: /book now/i });
      fireEvent.click(submitButton);

      // Should show loading text
      await waitFor(
        () => {
          expect(
            screen.getByRole("button", { name: /booking\.\.\./i })
          ).toBeInTheDocument();
        },
        { container }
      );

      // Wait for completion
      await waitFor(
        () => {
          expect(
            screen.getByRole("button", { name: /book now/i })
          ).toBeInTheDocument();
        },
        { container, timeout: 3000 }
      );
    });
  });

  describe("Failed booking", () => {
    beforeEach(() => {
      vi.mocked(authApi.getToken).mockReturnValue("fake-token-123");
    });

    it("should show error message when booking fails", async () => {
      const errorMessage = "Venue is already booked for these dates";
      vi.mocked(venuesApi.createBooking).mockRejectedValue(
        new Error(errorMessage)
      );

      const { container } = renderWithProviders(<BookingForm {...mockProps} />);

      const submitButton = screen.getByRole("button", { name: /book now/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          // Error appears in both form and toast, so use getAllByText
          const errorElements = screen.getAllByText(errorMessage);
          expect(errorElements.length).toBeGreaterThan(0);
        },
        { container }
      );
    });

    it("should show error toast when booking fails", async () => {
      const errorMessage = "Network error";
      vi.mocked(venuesApi.createBooking).mockRejectedValue(
        new Error(errorMessage)
      );

      const { container } = renderWithProviders(<BookingForm {...mockProps} />);

      const submitButton = screen.getByRole("button", { name: /book now/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          // Error toast should appear (may appear twice - in form and in toast)
          const errorElements = screen.getAllByText(errorMessage);
          expect(errorElements.length).toBeGreaterThan(0);
        },
        { container }
      );
    });

    it("should show generic error when error has no message", async () => {
      vi.mocked(venuesApi.createBooking).mockRejectedValue(new Error());

      const { container } = renderWithProviders(<BookingForm {...mockProps} />);

      const submitButton = screen.getByRole("button", { name: /book now/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          // Error appears in both form and toast
          const errorElements = screen.getAllByText("Booking failed.");
          expect(errorElements.length).toBeGreaterThan(0);
        },
        { container }
      );
    });

    it("should not call onBookingSuccess when booking fails", async () => {
      const onBookingSuccess = vi.fn();
      vi.mocked(venuesApi.createBooking).mockRejectedValue(
        new Error("Booking failed")
      );

      const { container } = renderWithProviders(
        <BookingForm {...mockProps} onBookingSuccess={onBookingSuccess} />
      );

      const submitButton = screen.getByRole("button", { name: /book now/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          // Error appears in both form and toast
          const errorElements = screen.getAllByText("Booking failed");
          expect(errorElements.length).toBeGreaterThan(0);
        },
        { container }
      );

      expect(onBookingSuccess).not.toHaveBeenCalled();
    });

    it("should re-enable submit button after error", async () => {
      vi.mocked(venuesApi.createBooking).mockRejectedValue(
        new Error("Booking failed")
      );

      const { container } = renderWithProviders(<BookingForm {...mockProps} />);

      const submitButton = screen.getByRole("button", { name: /book now/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          // Error appears in both form and toast
          const errorElements = screen.getAllByText("Booking failed");
          expect(errorElements.length).toBeGreaterThan(0);
        },
        { container }
      );

      // Button should be enabled again
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Edge cases", () => {
    beforeEach(() => {
      vi.mocked(authApi.getToken).mockReturnValue("fake-token-123");
    });

    it("should handle maxGuests of 1", () => {
      const propsWithMaxOne = { ...mockProps, maxGuests: 1 };
      renderWithProviders(<BookingForm {...propsWithMaxOne} />);

      const guestsInput = screen.getByLabelText(/Guests \(max 1\)/i);
      expect(guestsInput).toHaveAttribute("max", "1");
    });

    it("should handle large maxGuests value", () => {
      const propsWithLargeMax = { ...mockProps, maxGuests: 50 };
      renderWithProviders(<BookingForm {...propsWithLargeMax} />);

      const guestsInput = screen.getByLabelText(/Guests \(max 50\)/i);
      expect(guestsInput).toHaveAttribute("max", "50");
    });

    it("should handle dates in different formats", () => {
      const propsWithDifferentDates = {
        ...mockProps,
        dateFrom: "2025-12-25",
        dateTo: "2025-12-31",
      };
      renderWithProviders(<BookingForm {...propsWithDifferentDates} />);

      // Should render without errors
      expect(
        screen.getByRole("button", { name: /book now/i })
      ).toBeInTheDocument();
    });

    it("should require guests input", () => {
      renderWithProviders(<BookingForm {...mockProps} />);

      const guestsInput = screen.getByLabelText(/Guests \(max 4\)/i);
      expect(guestsInput).toBeRequired();
    });
  });
});
