import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getToken,
  getProfile,
  getApiKey,
  clearAuth,
  registerUser,
  loginUser,
  forceVenueManagerTrue,
  updateProfileMedia,
  type UserProfile,
  type AuthResponse,
} from "../../app/api/auth";

// Mock fetch globally
global.fetch = vi.fn();

describe("Auth Storage Helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getToken", () => {
    it("should return null when no token exists", () => {
      expect(getToken()).toBeNull();
    });

    it("should return token when it exists", () => {
      localStorage.setItem("holidaze_token", "test-token-123");
      expect(getToken()).toBe("test-token-123");
    });

    it('should return null when token is "undefined" string', () => {
      localStorage.setItem("holidaze_token", "undefined");
      expect(getToken()).toBeNull();
    });
  });

  describe("getProfile", () => {
    it("should return null when no profile exists", () => {
      expect(getProfile()).toBeNull();
    });

    it("should return parsed profile when valid JSON exists", () => {
      const mockProfile: UserProfile = {
        name: "testuser",
        email: "test@example.com",
        venueManager: true,
      };
      localStorage.setItem("holidaze_profile", JSON.stringify(mockProfile));

      const profile = getProfile();
      expect(profile).toEqual(mockProfile);
    });

    it("should return null when profile JSON is invalid", () => {
      localStorage.setItem("holidaze_profile", "invalid-json{");
      expect(getProfile()).toBeNull();
    });

    it('should return null when profile does not have "name" property', () => {
      localStorage.setItem(
        "holidaze_profile",
        JSON.stringify({ email: "test@example.com" })
      );
      expect(getProfile()).toBeNull();
    });

    it("should handle profile with avatar and banner", () => {
      const mockProfile: UserProfile = {
        name: "testuser",
        email: "test@example.com",
        avatar: { url: "https://example.com/avatar.jpg", alt: "Avatar" },
        banner: { url: "https://example.com/banner.jpg", alt: "Banner" },
        venueManager: false,
        _count: { venues: 5, bookings: 10 },
      };
      localStorage.setItem("holidaze_profile", JSON.stringify(mockProfile));

      const profile = getProfile();
      expect(profile).toEqual(mockProfile);
    });
  });

  describe("getApiKey", () => {
    it("should return null when no API key exists", () => {
      expect(getApiKey()).toBeNull();
    });

    it("should return API key when it exists", () => {
      localStorage.setItem("holidaze_api_key", "api-key-123");
      expect(getApiKey()).toBe("api-key-123");
    });

    it('should return null when API key is "undefined" string', () => {
      localStorage.setItem("holidaze_api_key", "undefined");
      expect(getApiKey()).toBeNull();
    });
  });

  describe("clearAuth", () => {
    it("should remove all auth-related items from localStorage", () => {
      localStorage.setItem("holidaze_token", "token");
      localStorage.setItem(
        "holidaze_profile",
        JSON.stringify({ name: "test" })
      );
      localStorage.setItem("holidaze_api_key", "api-key");

      clearAuth();

      expect(localStorage.getItem("holidaze_token")).toBeNull();
      expect(localStorage.getItem("holidaze_profile")).toBeNull();
      expect(localStorage.getItem("holidaze_api_key")).toBeNull();
    });
  });
});

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully register a new user", async () => {
    const mockResponse: AuthResponse = {
      data: {
        accessToken: "new-token",
        name: "newuser",
        email: "new@example.com",
        venueManager: false,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await registerUser({
      name: "newuser",
      email: "new@example.com",
      password: "Password123",
      venueManager: false,
    });

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://v2.api.noroff.dev/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "newuser",
          email: "new@example.com",
          password: "Password123",
          venueManager: false,
        }),
      }
    );
  });

  it("should throw error when registration fails", async () => {
    const mockError = {
      errors: [{ message: "Email already exists" }],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => mockError,
    });

    await expect(
      registerUser({
        name: "newuser",
        email: "existing@example.com",
        password: "Password123",
        venueManager: false,
      })
    ).rejects.toThrow("Email already exists");
  });

  it("should throw generic error when API returns no specific message", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await expect(
      registerUser({
        name: "newuser",
        email: "test@example.com",
        password: "Password123",
        venueManager: false,
      })
    ).rejects.toThrow("Registration failed");
  });
});

describe("loginUser", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should successfully login and store auth data", async () => {
    const mockLoginResponse: AuthResponse = {
      data: {
        accessToken: "login-token-123",
        name: "testuser",
        email: "test@example.com",
        venueManager: true,
        avatar: { url: "https://example.com/avatar.jpg" },
        _count: { venues: 2, bookings: 5 },
      },
    };

    const mockApiKeyResponse = {
      data: { key: "api-key-xyz" },
    };

    const mockProfileResponse = {
      data: {
        name: "testuser",
        email: "test@example.com",
        venueManager: true,
        avatar: { url: "https://example.com/avatar.jpg" },
        _count: { venues: 2, bookings: 5 },
      },
    };

    // Mock login request
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      })
      // Mock API key creation
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiKeyResponse,
      })
      // Mock profile fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfileResponse,
      });

    const result = await loginUser("test@example.com", "Password123");

    expect(result).toEqual(mockLoginResponse);
    expect(localStorage.getItem("holidaze_token")).toBe("login-token-123");
    expect(localStorage.getItem("holidaze_api_key")).toBe("api-key-xyz");

    const storedProfile = JSON.parse(localStorage.getItem("holidaze_profile")!);
    expect(storedProfile.name).toBe("testuser");
    expect(storedProfile.email).toBe("test@example.com");
    expect(storedProfile.venueManager).toBe(true);
  });

  it("should throw error when login credentials are invalid", async () => {
    const mockError = {
      errors: [{ message: "Invalid credentials" }],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => mockError,
    });

    await expect(
      loginUser("wrong@example.com", "WrongPassword")
    ).rejects.toThrow("Invalid credentials");
  });

  it("should handle API key creation failure gracefully", async () => {
    const mockLoginResponse: AuthResponse = {
      data: {
        accessToken: "login-token-123",
        name: "testuser",
        email: "test@example.com",
        venueManager: false,
      },
    };

    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    // Mock login success
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      })
      // Mock API key creation failure
      .mockResolvedValueOnce({
        ok: false,
      })
      // Mock profile fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLoginResponse.data }),
      });

    const result = await loginUser("test@example.com", "Password123");

    expect(result).toEqual(mockLoginResponse);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "API key creation failed or already exists"
    );

    consoleWarnSpy.mockRestore();
  });

  it("should dispatch auth-updated event after successful login", async () => {
    const mockLoginResponse: AuthResponse = {
      data: {
        accessToken: "login-token-123",
        name: "testuser",
        email: "test@example.com",
        venueManager: false,
      },
    };

    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLoginResponse.data }),
      });

    await loginUser("test@example.com", "Password123");

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "auth-updated" })
    );
  });
});

describe("forceVenueManagerTrue", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should throw error when not authenticated", async () => {
    await expect(forceVenueManagerTrue()).rejects.toThrow("Not authenticated");
  });

  it("should successfully update venueManager to true", async () => {
    localStorage.setItem("holidaze_token", "test-token");
    localStorage.setItem("holidaze_api_key", "test-api-key");
    localStorage.setItem(
      "holidaze_profile",
      JSON.stringify({
        name: "testuser",
        email: "test@example.com",
        venueManager: false,
      })
    );

    const mockResponse = {
      data: {
        name: "testuser",
        email: "test@example.com",
        venueManager: true,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await forceVenueManagerTrue();

    expect(result).toEqual(mockResponse);

    const updatedProfile = JSON.parse(
      localStorage.getItem("holidaze_profile")!
    );
    expect(updatedProfile.venueManager).toBe(true);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://v2.api.noroff.dev/holidaze/profiles/testuser",
      {
        method: "PUT",
        headers: {
          Authorization: "Bearer test-token",
          "X-Noroff-API-Key": "test-api-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ venueManager: true }),
      }
    );
  });

  it("should throw error when API request fails", async () => {
    localStorage.setItem("holidaze_token", "test-token");
    localStorage.setItem("holidaze_api_key", "test-api-key");
    localStorage.setItem(
      "holidaze_profile",
      JSON.stringify({ name: "testuser", email: "test@example.com" })
    );

    const mockError = {
      errors: [{ message: "Update failed" }],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => mockError,
    });

    await expect(forceVenueManagerTrue()).rejects.toThrow("Update failed");
  });

  it("should dispatch auth-updated event after successful update", async () => {
    localStorage.setItem("holidaze_token", "test-token");
    localStorage.setItem("holidaze_api_key", "test-api-key");
    localStorage.setItem(
      "holidaze_profile",
      JSON.stringify({ name: "testuser", email: "test@example.com" })
    );

    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    });

    await forceVenueManagerTrue();

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "auth-updated" })
    );
  });
});

describe("updateProfileMedia", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should throw error when not authenticated", async () => {
    await expect(
      updateProfileMedia({ avatarUrl: "https://example.com/avatar.jpg" })
    ).rejects.toThrow("Not authenticated");
  });

  it("should throw error when API key is missing", async () => {
    localStorage.setItem("holidaze_token", "test-token");
    localStorage.setItem(
      "holidaze_profile",
      JSON.stringify({ name: "testuser", email: "test@example.com" })
    );

    await expect(
      updateProfileMedia({ avatarUrl: "https://example.com/avatar.jpg" })
    ).rejects.toThrow("Missing API key for this user.");
  });

  it("should successfully update avatar", async () => {
    localStorage.setItem("holidaze_token", "test-token");
    localStorage.setItem("holidaze_api_key", "test-api-key");
    localStorage.setItem(
      "holidaze_profile",
      JSON.stringify({ name: "testuser", email: "test@example.com" })
    );

    const mockResponse = {
      data: {
        name: "testuser",
        email: "test@example.com",
        avatar: { url: "https://example.com/new-avatar.jpg", alt: "My Avatar" },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await updateProfileMedia({
      avatarUrl: "https://example.com/new-avatar.jpg",
      avatarAlt: "My Avatar",
    });

    expect(result).toEqual(mockResponse.data);

    const updatedProfile = JSON.parse(
      localStorage.getItem("holidaze_profile")!
    );
    expect(updatedProfile.avatar).toEqual({
      url: "https://example.com/new-avatar.jpg",
      alt: "My Avatar",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://v2.api.noroff.dev/holidaze/profiles/testuser",
      {
        method: "PUT",
        headers: {
          Authorization: "Bearer test-token",
          "X-Noroff-API-Key": "test-api-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatar: {
            url: "https://example.com/new-avatar.jpg",
            alt: "My Avatar",
          },
        }),
      }
    );
  });

  it("should successfully update banner", async () => {
    localStorage.setItem("holidaze_token", "test-token");
    localStorage.setItem("holidaze_api_key", "test-api-key");
    localStorage.setItem(
      "holidaze_profile",
      JSON.stringify({ name: "testuser", email: "test@example.com" })
    );

    const mockResponse = {
      data: {
        name: "testuser",
        email: "test@example.com",
        banner: {
          url: "https://example.com/new-banner.jpg",
          alt: "Profile banner",
        },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await updateProfileMedia({
      bannerUrl: "https://example.com/new-banner.jpg",
    });

    expect(result).toEqual(mockResponse.data);

    const updatedProfile = JSON.parse(
      localStorage.getItem("holidaze_profile")!
    );
    expect(updatedProfile.banner).toEqual({
      url: "https://example.com/new-banner.jpg",
      alt: "Profile banner",
    });
  });

  it("should update both avatar and banner simultaneously", async () => {
    localStorage.setItem("holidaze_token", "test-token");
    localStorage.setItem("holidaze_api_key", "test-api-key");
    localStorage.setItem(
      "holidaze_profile",
      JSON.stringify({ name: "testuser", email: "test@example.com" })
    );

    const mockResponse = {
      data: {
        name: "testuser",
        email: "test@example.com",
        avatar: { url: "https://example.com/avatar.jpg", alt: "Avatar" },
        banner: { url: "https://example.com/banner.jpg", alt: "Banner" },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await updateProfileMedia({
      avatarUrl: "https://example.com/avatar.jpg",
      avatarAlt: "Avatar",
      bannerUrl: "https://example.com/banner.jpg",
      bannerAlt: "Banner",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://v2.api.noroff.dev/holidaze/profiles/testuser",
      {
        method: "PUT",
        headers: {
          Authorization: "Bearer test-token",
          "X-Noroff-API-Key": "test-api-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatar: { url: "https://example.com/avatar.jpg", alt: "Avatar" },
          banner: { url: "https://example.com/banner.jpg", alt: "Banner" },
        }),
      }
    );
  });

  it("should dispatch auth-updated event after successful update", async () => {
    localStorage.setItem("holidaze_token", "test-token");
    localStorage.setItem("holidaze_api_key", "test-api-key");
    localStorage.setItem(
      "holidaze_profile",
      JSON.stringify({ name: "testuser", email: "test@example.com" })
    );

    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    });

    await updateProfileMedia({
      avatarUrl: "https://example.com/avatar.jpg",
    });

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "auth-updated" })
    );
  });

  it("should throw error when API request fails", async () => {
    localStorage.setItem("holidaze_token", "test-token");
    localStorage.setItem("holidaze_api_key", "test-api-key");
    localStorage.setItem(
      "holidaze_profile",
      JSON.stringify({ name: "testuser", email: "test@example.com" })
    );

    const mockError = {
      errors: [{ message: "Invalid image URL" }],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => mockError,
    });

    await expect(
      updateProfileMedia({ avatarUrl: "invalid-url" })
    ).rejects.toThrow("Invalid image URL");
  });
});
