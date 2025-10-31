import { getToken, getApiKey } from "./auth";

const API_BASE = "https://v2.api.noroff.dev/holidaze";

function buildHeaders(includeJson = false) {
  const token = getToken();
  const apiKey = getApiKey();

  if (!token) throw new Error("You must be logged in to perform this action.");
  if (!apiKey) throw new Error("Missing API key for this user.");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "X-Noroff-API-Key": apiKey,
  };
  if (includeJson) headers["Content-Type"] = "application/json";
  return headers;
}

export interface Booking {
  id: string;
  dateFrom: string;
  dateTo: string;
  guests: number;
  customer: { name: string; email: string };
}

export interface Meta {
  wifi?: boolean;
  parking?: boolean;
  breakfast?: boolean;
  pets?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  price: number;
  rating?: number; // kan settes via create/update (valgfritt i APIet)
  maxGuests: number;
  media: { url: string; alt?: string }[];
  meta?: Meta; // toppnivå
  location?: {
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    continent?: string;
    lat?: number;
    lng?: number;
  };
  owner?: { name: string; email: string };
  created: string;
  updated: string;
  bookings?: Booking[];
}

export interface VenuePayload {
  name: string;
  description: string;
  price: number;
  maxGuests: number;
  media: { url: string; alt?: string }[];
  rating?: number; // <-- NYTT: sendes til API ved create/update
  meta?: Meta;
  location?: {
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    continent?: string;
    lat?: number;
    lng?: number;
  };
}

/* ---------- Get all venues or search by query ---------- */
export async function getAllVenues(query?: string): Promise<Venue[]> {
  const token = getToken();
  const apiKey = getApiKey();

  const url =
    query && query.trim() !== ""
      ? `${API_BASE}/venues/search?q=${encodeURIComponent(
          query
        )}&limit=100&sort=created&sortOrder=desc`
      : `${API_BASE}/venues?limit=100&sort=created&sortOrder=desc&_owner=true&_bookings=true`;

  if (token && apiKey) {
    const resAuth = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Noroff-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    });
    const dataAuth = await resAuth.json().catch(() => ({}));
    if (!resAuth.ok) {
      throw new Error(
        dataAuth.errors?.[0]?.message || "Failed to fetch venues"
      );
    }
    return dataAuth.data || [];
  }

  const resPublic = await fetch(url);
  const dataPublic = await resPublic.json().catch(() => ({}));
  if (!resPublic.ok) {
    throw new Error(
      dataPublic.errors?.[0]?.message || "Failed to fetch venues"
    );
  }
  return dataPublic.data || [];
}

/* ---------- Get single venue ---------- */
export async function getVenueById(id: string): Promise<Venue> {
  const token = getToken();
  const apiKey = getApiKey();
  const url = `${API_BASE}/venues/${id}?_bookings=true&_owner=true`;

  if (token && apiKey) {
    const resAuth = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Noroff-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    });
    const jsonAuth = await resAuth.json().catch(() => ({}) as any);
    if (!resAuth.ok) {
      throw new Error(jsonAuth.errors?.[0]?.message || "Failed to fetch venue");
    }
    return jsonAuth.data;
  }

  const resPublic = await fetch(url);
  const jsonPublic = await resPublic.json().catch(() => ({}) as any);
  if (!resPublic.ok) {
    throw new Error(jsonPublic.errors?.[0]?.message || "Failed to fetch venue");
  }
  return jsonPublic.data;
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
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify({ dateFrom, dateTo, guests, venueId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.errors?.[0]?.message || "Booking failed");
  return data.data;
}

/* ---------- Get venues owned by a specific user ---------- */
export async function getUserVenues(username: string): Promise<Venue[]> {
  const token = getToken();
  const apiKey = getApiKey();

  if (!token) throw new Error("You must be logged in to view your venues.");
  if (!apiKey) throw new Error("Missing API key for this user.");

  const res = await fetch(
    `${API_BASE}/profiles/${username}/venues?_bookings=true`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Noroff-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.message || "Failed to fetch your venues");
  }
  return data.data || [];
}

/* ---------- Create new venue ---------- */
export async function createVenue(body: VenuePayload): Promise<Venue> {
  const res = await fetch(`${API_BASE}/venues`, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.message || "Failed to create venue");
  }
  return data.data;
}

/* ---------- Update an existing venue ---------- */
export async function updateVenue(
  id: string,
  body: VenuePayload
): Promise<Venue> {
  const res = await fetch(`${API_BASE}/venues/${id}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.message || "Failed to update venue");
  }
  return data.data;
}

/* ---------- Delete venue ---------- */
export async function deleteVenue(id: string) {
  const res = await fetch(`${API_BASE}/venues/${id}`, {
    method: "DELETE",
    headers: buildHeaders(true),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.errors?.[0]?.message || "Failed to delete venue");
  }
  return true;
}
