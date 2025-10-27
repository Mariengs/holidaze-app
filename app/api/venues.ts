// get venues, get venue by id, create/edit venue, delete venue
// app/api/venues.ts
import { getToken } from "./auth";

const API_BASE = "https://v2.api.noroff.dev/holidaze";

export interface Venue {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  media: { url: string; alt: string }[];
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
}

/* ---------- Get all venues ---------- */
export async function getAllVenues(): Promise<Venue[]> {
  const token = getToken();

  const res = await fetch(`${API_BASE}/venues`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.errors?.[0]?.message || "Failed to fetch venues");
  }

  const data = await res.json();
  return data.data; // API sender alt under "data"
}
