import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createBooking,
  getUserBookings,
  deleteBooking,
  type Booking,
} from "../../app/api/bookings";
import * as auth from "../../app/api/auth";

// Mock fetch globally
global.fetch = vi.fn();

// Mock auth functions
vi.mock("../../app/api/auth", () => ({
  getToken: vi.fn(),
  getApiKey: vi.fn(),
}));

describe("Bookings API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(auth.getToken).mockReturnValue("test-token-123");
    vi.mocked(auth.getApiKey).mockReturnValue("test-api-key-456");
  });

  describe("createBooking", () => {
    it("should successfully create a booking", async () => {
      const mockBooking: Booking = {
        id: "booking-123",
        dateFrom: "2025-12-20",
        dateTo: "2025-12-25",
        guests: 2,
        venue: {
          id: "venue-456",
          name: "Beautiful Beach House",
          media: [{ url: "https://example.com/image.jpg", alt: "Beach house" }],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBooking }),
      });

      const result = await createBooking({
        dateFrom: "2025-12-20",
        dateTo: "2025-12-25",
        guests: 2,
        venueId: "venue-456",
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
            venueId: "venue-456",
          }),
        }
      );
    });

    it("should throw error when booking creation fails", async () => {
      const mockError = {
        errors: [{ message: "Venue is already booked for these dates" }],
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
          venueId: "venue-456",
        })
      ).rejects.toThrow("Venue is already booked for these dates");
    });

    it("should throw generic error when API returns no specific message", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(
        createBooking({
          dateFrom: "2025-12-20",
          dateTo: "2025-12-25",
          guests: 2,
          venueId: "venue-456",
        })
      ).rejects.toThrow("Booking failed");
    });

    it("should throw error when user is not logged in", async () => {
      vi.mocked(auth.getToken).mockReturnValue(null);

      await expect(
        createBooking({
          dateFrom: "2025-12-20",
          dateTo: "2025-12-25",
          guests: 2,
          venueId: "venue-456",
        })
      ).rejects.toThrow("You must be logged in.");
    });

    it("should throw error when API key is missing", async () => {
      vi.mocked(auth.getApiKey).mockReturnValue(null);

      await expect(
        createBooking({
          dateFrom: "2025-12-20",
          dateTo: "2025-12-25",
          guests: 2,
          venueId: "venue-456",
        })
      ).rejects.toThrow("Missing API key for this user.");
    });

    it("should handle booking with multiple guests", async () => {
      const mockBooking: Booking = {
        id: "booking-789",
        dateFrom: "2025-12-20",
        dateTo: "2025-12-25",
        guests: 5,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBooking }),
      });

      const result = await createBooking({
        dateFrom: "2025-12-20",
        dateTo: "2025-12-25",
        guests: 5,
        venueId: "venue-456",
      });

      expect(result.guests).toBe(5);
    });
  });

  describe("getUserBookings", () => {
    it("should successfully fetch user bookings", async () => {
      const mockBookings: Booking[] = [
        {
          id: "booking-1",
          dateFrom: "2025-12-20",
          dateTo: "2025-12-25",
          guests: 2,
          venue: {
            id: "venue-1",
            name: "Beach House",
            media: [{ url: "https://example.com/beach.jpg" }],
          },
        },
        {
          id: "booking-2",
          dateFrom: "2026-01-10",
          dateTo: "2026-01-15",
          guests: 4,
          venue: {
            id: "venue-2",
            name: "Mountain Cabin",
            media: [{ url: "https://example.com/mountain.jpg" }],
          },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBookings }),
      });

      const result = await getUserBookings("testuser");

      expect(result).toEqual(mockBookings);
      expect(result).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://v2.api.noroff.dev/holidaze/profiles/testuser/bookings?_venue=true",
        {
          headers: {
            Authorization: "Bearer test-token-123",
            "X-Noroff-API-Key": "test-api-key-456",
          },
        }
      );
    });

    it("should return empty array when user has no bookings", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await getUserBookings("newuser");

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should throw error when fetching bookings fails", async () => {
      const mockError = {
        errors: [{ message: "User not found" }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(getUserBookings("nonexistent")).rejects.toThrow(
        "User not found"
      );
    });

    it("should throw generic error when API returns no specific message", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(getUserBookings("testuser")).rejects.toThrow(
        "Failed to fetch bookings"
      );
    });

    it("should throw error when user is not logged in", async () => {
      vi.mocked(auth.getToken).mockReturnValue(null);

      await expect(getUserBookings("testuser")).rejects.toThrow(
        "You must be logged in."
      );
    });

    it("should throw error when API key is missing", async () => {
      vi.mocked(auth.getApiKey).mockReturnValue(null);

      await expect(getUserBookings("testuser")).rejects.toThrow(
        "Missing API key for this user."
      );
    });

    it("should properly encode username with special characters", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await getUserBookings("test user@123");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://v2.api.noroff.dev/holidaze/profiles/test%20user%40123/bookings?_venue=true",
        expect.any(Object)
      );
    });

    it("should include venue data in query parameter", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await getUserBookings("testuser");

      const fetchCall = (global.fetch as any).mock.calls[0][0];
      expect(fetchCall).toContain("?_venue=true");
    });
  });

  describe("deleteBooking", () => {
    it("should successfully delete a booking", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      await expect(deleteBooking("booking-123")).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://v2.api.noroff.dev/holidaze/bookings/booking-123",
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer test-token-123",
            "X-Noroff-API-Key": "test-api-key-456",
          },
        }
      );
    });

    it("should throw error when deletion fails", async () => {
      const mockError = {
        errors: [{ message: "Booking not found" }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(deleteBooking("nonexistent-booking")).rejects.toThrow(
        "Booking not found"
      );
    });

    it("should throw generic error when API returns no specific message", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(deleteBooking("booking-123")).rejects.toThrow(
        "Failed to delete booking"
      );
    });

    it("should throw error when user is not logged in", async () => {
      vi.mocked(auth.getToken).mockReturnValue(null);

      await expect(deleteBooking("booking-123")).rejects.toThrow(
        "You must be logged in."
      );
    });

    it("should throw error when API key is missing", async () => {
      vi.mocked(auth.getApiKey).mockReturnValue(null);

      await expect(deleteBooking("booking-123")).rejects.toThrow(
        "Missing API key for this user."
      );
    });

    it("should not include Content-Type header for DELETE request", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      await deleteBooking("booking-123");

      const fetchCall = (global.fetch as any).mock.calls[0][1];
      expect(fetchCall.headers).not.toHaveProperty("Content-Type");
    });
  });

  describe("buildHeaders functionality", () => {
    it("should include Content-Type for POST requests", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await createBooking({
        dateFrom: "2025-12-20",
        dateTo: "2025-12-25",
        guests: 2,
        venueId: "venue-456",
      });

      const fetchCall = (global.fetch as any).mock.calls[0][1];
      expect(fetchCall.headers["Content-Type"]).toBe("application/json");
    });

    it("should not include Content-Type for GET requests", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await getUserBookings("testuser");

      const fetchCall = (global.fetch as any).mock.calls[0][1];
      expect(fetchCall.headers).not.toHaveProperty("Content-Type");
    });

    it("should always include Authorization header", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await getUserBookings("testuser");

      const fetchCall = (global.fetch as any).mock.calls[0][1];
      expect(fetchCall.headers.Authorization).toBe("Bearer test-token-123");
    });

    it("should always include X-Noroff-API-Key header", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await getUserBookings("testuser");

      const fetchCall = (global.fetch as any).mock.calls[0][1];
      expect(fetchCall.headers["X-Noroff-API-Key"]).toBe("test-api-key-456");
    });
  });
});
