import { getToken, getApiKey } from "./auth";

const API_BASE = "https://v2.api.noroff.dev/holidaze";

function buildHeaders(includeJson = false) {
  const token = getToken();
  const apiKey = getApiKey();

  if (!token) throw new Error("You must be logged in to book a venue.");
  if (!apiKey) throw new Error("Missing API key for this user.");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "X-Noroff-API-Key": apiKey,
  };

  if (includeJson) headers["Content-Type"] = "application/json";

  return headers;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  maxGuests: number;
  media: { url: string; alt?: string }[];
  location?: {
    address?: string;
    city?: string;
    country?: string;
  };
  owner?: {
    name: string;
    email: string;
  };
  created: string;
  updated: string;
  bookings?: Booking[];
}

export interface Booking {
  id: string;
  dateFrom: string;
  dateTo: string;
  guests: number;
  customer: {
    name: string;
    email: string;
  };
}

/* ---------- Get all venues or search by query ---------- */
export async function getAllVenues(query?: string): Promise<Venue[]> {
  const token = getToken();

  const url = query
    ? `${API_BASE}/venues/search?q=${encodeURIComponent(query)}`
    : `${API_BASE}/venues`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.errors?.[0]?.message || "Failed to fetch venues");
  }

  const data = await res.json();
  return data.data || [];
}

/* ---------- Get single venue by ID ---------- */
export async function getVenueById(id: string): Promise<Venue> {
  const res = await fetch(
    `${API_BASE}/venues/${id}?_bookings=true&_owner=true`
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.errors?.[0]?.message || "Failed to fetch venue");
  }

  const data = await res.json();
  return data.data;
}

/* ---------- Create a booking ---------- */
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
}) {
  const res = await fetch("https://v2.api.noroff.dev/holidaze/bookings", {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify({
      dateFrom,
      dateTo,
      guests,
      venueId,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.errors?.[0]?.message || "Booking failed");
  }

  return data.data;
}
