import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmCancelBookingModal from "../../app/components/ConfirmCancelBookingModal";
import * as bookingsApi from "../../app/api/bookings";
import * as ToastContext from "../../app/components/context/ToastContext";

// Mock the ToastContext
vi.mock("../../app/components/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

describe("ConfirmCancelBookingModal", () => {
  const mockOnClose = vi.fn();
  const mockOnCancelled = vi.fn();
  const mockShowToast = vi.fn();
  let deleteBookingSpy: ReturnType<typeof vi.spyOn>;

  const defaultProps = {
    isOpen: true,
    bookingId: "test-booking-123",
    venueName: "Test Venue",
    onClose: mockOnClose,
    onCancelled: mockOnCancelled,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    deleteBookingSpy = vi.spyOn(bookingsApi, "deleteBooking");
    vi.mocked(ToastContext.useToast).mockReturnValue({
      showToast: mockShowToast,
    });
  });

  afterEach(() => {
    deleteBookingSpy.mockRestore();
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(<ConfirmCancelBookingModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText("Cancel booking?")).not.toBeInTheDocument();
    });

    it("should not render when bookingId is null", () => {
      render(<ConfirmCancelBookingModal {...defaultProps} bookingId={null} />);
      expect(screen.queryByText("Cancel booking?")).not.toBeInTheDocument();
    });

    it("should render modal when isOpen is true and bookingId is provided", () => {
      render(<ConfirmCancelBookingModal {...defaultProps} />);
      expect(screen.getByText("Cancel booking?")).toBeInTheDocument();
      expect(screen.getByText("Keep booking")).toBeInTheDocument();
      expect(screen.getByText("Cancel booking")).toBeInTheDocument();
    });

    it("should display venue name when provided", () => {
      render(<ConfirmCancelBookingModal {...defaultProps} />);
      expect(screen.getByText("Test Venue")).toBeInTheDocument();
    });

    it("should not display venue name when not provided", () => {
      render(
        <ConfirmCancelBookingModal {...defaultProps} venueName={undefined} />
      );
      expect(screen.queryByText("Test Venue")).not.toBeInTheDocument();
    });
  });

  describe("User interactions", () => {
    it("should call onClose when Keep booking is clicked", () => {
      render(<ConfirmCancelBookingModal {...defaultProps} />);
      fireEvent.click(screen.getByText("Keep booking"));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnCancelled).not.toHaveBeenCalled();
      expect(deleteBookingSpy).not.toHaveBeenCalled();
    });

    it("should call deleteBooking when Cancel booking is clicked", async () => {
      deleteBookingSpy.mockResolvedValueOnce(undefined);
      render(<ConfirmCancelBookingModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancel booking"));

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(deleteBookingSpy).toHaveBeenCalledWith("test-booking-123");
    });

    it("should show loading text when cancelling", () => {
      deleteBookingSpy.mockImplementation(() => new Promise(() => {}));
      render(<ConfirmCancelBookingModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancel booking"));

      expect(screen.getByText("Cancelling...")).toBeInTheDocument();
    });

    it("should disable buttons during cancellation", () => {
      deleteBookingSpy.mockImplementation(() => new Promise(() => {}));
      render(<ConfirmCancelBookingModal {...defaultProps} />);

      const cancelButton = screen.getByText("Cancel booking");
      const keepButton = screen.getByText("Keep booking");

      fireEvent.click(cancelButton);

      expect(cancelButton).toBeDisabled();
      expect(keepButton).toBeDisabled();
    });
  });

  describe("Success flow", () => {
    it("should call onCancelled with bookingId on success", async () => {
      deleteBookingSpy.mockResolvedValueOnce(undefined);
      render(<ConfirmCancelBookingModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancel booking"));

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockOnCancelled).toHaveBeenCalledWith("test-booking-123");
    });

    it("should show success toast on success", async () => {
      deleteBookingSpy.mockResolvedValueOnce(undefined);
      render(<ConfirmCancelBookingModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancel booking"));

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockShowToast).toHaveBeenCalledWith({
        message: "Booking cancelled successfully!",
        type: "success",
        duration: 3000,
      });
    });

    it("should close modal on success", async () => {
      deleteBookingSpy.mockResolvedValueOnce(undefined);
      render(<ConfirmCancelBookingModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancel booking"));

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error handling", () => {
    it("should show error toast on failure", async () => {
      const errorMessage = "Failed to cancel booking";
      deleteBookingSpy.mockRejectedValueOnce(new Error(errorMessage));
      render(<ConfirmCancelBookingModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancel booking"));

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockShowToast).toHaveBeenCalledWith({
        message: errorMessage,
        type: "error",
        duration: 4000,
      });
    });

    it("should not call onCancelled on failure", async () => {
      deleteBookingSpy.mockRejectedValueOnce(new Error("Test error"));
      render(<ConfirmCancelBookingModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancel booking"));

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockOnCancelled).not.toHaveBeenCalled();
    });

    it("should not close modal on failure", async () => {
      deleteBookingSpy.mockRejectedValueOnce(new Error("Test error"));
      render(<ConfirmCancelBookingModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancel booking"));

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should handle generic error without message", async () => {
      deleteBookingSpy.mockRejectedValueOnce(new Error(""));
      render(<ConfirmCancelBookingModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancel booking"));

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockShowToast).toHaveBeenCalledWith({
        message: "Failed to cancel booking",
        type: "error",
        duration: 4000,
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle rapid clicks on cancel button", async () => {
      deleteBookingSpy.mockResolvedValue(undefined);
      render(<ConfirmCancelBookingModal {...defaultProps} />);

      const cancelButton = screen.getByText("Cancel booking");

      fireEvent.click(cancelButton);
      fireEvent.click(cancelButton);
      fireEvent.click(cancelButton);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(deleteBookingSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle empty venue name", () => {
      render(<ConfirmCancelBookingModal {...defaultProps} venueName="" />);
      expect(screen.queryByText(/for/)).not.toBeInTheDocument();
    });

    it("should handle very long venue names", () => {
      const longVenueName = "A".repeat(200);
      render(
        <ConfirmCancelBookingModal
          {...defaultProps}
          venueName={longVenueName}
        />
      );
      expect(screen.getByText(longVenueName)).toBeInTheDocument();
    });
  });
});
