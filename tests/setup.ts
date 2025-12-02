import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
});

// Mock window.dispatchEvent
Object.defineProperty(globalThis, "window", {
  value: {
    dispatchEvent: vi.fn(),
  },
  writable: true,
});

// Clear mocks before each test
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
