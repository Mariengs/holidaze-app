import { getToken, getApiKey } from "./auth";

const API_BASE = "https://v2.api.noroff.dev/holidaze";

export interface Booking {
  id: string;
  dateFrom: string;
  dateTo: string;
  guests: number;
  venue?: {
    id: string;
    name: string;
    media?: { url: string; alt?: string }[];
  };
}

function buildHeaders(includeJson = false) {
  const token = getToken();
  const apiKey = getApiKey();

  if (!token) {
    throw new Error("You must be logged in.");
  }
  if (!apiKey) {
    throw new Error("Missing API key for this user.");
  }

  const baseHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "X-Noroff-API-Key": apiKey,
  };

  if (includeJson) {
    baseHeaders["Content-Type"] = "application/json";
  }

  return baseHeaders;
}

/* ---------- Create Booking ---------- */
export async function createBooking({
  dateFrom,
  dateTo,
  guests,
  venueId,
}: {
  dateFrom: string;
  dateTo: string;
  guests: number;
  venueId: string;
}): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify({ dateFrom, dateTo, guests, venueId }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.errors?.[0]?.message || "Booking failed");
  }

  return data.data;
}

/* ---------- Get all bookings for logged-in user ---------- */
export async function getUserBookings(userName: string): Promise<Booking[]> {
  const res = await fetch(
    `${API_BASE}/profiles/${encodeURIComponent(userName)}/bookings?_venue=true`,
    {
      headers: buildHeaders(false),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.errors?.[0]?.message || "Failed to fetch bookings");
  }

  return data.data;
}

/* ---------- Cancel booking ---------- */
export async function deleteBooking(bookingId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
    method: "DELETE",
    headers: buildHeaders(false),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.errors?.[0]?.message || "Failed to delete booking");
  }
}
