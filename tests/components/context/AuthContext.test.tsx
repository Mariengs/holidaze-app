import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, renderHook, act } from "@testing-library/react";
import {
  AuthProvider,
  useAuth,
} from "../../../app/components/context/AuthContext";

// Create mock functions
const mockGetToken = vi.fn();
const mockGetProfile = vi.fn();
const mockClearAuth = vi.fn();

// Mock the entire auth module
vi.mock("../../../app/api/auth", () => ({
  getToken: () => mockGetToken(),
  getProfile: () => mockGetProfile(),
  clearAuth: () => mockClearAuth(),
}));

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockReturnValue(null);
    mockGetProfile.mockReturnValue(null);
  });

  describe("AuthProvider - Initial State", () => {
    it("should initialize with logged out state when no token exists", () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.profile).toBeNull();
    });

    it("should initialize with logged in state when token and profile exist", () => {
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "testuser",
        email: "test@example.com",
        avatar: { url: "https://example.com/avatar.jpg" },
        venueManager: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.profile).toEqual({
        name: "testuser",
        email: "test@example.com",
        avatarUrl: "https://example.com/avatar.jpg",
      });
    });

    it("should initialize with logged in state but no profile when only token exists", () => {
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.profile).toBeNull();
    });

    it("should handle profile without avatar", () => {
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "testuser",
        email: "test@example.com",
        venueManager: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.profile).toEqual({
        name: "testuser",
        email: "test@example.com",
        avatarUrl: undefined,
      });
    });

    it("should handle profile with avatar but no url", () => {
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "testuser",
        email: "test@example.com",
        avatar: {} as any,
        venueManager: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.profile?.avatarUrl).toBeUndefined();
    });
  });

  describe("refreshAuth", () => {
    it("should update state when user logs in", async () => {
      // Start logged out
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.profile).toBeNull();

      // Simulate login by changing mock return values
      mockGetToken.mockReturnValue("new-token-456");
      mockGetProfile.mockReturnValue({
        name: "newuser",
        email: "new@example.com",
        avatar: { url: "https://example.com/new-avatar.jpg" },
        venueManager: true,
      });

      // Call refreshAuth
      act(() => {
        result.current.refreshAuth();
      });

      // Verify state updated
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.profile).toEqual({
        name: "newuser",
        email: "new@example.com",
        avatarUrl: "https://example.com/new-avatar.jpg",
      });
    });

    it("should update state when user updates profile", async () => {
      // Start with user logged in
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "testuser",
        email: "test@example.com",
        avatar: { url: "https://example.com/old-avatar.jpg" },
        venueManager: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.profile?.avatarUrl).toBe(
        "https://example.com/old-avatar.jpg"
      );

      // Simulate profile update
      mockGetProfile.mockReturnValue({
        name: "testuser",
        email: "test@example.com",
        avatar: { url: "https://example.com/new-avatar.jpg" },
        venueManager: false,
      });

      act(() => {
        result.current.refreshAuth();
      });

      expect(result.current.profile?.avatarUrl).toBe(
        "https://example.com/new-avatar.jpg"
      );
    });

    it("should clear profile when token is removed", async () => {
      // Start logged in
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "testuser",
        email: "test@example.com",
        venueManager: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(true);

      // Simulate token removal
      mockGetToken.mockReturnValue(null);
      mockGetProfile.mockReturnValue(null);

      act(() => {
        result.current.refreshAuth();
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.profile).toBeNull();
    });

    it("should be callable multiple times", () => {
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "testuser",
        email: "test@example.com",
        venueManager: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.refreshAuth();
        result.current.refreshAuth();
        result.current.refreshAuth();
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(mockGetToken).toHaveBeenCalled();
      expect(mockGetProfile).toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should clear auth and update state when logout is called", async () => {
      // Start logged in
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "testuser",
        email: "test@example.com",
        venueManager: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(true);

      // Simulate logout - clearAuth removes token/profile
      mockClearAuth.mockImplementation(() => {
        mockGetToken.mockReturnValue(null);
        mockGetProfile.mockReturnValue(null);
      });

      await act(async () => {
        result.current.logout();
        // Wait for dynamic import to resolve
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.profile).toBeNull();
      expect(mockClearAuth).toHaveBeenCalledTimes(1);
    });

    it("should handle logout when already logged out", async () => {
      // Start logged out
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoggedIn).toBe(false);

      mockClearAuth.mockImplementation(() => {
        mockGetToken.mockReturnValue(null);
        mockGetProfile.mockReturnValue(null);
      });

      await act(async () => {
        result.current.logout();
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(mockClearAuth).toHaveBeenCalled();
    });

    it("should call clearAuth when logout is invoked", async () => {
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "testuser",
        email: "test@example.com",
        venueManager: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      mockClearAuth.mockImplementation(() => {
        mockGetToken.mockReturnValue(null);
        mockGetProfile.mockReturnValue(null);
      });

      await act(async () => {
        result.current.logout();
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockClearAuth).toHaveBeenCalled();
    });
  });

  describe("useAuth hook", () => {
    it("should provide auth context value", () => {
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "testuser",
        email: "test@example.com",
        venueManager: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current).toHaveProperty("isLoggedIn");
      expect(result.current).toHaveProperty("profile");
      expect(result.current).toHaveProperty("refreshAuth");
      expect(result.current).toHaveProperty("logout");
      expect(typeof result.current.refreshAuth).toBe("function");
      expect(typeof result.current.logout).toBe("function");
    });

    it("should work when used multiple times in the same tree", () => {
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "testuser",
        email: "test@example.com",
        venueManager: false,
      });

      const { result: result1 } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const { result: result2 } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Both hooks should have independent instances but same initial state
      expect(result1.current.isLoggedIn).toBe(true);
      expect(result2.current.isLoggedIn).toBe(true);
    });

    it("should return default context value when used outside provider", () => {
      // This tests the default context value
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.profile).toBeNull();
      expect(typeof result.current.refreshAuth).toBe("function");
      expect(typeof result.current.logout).toBe("function");
    });
  });

  describe("Provider rendering", () => {
    it("should render children", () => {
      const { container } = render(
        <AuthProvider>
          <div data-testid="child">Test Child</div>
        </AuthProvider>
      );

      expect(container.querySelector('[data-testid="child"]')).toBeTruthy();
      expect(container.textContent).toContain("Test Child");
    });

    it("should render multiple children", () => {
      const { container } = render(
        <AuthProvider>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </AuthProvider>
      );

      expect(container.querySelector('[data-testid="child1"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="child2"]')).toBeTruthy();
    });
  });

  describe("Edge cases", () => {
    it("should handle profile with all optional fields missing", () => {
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "minimalist",
        email: "minimal@example.com",
        venueManager: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.profile).toEqual({
        name: "minimalist",
        email: "minimal@example.com",
        avatarUrl: undefined,
      });
    });

    it("should handle profile with venueManager field", () => {
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "manager",
        email: "manager@example.com",
        venueManager: true,
        _count: { venues: 5, bookings: 10 },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Context doesn't expose venueManager, but profile should still load
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.profile?.name).toBe("manager");
    });

    it("should maintain function references work after rerender", () => {
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "testuser",
        email: "test@example.com",
        venueManager: false,
      });

      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const firstRefresh = result.current.refreshAuth;
      const firstLogout = result.current.logout;

      // Verify functions exist and are callable
      expect(typeof firstRefresh).toBe("function");
      expect(typeof firstLogout).toBe("function");

      rerender();

      // Verify functions still exist and are callable after rerender
      expect(typeof result.current.refreshAuth).toBe("function");
      expect(typeof result.current.logout).toBe("function");
    });

    it("should load from storage on mount", () => {
      mockGetToken.mockReturnValue("test-token-123");
      mockGetProfile.mockReturnValue({
        name: "testuser",
        email: "test@example.com",
        venueManager: false,
      });

      renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Verify that getToken and getProfile were called on mount
      expect(mockGetToken).toHaveBeenCalled();
      expect(mockGetProfile).toHaveBeenCalled();
    });
  });
});
