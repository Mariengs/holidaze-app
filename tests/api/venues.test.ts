import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAllVenues,
  getVenueById,
  createBooking,
  getUserVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  type Venue,
  type VenuePayload,
  type Meta,
} from "../../app/api/venues";
import * as auth from "../../app/api/auth";

// Mock fetch globally
global.fetch = vi.fn();

// Mock auth functions
vi.mock("../../app/api/auth", () => ({
  getToken: vi.fn(),
  getApiKey: vi.fn(),
}));

describe("Venues API", () => {
  const mockVenue: Venue = {
    id: "venue-123",
    name: "Beautiful Beach House",
    description: "A stunning beach house with ocean views",
    price: 150,
    rating: 4.5,
    maxGuests: 6,
    media: [
      { url: "https://example.com/beach.jpg", alt: "Beach house" },
      { url: "https://example.com/interior.jpg", alt: "Interior" },
    ],
    meta: {
      wifi: true,
      parking: true,
      breakfast: false,
      pets: true,
    },
    location: {
      address: "123 Beach Road",
      city: "Miami",
      zip: "33139",
      country: "USA",
      continent: "North America",
      lat: 25.7617,
      lng: -80.1918,
    },
    owner: {
      name: "johndoe",
      email: "john@example.com",
    },
    created: "2025-01-01T00:00:00.000Z",
    updated: "2025-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllVenues", () => {
    describe("when authenticated", () => {
      beforeEach(() => {
        vi.mocked(auth.getToken).mockReturnValue("test-token-123");
        vi.mocked(auth.getApiKey).mockReturnValue("test-api-key-456");
      });

      it("should fetch all venues with authentication", async () => {
        const mockVenues = [mockVenue];

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockVenues }),
        });

        const result = await getAllVenues();

        expect(result).toEqual(mockVenues);
        expect(global.fetch).toHaveBeenCalledWith(
          "https://v2.api.noroff.dev/holidaze/venues?limit=100&sort=created&sortOrder=desc&_owner=true&_bookings=true",
          {
            headers: {
              Authorization: "Bearer test-token-123",
              "X-Noroff-API-Key": "test-api-key-456",
              "Content-Type": "application/json",
            },
          }
        );
      });

      it("should search venues with query parameter when authenticated", async () => {
        const mockVenues = [mockVenue];

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockVenues }),
        });

        const result = await getAllVenues("beach house");

        expect(result).toEqual(mockVenues);
        expect(global.fetch).toHaveBeenCalledWith(
          "https://v2.api.noroff.dev/holidaze/venues/search?q=beach%20house&limit=100&sort=created&sortOrder=desc",
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: "Bearer test-token-123",
            }),
          })
        );
      });

      it("should return empty array when no venues found", async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        });

        const result = await getAllVenues();

        expect(result).toEqual([]);
      });

      it("should throw error when API fails with authenticated request", async () => {
        const mockError = {
          errors: [{ message: "Server error" }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          json: async () => mockError,
        });

        await expect(getAllVenues()).rejects.toThrow("Server error");
      });

      it("should ignore whitespace-only search query", async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        });

        await getAllVenues("   ");

        const fetchUrl = (global.fetch as any).mock.calls[0][0];
        expect(fetchUrl).toContain("venues?limit=100");
        expect(fetchUrl).not.toContain("search");
      });
    });

    describe("when not authenticated (public access)", () => {
      beforeEach(() => {
        vi.mocked(auth.getToken).mockReturnValue(null);
        vi.mocked(auth.getApiKey).mockReturnValue(null);
      });

      it("should fetch all venues without authentication", async () => {
        const mockVenues = [mockVenue];

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockVenues }),
        });

        const result = await getAllVenues();

        expect(result).toEqual(mockVenues);
        expect(global.fetch).toHaveBeenCalledWith(
          "https://v2.api.noroff.dev/holidaze/venues?limit=100&sort=created&sortOrder=desc&_owner=true&_bookings=true"
        );
        // Verify no auth headers
        expect((global.fetch as any).mock.calls[0][1]).toBeUndefined();
      });

      it("should search venues without authentication", async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [mockVenue] }),
        });

        await getAllVenues("beach");

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("search?q=beach")
        );
      });

      it("should throw error when public API fails", async () => {
        const mockError = {
          errors: [{ message: "Not found" }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          json: async () => mockError,
        });

        await expect(getAllVenues()).rejects.toThrow("Not found");
      });

      it("should handle malformed JSON response gracefully", async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => {
            throw new Error("Invalid JSON");
          },
        });

        const result = await getAllVenues();

        expect(result).toEqual([]);
      });
    });
  });

  describe("getVenueById", () => {
    describe("when authenticated", () => {
      beforeEach(() => {
        vi.mocked(auth.getToken).mockReturnValue("test-token-123");
        vi.mocked(auth.getApiKey).mockReturnValue("test-api-key-456");
      });

      it("should fetch venue by ID with authentication", async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockVenue }),
        });

        const result = await getVenueById("venue-123");

        expect(result).toEqual(mockVenue);
        expect(global.fetch).toHaveBeenCalledWith(
          "https://v2.api.noroff.dev/holidaze/venues/venue-123?_bookings=true&_owner=true",
          {
            headers: {
              Authorization: "Bearer test-token-123",
              "X-Noroff-API-Key": "test-api-key-456",
              "Content-Type": "application/json",
            },
          }
        );
      });

      it("should throw error when venue not found", async () => {
        const mockError = {
          errors: [{ message: "Venue not found" }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          json: async () => mockError,
        });

        await expect(getVenueById("nonexistent")).rejects.toThrow(
          "Venue not found"
        );
      });
    });

    describe("when not authenticated (public access)", () => {
      beforeEach(() => {
        vi.mocked(auth.getToken).mockReturnValue(null);
        vi.mocked(auth.getApiKey).mockReturnValue(null);
      });

      it("should fetch venue by ID without authentication", async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockVenue }),
        });

        const result = await getVenueById("venue-123");

        expect(result).toEqual(mockVenue);
        expect(global.fetch).toHaveBeenCalledWith(
          "https://v2.api.noroff.dev/holidaze/venues/venue-123?_bookings=true&_owner=true"
        );
        expect((global.fetch as any).mock.calls[0][1]).toBeUndefined();
      });

      it("should throw error when public fetch fails", async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        await expect(getVenueById("venue-123")).rejects.toThrow(
          "Failed to fetch venue"
        );
      });
    });
  });

  describe("createBooking", () => {
    beforeEach(() => {
      vi.mocked(auth.getToken).mockReturnValue("test-token-123");
      vi.mocked(auth.getApiKey).mockReturnValue("test-api-key-456");
    });

    it("should create a booking successfully", async () => {
      const mockBooking = {
        id: "booking-123",
        dateFrom: "2025-12-20",
        dateTo: "2025-12-25",
        guests: 2,
        venueId: "venue-123",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBooking }),
      });

      const result = await createBooking({
        dateFrom: "2025-12-20",
        dateTo: "2025-12-25",
        guests: 2,
        venueId: "venue-123",
      });

      expect(result).toEqual(mockBooking);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://v2.api.noroff.dev/holidaze/bookings",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer test-token-123",
            "X-Noroff-API-Key": "test-api-key-456",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateFrom: "2025-12-20",
            dateTo: "2025-12-25",
            guests: 2,
            venueId: "venue-123",
          }),
        }
      );
    });

    it("should throw error when not logged in", async () => {
      vi.mocked(auth.getToken).mockReturnValue(null);

      await expect(
        createBooking({
          dateFrom: "2025-12-20",
          dateTo: "2025-12-25",
          guests: 2,
          venueId: "venue-123",
        })
      ).rejects.toThrow("You must be logged in to perform this action.");
    });

    it("should throw error when API key is missing", async () => {
      vi.mocked(auth.getApiKey).mockReturnValue(null);

      await expect(
        createBooking({
          dateFrom: "2025-12-20",
          dateTo: "2025-12-25",
          guests: 2,
          venueId: "venue-123",
        })
      ).rejects.toThrow("Missing API key for this user.");
    });

    it("should throw error when booking fails", async () => {
      const mockError = {
        errors: [{ message: "Venue already booked" }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(
        createBooking({
          dateFrom: "2025-12-20",
          dateTo: "2025-12-25",
          guests: 2,
          venueId: "venue-123",
        })
      ).rejects.toThrow("Venue already booked");
    });
  });

  describe("getUserVenues", () => {
    beforeEach(() => {
      vi.mocked(auth.getToken).mockReturnValue("test-token-123");
      vi.mocked(auth.getApiKey).mockReturnValue("test-api-key-456");
    });

    it("should fetch user venues successfully", async () => {
      const mockVenues = [mockVenue];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockVenues }),
      });

      const result = await getUserVenues("johndoe");

      expect(result).toEqual(mockVenues);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://v2.api.noroff.dev/holidaze/profiles/johndoe/venues?_bookings=true",
        {
          headers: {
            Authorization: "Bearer test-token-123",
            "X-Noroff-API-Key": "test-api-key-456",
            "Content-Type": "application/json",
          },
        }
      );
    });

    it("should return empty array when user has no venues", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await getUserVenues("newuser");

      expect(result).toEqual([]);
    });

    it("should throw error when not logged in", async () => {
      vi.mocked(auth.getToken).mockReturnValue(null);

      await expect(getUserVenues("johndoe")).rejects.toThrow(
        "You must be logged in to view your venues."
      );
    });

    it("should throw error when API key is missing", async () => {
      vi.mocked(auth.getApiKey).mockReturnValue(null);

      await expect(getUserVenues("johndoe")).rejects.toThrow(
        "Missing API key for this user."
      );
    });

    it("should throw error when fetch fails", async () => {
      const mockError = {
        errors: [{ message: "User not found" }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(getUserVenues("nonexistent")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("createVenue", () => {
    beforeEach(() => {
      vi.mocked(auth.getToken).mockReturnValue("test-token-123");
      vi.mocked(auth.getApiKey).mockReturnValue("test-api-key-456");
    });

    const venuePayload: VenuePayload = {
      name: "New Beach House",
      description: "A beautiful new beach house",
      price: 200,
      maxGuests: 4,
      media: [{ url: "https://example.com/new.jpg", alt: "New house" }],
      rating: 5,
      meta: {
        wifi: true,
        parking: true,
        breakfast: true,
        pets: false,
      },
      location: {
        address: "456 Ocean Ave",
        city: "Miami",
        zip: "33140",
        country: "USA",
        continent: "North America",
        lat: 25.7617,
        lng: -80.1918,
      },
    };

    it("should create venue successfully", async () => {
      const mockCreatedVenue = { ...mockVenue, ...venuePayload };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCreatedVenue }),
      });

      const result = await createVenue(venuePayload);

      expect(result).toEqual(mockCreatedVenue);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://v2.api.noroff.dev/holidaze/venues",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer test-token-123",
            "X-Noroff-API-Key": "test-api-key-456",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(venuePayload),
        }
      );
    });

    it("should throw error when not logged in", async () => {
      vi.mocked(auth.getToken).mockReturnValue(null);

      await expect(createVenue(venuePayload)).rejects.toThrow(
        "You must be logged in to perform this action."
      );
    });

    it("should throw error when API key is missing", async () => {
      vi.mocked(auth.getApiKey).mockReturnValue(null);

      await expect(createVenue(venuePayload)).rejects.toThrow(
        "Missing API key for this user."
      );
    });

    it("should throw error when creation fails", async () => {
      const mockError = {
        errors: [{ message: "Invalid venue data" }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(createVenue(venuePayload)).rejects.toThrow(
        "Invalid venue data"
      );
    });

    it("should create venue with minimal required fields", async () => {
      const minimalPayload: VenuePayload = {
        name: "Minimal Venue",
        description: "A basic venue",
        price: 100,
        maxGuests: 2,
        media: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...mockVenue, ...minimalPayload } }),
      });

      const result = await createVenue(minimalPayload);

      expect(result.name).toBe("Minimal Venue");
    });
  });

  describe("updateVenue", () => {
    beforeEach(() => {
      vi.mocked(auth.getToken).mockReturnValue("test-token-123");
      vi.mocked(auth.getApiKey).mockReturnValue("test-api-key-456");
    });

    const updatePayload: VenuePayload = {
      name: "Updated Beach House",
      description: "An updated beach house",
      price: 250,
      maxGuests: 8,
      media: [{ url: "https://example.com/updated.jpg", alt: "Updated" }],
      rating: 4.8,
      meta: {
        wifi: true,
        parking: true,
        breakfast: true,
        pets: true,
      },
    };

    it("should update venue successfully", async () => {
      const mockUpdatedVenue = { ...mockVenue, ...updatePayload };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUpdatedVenue }),
      });

      const result = await updateVenue("venue-123", updatePayload);

      expect(result).toEqual(mockUpdatedVenue);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://v2.api.noroff.dev/holidaze/venues/venue-123",
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer test-token-123",
            "X-Noroff-API-Key": "test-api-key-456",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        }
      );
    });

    it("should throw error when not logged in", async () => {
      vi.mocked(auth.getToken).mockReturnValue(null);

      await expect(updateVenue("venue-123", updatePayload)).rejects.toThrow(
        "You must be logged in to perform this action."
      );
    });

    it("should throw error when API key is missing", async () => {
      vi.mocked(auth.getApiKey).mockReturnValue(null);

      await expect(updateVenue("venue-123", updatePayload)).rejects.toThrow(
        "Missing API key for this user."
      );
    });

    it("should throw error when update fails", async () => {
      const mockError = {
        errors: [{ message: "Venue not found" }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(updateVenue("venue-123", updatePayload)).rejects.toThrow(
        "Venue not found"
      );
    });

    it("should throw generic error when no specific error message", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(updateVenue("venue-123", updatePayload)).rejects.toThrow(
        "Failed to update venue"
      );
    });
  });

  describe("deleteVenue", () => {
    beforeEach(() => {
      vi.mocked(auth.getToken).mockReturnValue("test-token-123");
      vi.mocked(auth.getApiKey).mockReturnValue("test-api-key-456");
    });

    it("should delete venue successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const result = await deleteVenue("venue-123");

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://v2.api.noroff.dev/holidaze/venues/venue-123",
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer test-token-123",
            "X-Noroff-API-Key": "test-api-key-456",
            "Content-Type": "application/json",
          },
        }
      );
    });

    it("should throw error when not logged in", async () => {
      vi.mocked(auth.getToken).mockReturnValue(null);

      await expect(deleteVenue("venue-123")).rejects.toThrow(
        "You must be logged in to perform this action."
      );
    });

    it("should throw error when API key is missing", async () => {
      vi.mocked(auth.getApiKey).mockReturnValue(null);

      await expect(deleteVenue("venue-123")).rejects.toThrow(
        "Missing API key for this user."
      );
    });

    it("should throw error when deletion fails", async () => {
      const mockError = {
        errors: [{ message: "Venue not found" }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(deleteVenue("venue-123")).rejects.toThrow("Venue not found");
    });

    it("should throw generic error when no specific error message", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(deleteVenue("venue-123")).rejects.toThrow(
        "Failed to delete venue"
      );
    });

    it("should handle malformed JSON in error response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(deleteVenue("venue-123")).rejects.toThrow(
        "Failed to delete venue"
      );
    });
  });
});
