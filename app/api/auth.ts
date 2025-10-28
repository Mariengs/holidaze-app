const API_BASE = "https://v2.api.noroff.dev";

/* ---------- Keys in localStorage ---------- */
const TOKEN_KEY = "holidaze_token";
const PROFILE_KEY = "holidaze_profile";
const API_KEY_KEY = "holidaze_api_key";

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
    avatar?: { url: string; alt?: string };
    banner?: { url: string; alt?: string };
    bio?: string;
    venueManager?: boolean;
    _count?: { venues: number; bookings: number };
  };
  meta?: object;
}

/* ---------- Storage helpers ---------- */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  return token && token !== "undefined" ? token : null;
}

export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(PROFILE_KEY);
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

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  const key = localStorage.getItem(API_KEY_KEY);
  return key && key !== "undefined" ? key : null;
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(API_KEY_KEY);
}

/* ---------- Internal: save all auth stuff ---------- */
function saveAuthToStorage(opts: {
  token: string;
  profile: {
    name: string;
    email: string;
    avatar?: { url: string; alt?: string };
    venueManager?: boolean;
    _count?: { venues: number; bookings: number };
  };
  apiKey?: string;
}) {
  const { token, profile, apiKey } = opts;

  localStorage.setItem(TOKEN_KEY, token);

  const normalizedProfile: UserProfile = {
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    avatar: profile?.avatar,
    venueManager: profile?.venueManager ?? false,
    _count: profile?._count,
  };

  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalizedProfile));

  if (apiKey) {
    localStorage.setItem(API_KEY_KEY, apiKey);
  }
}

/* ---------- Register ---------- */
export async function registerUser({
  name,
  email,
  password,
  venueManager,
}: {
  name: string;
  email: string;
  password: string;
  venueManager: boolean;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, venueManager }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.errors?.[0]?.message || "Registration failed");
  }

  return response.json();
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

  const data: AuthResponse = await res.json();

  if (!res.ok) {
    throw new Error((data as any).errors?.[0]?.message || "Login failed");
  }

  const accessToken = data.data.accessToken;

  const profileFromApi = {
    name: data.data.name,
    email: data.data.email,
    avatar: data.data.avatar,
    venueManager: data.data.venueManager,
    _count: data.data._count,
  };

  saveAuthToStorage({
    token: accessToken,
    profile: profileFromApi,
  });

  try {
    const keyRes = await fetch(`${API_BASE}/auth/create-api-key`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name: "Holidaze Key", //  < 32 chars
      }),
    });

    if (keyRes.ok) {
      const keyJson = await keyRes.json();
      const apiKeyFromApi = keyJson?.data?.key;

      if (apiKeyFromApi) {
        localStorage.setItem(API_KEY_KEY, apiKeyFromApi);
      }
    } else {
      console.warn("API key creation failed or already exists");
    }
  } catch (err) {
    console.warn("Could not create API key:", err);
  }

  return data;
}
