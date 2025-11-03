const API_BASE = "https://v2.api.noroff.dev";

//  Keys in localStorage
const TOKEN_KEY = "holidaze_token";
const PROFILE_KEY = "holidaze_profile";
const API_KEY_KEY = "holidaze_api_key";

// Types
export interface UserProfile {
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

// Storage helpers
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

//save all auth stuff
function saveAuthToStorage(opts: {
  token: string;
  profile: UserProfile;
  apiKey?: string;
}) {
  const { token, profile, apiKey } = opts;

  localStorage.setItem(TOKEN_KEY, token);

  const normalizedProfile: UserProfile = {
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    avatar: profile?.avatar,
    banner: profile?.banner,
    venueManager: profile?.venueManager ?? false,
    _count: profile?._count,
  };

  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalizedProfile));

  if (apiKey) {
    localStorage.setItem(API_KEY_KEY, apiKey);
  }
}

// Register
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
    const err = await response.json().catch(() => ({}));
    throw new Error(err.errors?.[0]?.message || "Registration failed");
  }

  const data: AuthResponse = await response.json();
  return data;
}

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
  const username = data.data.name;

  try {
    const keyRes = await fetch(`${API_BASE}/auth/create-api-key`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Holidaze Key",
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

  let finalProfile: UserProfile = {
    name: data.data.name,
    email: data.data.email,
    avatar: data.data.avatar,
    banner: data.data.banner,
    venueManager: data.data.venueManager,
    _count: data.data._count,
  };

  try {
    const apiKey = localStorage.getItem(API_KEY_KEY) || "";

    const profileRes = await fetch(
      `${API_BASE}/holidaze/profiles/${username}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Noroff-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (profileRes.ok) {
      const profileJson = await profileRes.json().catch(() => ({}));
      const serverProfile = profileJson.data ?? profileJson;

      finalProfile = {
        name: serverProfile.name ?? finalProfile.name,
        email: serverProfile.email ?? finalProfile.email,
        avatar: serverProfile.avatar ?? finalProfile.avatar,
        banner: serverProfile.banner ?? finalProfile.banner,
        venueManager:
          serverProfile.venueManager ?? finalProfile.venueManager ?? false,
        _count: serverProfile._count ?? finalProfile._count,
      };
    } else {
      console.warn("Could not fetch extended profile after login");
    }
  } catch (err) {
    console.warn("Profile sync after login failed:", err);
  }

  saveAuthToStorage({
    token: accessToken,
    profile: finalProfile,
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-updated"));
  }

  return data;
}

export async function forceVenueManagerTrue() {
  const token = getToken();
  const apiKey = getApiKey();
  const currentProfile = getProfile();

  if (!token || !currentProfile?.name) {
    throw new Error("Not authenticated");
  }

  const PROFILE_ENDPOINT = `${API_BASE}/holidaze/profiles/${currentProfile.name}`;

  const res = await fetch(PROFILE_ENDPOINT, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Noroff-API-Key": apiKey || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      venueManager: true,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.errors?.[0]?.message || "Failed to set venueManager=true"
    );
  }

  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.venueManager = true;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(parsed));
    }
  } catch (err) {
    console.warn("Could not sync venueManager in storage:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-updated"));
  }

  return data;
}

// Update profile media (avatar / banner)
export async function updateProfileMedia({
  avatarUrl,
  avatarAlt,
  bannerUrl,
  bannerAlt,
}: {
  avatarUrl?: string;
  avatarAlt?: string;
  bannerUrl?: string;
  bannerAlt?: string;
}) {
  const token = getToken();
  const apiKey = getApiKey();
  const currentProfile = getProfile();

  if (!token) {
    throw new Error("Not authenticated");
  }

  if (!apiKey) {
    throw new Error("Missing API key for this user.");
  }

  if (!currentProfile?.name) {
    throw new Error("Could not resolve profile name.");
  }

  const PROFILE_ENDPOINT = `${API_BASE}/holidaze/profiles/${currentProfile.name}`;

  const body: Record<string, any> = {};

  if (avatarUrl) {
    body.avatar = {
      url: avatarUrl,
      alt: avatarAlt || "User avatar",
    };
  }

  if (bannerUrl) {
    body.banner = {
      url: bannerUrl,
      alt: bannerAlt || "Profile banner",
    };
  }

  const res = await fetch(PROFILE_ENDPOINT, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Noroff-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.errors?.[0]?.message || "Failed to update profile media"
    );
  }

  const updatedProfileFromApi = data.data ?? data;

  // sync avatar/banner localStorage
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);

      const newProfile = {
        ...parsed,
        avatar:
          updatedProfileFromApi.avatar !== undefined
            ? updatedProfileFromApi.avatar
            : parsed.avatar,
        banner:
          updatedProfileFromApi.banner !== undefined
            ? updatedProfileFromApi.banner
            : parsed.banner,
      };

      localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    }
  } catch (err) {
    console.warn("Could not sync updated profile in storage:", err);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-updated"));
  }

  return updatedProfileFromApi;
}
