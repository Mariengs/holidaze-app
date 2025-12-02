import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import ProtectedRoute from "../../app/components/ProtectedRoute";

// Create mock functions
const mockGetToken = vi.fn();

// Mock auth module
vi.mock("../../app/api/auth", () => ({
  getToken: () => mockGetToken(),
}));

// Mock LoginModal component
vi.mock("../../app/components/LoginModal", () => ({
  default: ({ onSuccess, onClose }: any) => (
    <div data-testid="login-modal">
      <button data-testid="login-success-btn" onClick={onSuccess}>
        Login Success
      </button>
      <button data-testid="modal-close-btn" onClick={onClose}>
        Close Modal
      </button>
    </div>
  ),
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: "" };
  });

  afterEach(() => {
    cleanup(); // Clean up DOM after each test
  });

  describe("When User is Logged In", () => {
    it("should render children when user has token", () => {
      mockGetToken.mockReturnValue("test-token-123");

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should not show LoginModal when user is authenticated", () => {
      mockGetToken.mockReturnValue("valid-token");

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      expect(screen.queryByTestId("login-modal")).not.toBeInTheDocument();
    });

    it("should render multiple children when authenticated", () => {
      mockGetToken.mockReturnValue("test-token");

      render(
        <ProtectedRoute>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
    });

    it("should treat any truthy token value as authenticated", () => {
      mockGetToken.mockReturnValue("any-token-value");

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });

  describe("When User is Not Logged In", () => {
    it("should show LoginModal when user has no token", () => {
      mockGetToken.mockReturnValue(null);

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("login-modal")).toBeInTheDocument();
    });

    it("should show access restricted message when not authenticated", () => {
      mockGetToken.mockReturnValue(null);

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText("Access restricted")).toBeInTheDocument();
      expect(
        screen.getByText("You need to log in to view this page.")
      ).toBeInTheDocument();
    });

    it("should not render protected children when not authenticated", () => {
      mockGetToken.mockReturnValue(null);

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("login-modal")).toBeInTheDocument();
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });

    it("should show blurred overlay when not authenticated", () => {
      mockGetToken.mockReturnValue(null);

      const { container } = render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("login-modal")).toBeInTheDocument();

      const blurOverlay = container.querySelector(
        'div[style*="blur"]'
      ) as HTMLElement;
      expect(blurOverlay).toBeInTheDocument();
      expect(blurOverlay?.style.filter).toBe("blur(4px)");
      expect(blurOverlay?.style.pointerEvents).toBe("none");
    });

    it("should handle empty token string as not authenticated", () => {
      mockGetToken.mockReturnValue("");

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("login-modal")).toBeInTheDocument();
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });

    it("should handle undefined token as not authenticated", () => {
      mockGetToken.mockReturnValue(undefined);

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("login-modal")).toBeInTheDocument();
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });
  });

  describe("Login Success Handler", () => {
    it("should render protected content after successful login", () => {
      mockGetToken.mockReturnValue(null);

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      // Initially, modal should be visible
      expect(screen.getByTestId("login-modal")).toBeInTheDocument();

      // Simulate successful login
      const loginButton = screen.getByTestId("login-success-btn");
      fireEvent.click(loginButton);

      // Protected content should now be visible
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      expect(screen.queryByTestId("login-modal")).not.toBeInTheDocument();
    });

    it("should hide LoginModal after successful login", () => {
      mockGetToken.mockReturnValue(null);

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("login-modal")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("login-success-btn"));

      expect(screen.queryByTestId("login-modal")).not.toBeInTheDocument();
    });

    it("should hide access restricted message after successful login", () => {
      mockGetToken.mockReturnValue(null);

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText("Access restricted")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("login-success-btn"));

      expect(screen.queryByText("Access restricted")).not.toBeInTheDocument();
    });
  });

  describe("Modal Close Handler", () => {
    it("should redirect to home page when modal is closed", () => {
      mockGetToken.mockReturnValue(null);

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("login-modal")).toBeInTheDocument();

      const closeButton = screen.getByTestId("modal-close-btn");
      fireEvent.click(closeButton);

      expect(window.location.href).toBe("/");
    });

    it("should not show protected content when modal is closed without login", () => {
      mockGetToken.mockReturnValue(null);

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("login-modal")).toBeInTheDocument();
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId("modal-close-btn"));

      // Still not visible (redirect happens)
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle complex children elements", () => {
      mockGetToken.mockReturnValue("test-token");

      render(
        <ProtectedRoute>
          <div>
            <h1>Title</h1>
            <p>Paragraph</p>
            <button>Action</button>
          </div>
        </ProtectedRoute>
      );

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Paragraph")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("should only call getToken once on mount", () => {
      mockGetToken.mockReturnValue("test-token");

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      expect(mockGetToken).toHaveBeenCalledTimes(1);
    });

    it("should check for typeof window to prevent SSR errors", () => {
      mockGetToken.mockReturnValue("test-token");

      // The component has `if (typeof window === "undefined") return;`
      // This test just verifies the component can render without crashing
      expect(() => {
        render(
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        );
      }).not.toThrow();
    });
  });
});
