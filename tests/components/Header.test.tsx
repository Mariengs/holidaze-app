/**
 * @vitest-environment jsdom
 */

import React from "react";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Header from "../../app/components/Header";
import * as authApi from "../../app/api/auth";

// --- Mocks for auth API ---
vi.mock("../../app/api/auth", () => ({
  getToken: vi.fn(),
  getProfile: vi.fn(),
  clearAuth: vi.fn(),
}));

const getTokenMock = vi.mocked(authApi.getToken);
const getProfileMock = vi.mocked(authApi.getProfile);
const clearAuthMock = vi.mocked(authApi.clearAuth);

// Stub for LoginModal
vi.mock("../../app/components/LoginModal", () => ({
  default: ({ onSuccess, onClose }: any) => (
    <div data-testid="login-modal">
      <p>Login Modal</p>
      <button onClick={onSuccess}>Mock Login Success</button>
      <button onClick={onClose}>Close Login</button>
    </div>
  ),
}));

// Stub for VenueEditorModal
vi.mock("../../app/components/VenueEditorModal", () => ({
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="venue-editor-modal">
        <p>Venue Editor Modal</p>
        <button onClick={onClose}>Close Venue Editor</button>
      </div>
    ) : null,
}));

function renderHeader(
  theme: "light" | "dark" = "light",
  onToggleTheme = vi.fn()
) {
  return render(
    <MemoryRouter>
      <Header theme={theme} onToggleTheme={onToggleTheme} />
    </MemoryRouter>
  );
}

// --- Fix for window.addEventListener / removeEventListener ---
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

beforeAll(() => {
  (window as any).addEventListener = vi.fn();
  (window as any).removeEventListener = vi.fn();
});

// --- Mock window.location for logout / reload ---
const originalLocation = window.location;

beforeAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...originalLocation,
      href: "/",
      assign: vi.fn(),
      reload: vi.fn(),
    },
  });
});

afterAll(() => {
  (window as any).addEventListener = originalAddEventListener;
  (window as any).removeEventListener = originalRemoveEventListener;

  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTokenMock.mockReturnValue(null);
    getProfileMock.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders logo and basic nav links", async () => {
    renderHeader();

    const logoLink = await screen.findByRole("link", {
      name: /holidaze logo/i,
    });
    expect(logoLink).toHaveAttribute("href", "/");

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Venues" })).toBeInTheDocument();
  });

  it("shows Login and Register when user is not logged in", async () => {
    renderHeader();

    await screen.findByText("Login");

    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: "Profile" })
    ).not.toBeInTheDocument();
  });

  it("shows Profile and Logout when user is logged in", async () => {
    getTokenMock.mockReturnValue("fake-token");
    getProfileMock.mockReturnValue({
      name: "Marianne",
      email: "test@example.com",
      venueManager: false,
    } as any);

    renderHeader();

    await screen.findByText(/hi, marianne/i);

    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Create Venue" })
    ).not.toBeInTheDocument();
  });

  it("shows Create Venue button for venue managers (desktop)", async () => {
    getTokenMock.mockReturnValue("fake-token");
    getProfileMock.mockReturnValue({
      name: "Marianne",
      email: "host@example.com",
      venueManager: true,
    } as any);

    renderHeader();

    await screen.findByText(/hi, marianne/i);

    const createBtn = screen.getByRole("button", { name: "Create Venue" });
    expect(createBtn).toBeInTheDocument();
  });

  it("opens VenueEditorModal when Create Venue is clicked", async () => {
    getTokenMock.mockReturnValue("fake-token");
    getProfileMock.mockReturnValue({
      name: "Host",
      email: "host@example.com",
      venueManager: true,
    } as any);

    renderHeader();

    await screen.findByText(/hi, host/i);

    const createBtn = screen.getByRole("button", { name: "Create Venue" });
    fireEvent.click(createBtn);

    expect(await screen.findByTestId("venue-editor-modal")).toBeInTheDocument();
  });

  it("calls onToggleTheme when theme button is clicked", async () => {
    const onToggleTheme = vi.fn();
    renderHeader("light", onToggleTheme);

    const toggleBtn = screen.getByRole("button", {
      name: "Toggle dark mode",
    });

    fireEvent.click(toggleBtn);

    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("opens LoginModal when Login button is clicked (desktop)", async () => {
    renderHeader();

    const loginBtn = await screen.findByRole("button", { name: "Login" });
    fireEvent.click(loginBtn);

    expect(await screen.findByTestId("login-modal")).toBeInTheDocument();
  });

  it("opens LoginModal when 'open-login-modal' event is dispatched", async () => {
    renderHeader();

    window.dispatchEvent(new Event("open-login-modal"));

    expect(await screen.findByTestId("login-modal")).toBeInTheDocument();
  });

  it("opens VenueEditorModal when 'open-create-venue' event is dispatched", async () => {
    getTokenMock.mockReturnValue("fake-token");
    getProfileMock.mockReturnValue({
      name: "Host",
      email: "host@example.com",
      venueManager: true,
    } as any);

    renderHeader();

    window.dispatchEvent(new Event("open-create-venue"));

    expect(await screen.findByTestId("venue-editor-modal")).toBeInTheDocument();
  });

  it("toggles mobile menu and shows login/register when logged out", async () => {
    renderHeader();

    const menuBtn = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(menuBtn);

    const loginItem = await screen.findByRole("button", { name: "Login" });
    const registerItem = screen.getByRole("menuitem", { name: "Register" });

    expect(loginItem).toBeInTheDocument();
    expect(registerItem).toBeInTheDocument();
  });

  it("calls clearAuth when Logout is clicked from desktop auth", async () => {
    getTokenMock.mockReturnValue("fake-token");
    getProfileMock.mockReturnValue({
      name: "User",
      email: "user@example.com",
      venueManager: false,
    } as any);

    renderHeader();

    const logoutBtn = await screen.findByRole("button", { name: "Log out" });
    fireEvent.click(logoutBtn);

    expect(clearAuthMock).toHaveBeenCalledTimes(1);
  });

  it("shows Profile and Log out in mobile menu when logged in", async () => {
    getTokenMock.mockReturnValue("fake-token");
    getProfileMock.mockReturnValue({
      name: "User",
      email: "user@example.com",
      venueManager: false,
    } as any);

    renderHeader();

    await screen.findByText(/hi, user/i);

    const menuBtn = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(menuBtn);

    const profileItem = await screen.findByRole("menuitem", {
      name: "Profile",
    });
    const logoutItem = screen.getByRole("menuitem", { name: "Log out" });

    expect(profileItem).toBeInTheDocument();
    expect(logoutItem).toBeInTheDocument();
  });

  it("closes mobile menu when a nav item is clicked", async () => {
    renderHeader();

    const menuBtn = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(menuBtn);

    const venuesItem = await screen.findByRole("menuitem", { name: "Venues" });
    fireEvent.click(venuesItem);

    await waitFor(() => {
      expect(
        screen.queryByRole("menuitem", { name: "Venues" })
      ).not.toBeInTheDocument();
    });
  });
});
