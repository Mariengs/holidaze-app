// Handles login, register and token storage for Holidaze API (Noroff v2)

const API_BASE = "https://v2.api.noroff.dev";

/* ---------- Types ---------- */
export interface UserProfile {
  name: string;
  email: string;
  avatar?: {
    url: string;
    alt?: string;
  };
  venueManager?: boolean;
  _count?: {
    venues: number;
    bookings: number;
  };
}

export interface AuthResponse {
  data: {
    accessToken: string;
    profile: UserProfile;
  };
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  avatar?: {
    url: string;
    alt?: string;
  };
  venueManager?: boolean;
}

/* ---------- Local Storage Keys ---------- */
const TOKEN_KEY = "holidaze_token";
const PROFILE_KEY = "holidaze_profile";

/* ---------- Register ---------- */
export async function registerUser(
  formData: RegisterData
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.errors?.[0]?.message || "Registration failed");
  }

  const data = await res.json();
  saveAuth(data.data.accessToken, data.data.profile);
  return data;
}

/* ---------- Login ---------- */
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.errors?.[0]?.message || "Login failed");
  }

  const data = await res.json();
  saveAuth(data.data.accessToken, data.data.profile);
  return data;
}

/* ---------- Auth Helpers ---------- */
export function saveAuth(token: string, profile: UserProfile) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("holidaze_token");
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("holidaze_token");
  localStorage.removeItem("holidaze_profile");
}

export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("holidaze_profile");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "name" in parsed) {
      return parsed as UserProfile;
    }
    return null;
  } catch {
    return null;
  }
}
