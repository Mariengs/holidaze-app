import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import ConfirmDeleteVenueModal from "../../app/components/ConfirmDeleteVenueModal";
import { deleteVenue } from "../../app/api/venues";

vi.mock("../../app/api/venues", () => ({
  deleteVenue: vi.fn(),
}));

const showToastMock = vi.fn();

vi.mock("../../app/components/context/ToastContext", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

afterEach(() => {
  cleanup();
});

describe("ConfirmDeleteVenueModal", () => {
  const venueId = "venue-123";
  const venueName = "Test Venue";

  const setup = (
    props?: Partial<React.ComponentProps<typeof ConfirmDeleteVenueModal>>
  ) => {
    const onClose = vi.fn();
    const onDeleted = vi.fn();

    render(
      <ConfirmDeleteVenueModal
        isOpen={true}
        venueId={venueId}
        venueName={venueName}
        onClose={onClose}
        onDeleted={onDeleted}
        {...props}
      />
    );

    return {
      onClose,
      onDeleted,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <ConfirmDeleteVenueModal
        isOpen={false}
        venueId={venueId}
        venueName={venueName}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    expect(screen.queryByText(/delete venue\?/i)).not.toBeInTheDocument();
  });

  it("does not render when venueId is null", () => {
    render(
      <ConfirmDeleteVenueModal
        isOpen={true}
        venueId={null}
        venueName={venueName}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    expect(screen.queryByText(/delete venue\?/i)).not.toBeInTheDocument();
  });

  it("renders heading and venue name when open", () => {
    setup();

    expect(screen.getByText(/delete venue\?/i)).toBeInTheDocument();
    expect(screen.getByText(venueName)).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to delete/i)
    ).toBeInTheDocument();
  });

  it("uses default text when venueName is not provided", () => {
    setup({ venueName: undefined });

    expect(screen.getByText(/this venue/i)).toBeInTheDocument();
  });

  it("calls onClose when Cancel button is clicked and does not call deleteVenue", () => {
    const { onClose } = setup();

    const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
    const cancelButton = cancelButtons[0];

    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(deleteVenue).not.toHaveBeenCalled();
  });

  it("calls deleteVenue, onDeleted, showToast (success) and onClose on successful delete", async () => {
    (deleteVenue as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      {}
    );

    const { onClose, onDeleted } = setup();

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    const deleteButton = deleteButtons[0];

    fireEvent.click(deleteButton);

    //  mikrotick for async handleDelete
    await Promise.resolve();

    expect(deleteVenue).toHaveBeenCalledTimes(1);
    expect(deleteVenue).toHaveBeenCalledWith(venueId);
    expect(onDeleted).toHaveBeenCalledWith(venueId);

    expect(showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Venue deleted successfully!",
        type: "success",
        duration: 3000,
      })
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows error message and error toast when delete fails, and does not call onClose", async () => {
    const errorMessage = "Failed hard";

    (deleteVenue as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    const { onClose } = setup();

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    const deleteButton = deleteButtons[0];

    fireEvent.click(deleteButton);

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();

    expect(showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: errorMessage,
        type: "error",
        duration: 4000,
      })
    );

    expect(onClose).not.toHaveBeenCalled();
  });
});
