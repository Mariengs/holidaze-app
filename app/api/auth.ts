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
    name: string;
    email: string;
    avatar?: {
      url: string;
      alt?: string;
    };
    banner?: {
      url: string;
      alt?: string;
    };
    bio?: string;
    venueManager?: boolean;
    _count?: {
      venues: number;
      bookings: number;
    };
  };
  meta?: object;
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
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.message || "Registration failed");
  }

  const profileFromApi = {
    name: data.data.name,
    email: data.data.email,
    avatar: data.data.avatar,
    venueManager: data.data.venueManager,
    _count: data.data._count,
  };

  saveAuth(data.data.accessToken, profileFromApi);
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
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.message || "Login failed");
  }

  const profileFromApi = {
    name: data.data.name,
    email: data.data.email,
    avatar: data.data.avatar,
    venueManager: data.data.venueManager,
    _count: data.data._count,
  };

  saveAuth(data.data.accessToken, profileFromApi);
  return data;
}

/* ---------- Auth Helpers ---------- */
export function saveAuth(token: string, profile: any) {
  localStorage.setItem(TOKEN_KEY, token);

  const normalizedProfile: UserProfile = {
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    avatar: profile?.avatar,
    venueManager: profile?.venueManager ?? false,
    _count: profile?._count,
  };

  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalizedProfile));
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
