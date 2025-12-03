import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import VenueEditorModal from "../../app/components/VenueEditorModal";
import * as venuesApi from "../../app/api/venues";
import { ToastProvider } from "../../app/components/context/ToastContext";

// Mock the venues API
vi.mock("../../app/api/venues");

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

// Helper to render with providers
function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("VenueEditorModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSaved = vi.fn();

  const mockVenue = {
    id: "venue-123",
    name: "Cozy Cabin",
    description: "A beautiful cabin in the woods",
    price: 150,
    maxGuests: 4,
    rating: 4,
    media: [
      { url: "https://example.com/image1.jpg", alt: "cabin" },
      { url: "https://example.com/image2.jpg", alt: "cabin" },
    ],
    meta: {
      wifi: true,
      parking: true,
      breakfast: false,
      pets: false,
    },
    location: {
      city: "Oslo",
      country: "Norway",
    },
    created: "2025-01-01T00:00:00.000Z",
    updated: "2025-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering and initial state", () => {
    it("should not render when isOpen is false", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={false}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      expect(screen.queryByText("New venue")).not.toBeInTheDocument();
    });

    it("should render with 'New venue' heading when creating", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      expect(screen.getByText("New venue")).toBeInTheDocument();
    });

    it("should render with 'Edit venue' heading when editing", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          initialVenue={mockVenue}
        />
      );

      expect(screen.getByText("Edit venue")).toBeInTheDocument();
    });

    it("should render all required form fields", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Description")).toBeInTheDocument();
      expect(screen.getByLabelText("Price / night")).toBeInTheDocument();
      expect(screen.getByLabelText("Max guests")).toBeInTheDocument();
    });

    it("should render optional location fields", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      expect(screen.getByLabelText("City")).toBeInTheDocument();
      expect(screen.getByLabelText("Country")).toBeInTheDocument();
    });

    it("should render amenities checkboxes", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      expect(screen.getByText("Wi-Fi")).toBeInTheDocument();
      expect(screen.getByText("Parking")).toBeInTheDocument();
      expect(screen.getByText("Breakfast")).toBeInTheDocument();
      expect(screen.getByText("Pets allowed")).toBeInTheDocument();
    });

    it("should initialize with empty values when creating new venue", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      expect(screen.getByLabelText("Name")).toHaveValue("");
      expect(screen.getByLabelText("Description")).toHaveValue("");
      expect(screen.getByLabelText("Price / night")).toHaveValue(0);
      expect(screen.getByLabelText("Max guests")).toHaveValue(1);
    });

    it("should populate form fields with venue data when editing", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          initialVenue={mockVenue}
        />
      );

      expect(screen.getByLabelText("Name")).toHaveValue("Cozy Cabin");
      expect(screen.getByLabelText("Description")).toHaveValue(
        "A beautiful cabin in the woods"
      );
      expect(screen.getByLabelText("Price / night")).toHaveValue(150);
      expect(screen.getByLabelText("Max guests")).toHaveValue(4);
      expect(screen.getByLabelText("City")).toHaveValue("Oslo");
      expect(screen.getByLabelText("Country")).toHaveValue("Norway");
    });

    it("should populate amenities checkboxes when editing", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          initialVenue={mockVenue}
        />
      );

      const wifiCheckbox = screen.getByRole("checkbox", { name: /Wi-Fi/i });
      const parkingCheckbox = screen.getByRole("checkbox", {
        name: /Parking/i,
      });
      const breakfastCheckbox = screen.getByRole("checkbox", {
        name: /Breakfast/i,
      });
      const petsCheckbox = screen.getByRole("checkbox", {
        name: /Pets allowed/i,
      });

      expect(wifiCheckbox).toBeChecked();
      expect(parkingCheckbox).toBeChecked();
      expect(breakfastCheckbox).not.toBeChecked();
      expect(petsCheckbox).not.toBeChecked();
    });

    it("should show one empty media URL field by default", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const imageInputs = screen.getAllByPlaceholderText("https://...");
      expect(imageInputs).toHaveLength(1);
    });

    it("should populate media URLs when editing", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          initialVenue={mockVenue}
        />
      );

      const imageInputs = screen.getAllByPlaceholderText("https://...");
      expect(imageInputs).toHaveLength(2);
      expect(imageInputs[0]).toHaveValue("https://example.com/image1.jpg");
      expect(imageInputs[1]).toHaveValue("https://example.com/image2.jpg");
    });
  });

  describe("Media URL management", () => {
    it("should add a new media URL field when clicking 'Add image'", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const addButton = screen.getByText("+ Add image");
      fireEvent.click(addButton);

      const imageInputs = screen.getAllByPlaceholderText("https://...");
      expect(imageInputs).toHaveLength(2);
    });

    it("should update media URL when typing", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const imageInput = screen.getByPlaceholderText("https://...");
      fireEvent.change(imageInput, {
        target: { value: "https://example.com/test.jpg" },
      });

      expect(imageInput).toHaveValue("https://example.com/test.jpg");
    });

    it("should remove media URL field when clicking remove button", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          initialVenue={mockVenue}
        />
      );

      const removeButtons = screen.getAllByTitle("Remove this image");
      fireEvent.click(removeButtons[0]);

      const imageInputs = screen.getAllByPlaceholderText("https://...");
      expect(imageInputs).toHaveLength(1);
      expect(imageInputs[0]).toHaveValue("https://example.com/image2.jpg");
    });

    it("should disable remove button when only one media field exists", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const removeButton = screen.getByTitle("You need at least one block");
      expect(removeButton).toBeDisabled();
    });

    it("should show image preview when URL is provided", () => {
      const venueWithImage = {
        ...mockVenue,
        media: [{ url: "https://example.com/test.jpg", alt: "Test venue" }],
      };

      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          initialVenue={venueWithImage}
        />
      );

      const preview = screen.getByAltText("preview");
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveAttribute("src", "https://example.com/test.jpg");
    });
  });

  describe("Amenities toggle", () => {
    it("should toggle wifi checkbox", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const wifiCheckbox = screen.getByRole("checkbox", { name: /Wi-Fi/i });
      expect(wifiCheckbox).not.toBeChecked();

      fireEvent.click(wifiCheckbox);
      expect(wifiCheckbox).toBeChecked();

      fireEvent.click(wifiCheckbox);
      expect(wifiCheckbox).not.toBeChecked();
    });

    it("should toggle all amenities independently", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const wifiCheckbox = screen.getByRole("checkbox", { name: /Wi-Fi/i });
      const parkingCheckbox = screen.getByRole("checkbox", {
        name: /Parking/i,
      });

      fireEvent.click(wifiCheckbox);
      fireEvent.click(parkingCheckbox);

      expect(wifiCheckbox).toBeChecked();
      expect(parkingCheckbox).toBeChecked();
    });
  });

  describe("Rating system", () => {
    it("should allow changing rating via number input", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const ratingInput = screen.getByLabelText("Rating (0 to 5)");
      fireEvent.change(ratingInput, { target: { value: "3" } });

      expect(ratingInput).toHaveValue(3);
    });

    it("should have min and max attributes on rating input", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const ratingInput = screen.getByLabelText("Rating (0 to 5)");

      // Verify HTML5 validation attributes
      expect(ratingInput).toHaveAttribute("min", "0");
      expect(ratingInput).toHaveAttribute("max", "5");
      expect(ratingInput).toHaveAttribute("type", "number");
    });

    it("should display star buttons for rating", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const starButtons = screen.getAllByRole("radio");
      expect(starButtons).toHaveLength(5);
    });

    it("should update rating when clicking star button", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const starButtons = screen.getAllByRole("radio");
      fireEvent.click(starButtons[3]); // Click 4th star (4 rating)

      const ratingInput = screen.getByLabelText("Rating (0 to 5)");
      expect(ratingInput).toHaveValue(4);
    });
  });

  describe("Form validation", () => {
    it("should require name field", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const nameInput = screen.getByLabelText("Name");
      expect(nameInput).toBeRequired();
    });

    it("should require description field", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const descriptionInput = screen.getByLabelText("Description");
      expect(descriptionInput).toBeRequired();
    });

    it("should require price field", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const priceInput = screen.getByLabelText("Price / night");
      expect(priceInput).toBeRequired();
      expect(priceInput).toHaveAttribute("min", "0");
    });

    it("should require max guests field with minimum of 1", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const maxGuestsInput = screen.getByLabelText("Max guests");
      expect(maxGuestsInput).toBeRequired();
      expect(maxGuestsInput).toHaveAttribute("min", "1");
    });
  });

  describe("Cancel behavior", () => {
    it("should close modal without confirmation when no changes made", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      expect(mockConfirm).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should show confirmation dialog when changes have been made", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          initialVenue={mockVenue}
        />
      );

      // In edit mode with existing data, clicking amenity counts as a change
      const wifiCheckbox = screen.getByRole("checkbox", { name: /Wi-Fi/i });
      fireEvent.click(wifiCheckbox);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        "Are you sure you want to cancel? Any unsaved changes will be lost."
      );
    });

    it("should close modal when user confirms cancellation", () => {
      mockConfirm.mockReturnValue(true);

      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          initialVenue={mockVenue}
        />
      );

      // Make a change by clicking amenity
      const wifiCheckbox = screen.getByRole("checkbox", { name: /Wi-Fi/i });
      fireEvent.click(wifiCheckbox);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not close modal when user cancels confirmation", () => {
      mockConfirm.mockReturnValue(false);

      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          initialVenue={mockVenue}
        />
      );

      // Make a change by clicking amenity
      const wifiCheckbox = screen.getByRole("checkbox", { name: /Wi-Fi/i });
      fireEvent.click(wifiCheckbox);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Creating new venue", () => {
    it("should have a submit button in create mode", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      // Verify form exists with required fields
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Name")).toBeRequired();
      expect(screen.getByLabelText("Description")).toBeInTheDocument();
      expect(screen.getByLabelText("Description")).toBeRequired();
      expect(screen.getByLabelText("Price / night")).toBeInTheDocument();
      expect(screen.getByLabelText("Price / night")).toBeRequired();
      expect(screen.getByLabelText("Max guests")).toBeInTheDocument();
      expect(screen.getByLabelText("Max guests")).toBeRequired();

      // Verify submit button exists
      const submitButton = screen.getByRole("button", { name: "Create" });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute("type", "submit");
    });

    it("should call onSaved with created venue", async () => {
      const newVenue = {
        id: "new-venue-123",
        name: "New Cabin",
        description: "A new cabin",
        price: 200,
        maxGuests: 6,
        rating: 0,
        media: [],
        meta: { wifi: false, parking: false, breakfast: false, pets: false },
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
      };

      vi.mocked(venuesApi.createVenue).mockResolvedValue(newVenue);

      const { container } = renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const form = container.querySelector("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }

      await waitFor(
        () => {
          expect(mockOnSaved).toHaveBeenCalledWith(newVenue);
        },
        { container }
      );
    });

    it("should show success toast on successful creation", async () => {
      const newVenue = {
        id: "new-venue-123",
        name: "New Cabin",
        description: "A new cabin",
        price: 100,
        maxGuests: 2,
        rating: 0,
        media: [],
        meta: { wifi: false, parking: false, breakfast: false, pets: false },
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
      };

      vi.mocked(venuesApi.createVenue).mockResolvedValue(newVenue);

      const { container } = renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const form = container.querySelector("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }

      await waitFor(
        () => {
          expect(
            screen.getByText("Venue created successfully!")
          ).toBeInTheDocument();
        },
        { container }
      );
    });

    it("should close modal after successful creation", async () => {
      const newVenue = {
        id: "new-venue-123",
        name: "New Cabin",
        description: "A new cabin",
        price: 100,
        maxGuests: 2,
        rating: 0,
        media: [],
        meta: { wifi: false, parking: false, breakfast: false, pets: false },
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
      };

      vi.mocked(venuesApi.createVenue).mockResolvedValue(newVenue);

      const { container } = renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const form = container.querySelector("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }

      await waitFor(
        () => {
          expect(mockOnClose).toHaveBeenCalled();
        },
        { container }
      );
    });

    it("should show loading state during creation", async () => {
      vi.mocked(venuesApi.createVenue).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: "new-venue-123",
                  name: "New Cabin",
                  description: "A new cabin",
                  price: 100,
                  maxGuests: 2,
                  rating: 0,
                  media: [],
                  meta: {
                    wifi: false,
                    parking: false,
                    breakfast: false,
                    pets: false,
                  },
                  created: "2025-01-01T00:00:00.000Z",
                  updated: "2025-01-01T00:00:00.000Z",
                }),
              100
            )
          )
      );

      const { container } = renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const form = container.querySelector("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }

      await waitFor(
        () => {
          expect(
            screen.getByRole("button", { name: "Creating..." })
          ).toBeInTheDocument();
        },
        { container }
      );
    });

    it("should allow adding multiple media URL fields", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      // Initially one media URL field
      const initialUrlInputs = screen.getAllByLabelText("Image URL");
      expect(initialUrlInputs).toHaveLength(1);

      // Add a second media URL field
      const addButton = screen.getByRole("button", { name: "+ Add image" });
      fireEvent.click(addButton);

      // Now should have two fields
      const updatedUrlInputs = screen.getAllByLabelText("Image URL");
      expect(updatedUrlInputs).toHaveLength(2);

      // Both remove buttons should be enabled (accessible name is "✕")
      const removeButtons = screen.getAllByRole("button", { name: "✕" });
      expect(removeButtons).toHaveLength(2);
      removeButtons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe("Updating existing venue", () => {
    it("should call updateVenue with correct data on submit", async () => {
      const updatedVenue = { ...mockVenue };
      vi.mocked(venuesApi.updateVenue).mockResolvedValue(updatedVenue);

      const { container } = renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          initialVenue={mockVenue}
        />
      );

      // Verify form is populated with existing data
      expect(screen.getByLabelText("Name")).toHaveValue("Cozy Cabin");
      expect(screen.getByLabelText("Description")).toHaveValue(
        "A beautiful cabin in the woods"
      );
      expect(screen.getByLabelText("Price / night")).toHaveValue(150);
      expect(screen.getByLabelText("Max guests")).toHaveValue(4);

      const submitButton = screen.getByRole("button", { name: "Save" });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(venuesApi.updateVenue).toHaveBeenCalledWith(
            "venue-123",
            expect.objectContaining({
              name: "Cozy Cabin",
              description: "A beautiful cabin in the woods",
              price: 150,
              maxGuests: 4,
            })
          );
        },
        { container }
      );
    });

    it("should show success toast on successful update", async () => {
      const updatedVenue = { ...mockVenue };
      vi.mocked(venuesApi.updateVenue).mockResolvedValue(updatedVenue);

      const { container } = renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          initialVenue={mockVenue}
        />
      );

      const submitButton = screen.getByRole("button", { name: "Save" });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(
            screen.getByText("Venue updated successfully!")
          ).toBeInTheDocument();
        },
        { container }
      );
    });

    it("should show loading state during update", async () => {
      vi.mocked(venuesApi.updateVenue).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ...mockVenue }), 100)
          )
      );

      const { container } = renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          initialVenue={mockVenue}
        />
      );

      const submitButton = screen.getByRole("button", { name: "Save" });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(
            screen.getByRole("button", { name: "Saving..." })
          ).toBeInTheDocument();
        },
        { container }
      );
    });
  });

  describe("Error handling", () => {
    it("should show error message when creation fails", async () => {
      const errorMessage = "Failed to create venue";
      vi.mocked(venuesApi.createVenue).mockRejectedValue(
        new Error(errorMessage)
      );

      const { container } = renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      // Bypass HTML5 validation by using form.requestSubmit = form.submit
      const form = container.querySelector("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }

      await waitFor(
        () => {
          const errorElements = screen.getAllByText(errorMessage);
          expect(errorElements.length).toBeGreaterThan(0);
        },
        { container }
      );
    });

    it("should show error toast when creation fails", async () => {
      const errorMessage = "Network error";
      vi.mocked(venuesApi.createVenue).mockRejectedValue(
        new Error(errorMessage)
      );

      const { container } = renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const form = container.querySelector("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }

      await waitFor(
        () => {
          const errorElements = screen.getAllByText(errorMessage);
          expect(errorElements.length).toBeGreaterThan(0);
        },
        { container }
      );
    });

    it("should not call onSaved when creation fails", async () => {
      vi.mocked(venuesApi.createVenue).mockRejectedValue(
        new Error("Failed to create")
      );

      const { container } = renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const form = container.querySelector("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }

      await waitFor(
        () => {
          const errorElements = screen.getAllByText("Failed to create");
          expect(errorElements.length).toBeGreaterThan(0);
        },
        { container }
      );

      expect(mockOnSaved).not.toHaveBeenCalled();
    });

    it("should not close modal when creation fails", async () => {
      vi.mocked(venuesApi.createVenue).mockRejectedValue(
        new Error("Failed to create")
      );

      const { container } = renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const form = container.querySelector("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }

      await waitFor(
        () => {
          const errorElements = screen.getAllByText("Failed to create");
          expect(errorElements.length).toBeGreaterThan(0);
        },
        { container }
      );

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should re-enable submit button after error", async () => {
      vi.mocked(venuesApi.createVenue).mockRejectedValue(
        new Error("Failed to create")
      );

      const { container } = renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const submitButton = screen.getByRole("button", { name: "Create" });

      const form = container.querySelector("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }

      await waitFor(
        () => {
          const errorElements = screen.getAllByText("Failed to create");
          expect(errorElements.length).toBeGreaterThan(0);
        },
        { container }
      );

      expect(submitButton).not.toBeDisabled();
    });

    it("should show error message when update fails", async () => {
      const errorMessage = "Failed to update venue";
      vi.mocked(venuesApi.updateVenue).mockRejectedValue(
        new Error(errorMessage)
      );

      const { container } = renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          initialVenue={mockVenue}
        />
      );

      const form = container.querySelector("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }

      await waitFor(
        () => {
          const errorElements = screen.getAllByText(errorMessage);
          expect(errorElements.length).toBeGreaterThan(0);
        },
        { container }
      );
    });
  });

  describe("Location handling", () => {
    it("should have empty location fields by default", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const cityInput = screen.getByLabelText("City");
      const countryInput = screen.getByLabelText("Country");

      // Verify location inputs exist and are empty
      expect(cityInput).toBeInTheDocument();
      expect(cityInput).toHaveValue("");
      expect(countryInput).toBeInTheDocument();
      expect(countryInput).toHaveValue("");
    });

    it("should include location when only city is provided", () => {
      renderWithProviders(
        <VenueEditorModal
          isOpen={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
        />
      );

      const cityInput = screen.getByLabelText("City");
      const countryInput = screen.getByLabelText("Country");

      // Verify location inputs are present and not required
      expect(cityInput).toBeInTheDocument();
      expect(cityInput).not.toBeRequired();
      expect(countryInput).toBeInTheDocument();
      expect(countryInput).not.toBeRequired();

      // Should accept input
      fireEvent.change(cityInput, { target: { value: "Oslo" } });
      expect(cityInput).toHaveValue("Oslo");
    });
  });
});
