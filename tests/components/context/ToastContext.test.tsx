import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  ToastProvider,
  useToast,
} from "../../../app/components/context/ToastContext";

function TestComponent() {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast({ message: "Test message" })}>
        Show Default Toast
      </button>
      <button
        onClick={() => showToast({ message: "Success!", type: "success" })}
      >
        Show Success
      </button>
      <button onClick={() => showToast({ message: "Error!", type: "error" })}>
        Show Error
      </button>
      <button onClick={() => showToast({ message: "Info!", type: "info" })}>
        Show Info
      </button>
      <button onClick={() => showToast({ message: "Custom", duration: 5000 })}>
        Show Custom Duration
      </button>
    </div>
  );
}

describe("ToastContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Provider setup", () => {
    it("should render children", () => {
      render(
        <ToastProvider>
          <div>Test Child</div>
        </ToastProvider>
      );

      expect(screen.getByText("Test Child")).toBeInTheDocument();
    });

    it("should throw error when useToast is used outside provider", () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      function BadComponent() {
        useToast();
        return <div>Bad</div>;
      }

      expect(() => render(<BadComponent />)).toThrow(
        "useToast must be used within a ToastProvider"
      );

      consoleError.mockRestore();
    });
  });

  describe("showToast functionality", () => {
    it("should add toast with message", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText("Show Default Toast");
      fireEvent.click(button);

      expect(screen.getByText("Test message")).toBeInTheDocument();
    });

    it("should add toast with default type 'success'", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText("Show Default Toast");
      fireEvent.click(button);

      const toast = screen.getByRole("alert");
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveTextContent("Test message");
    });

    it("should add toast with type 'error'", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText("Show Error");
      fireEvent.click(button);

      expect(screen.getByText("Error!")).toBeInTheDocument();
    });

    it("should add toast with type 'info'", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText("Show Info");
      fireEvent.click(button);

      expect(screen.getByText("Info!")).toBeInTheDocument();
    });

    it("should add multiple toasts", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const successButton = screen.getByText("Show Success");
      const errorButton = screen.getByText("Show Error");
      const infoButton = screen.getByText("Show Info");

      fireEvent.click(successButton);
      fireEvent.click(errorButton);
      fireEvent.click(infoButton);

      expect(screen.getByText("Success!")).toBeInTheDocument();
      expect(screen.getByText("Error!")).toBeInTheDocument();
      expect(screen.getByText("Info!")).toBeInTheDocument();

      const toasts = screen.getAllByRole("alert");
      expect(toasts).toHaveLength(3);
    });
  });

  describe("Auto-dismiss functionality", () => {
    it("should auto-remove toast after default duration (2000ms + 1000ms)", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText("Show Default Toast");
      fireEvent.click(button);

      expect(screen.getByText("Test message")).toBeInTheDocument();

      // Fast-forward 2000ms (duration) - toast should still be visible
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByText("Test message")).toBeInTheDocument();

      // Fast-forward another 1000ms (animation time in Toast.tsx) - toast should be removed
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByText("Test message")).not.toBeInTheDocument();
    });

    it("should auto-remove toast after custom duration (5000ms + 1000ms)", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText("Show Custom Duration");
      fireEvent.click(button);

      expect(screen.getByText("Custom")).toBeInTheDocument();

      // Fast-forward 5000ms + 1000ms
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(screen.queryByText("Custom")).not.toBeInTheDocument();
    });

    it("should handle multiple toasts with different durations", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const defaultButton = screen.getByText("Show Default Toast");
      const customButton = screen.getByText("Show Custom Duration");

      fireEvent.click(defaultButton); // 2000ms + 1000ms = 3000ms
      fireEvent.click(customButton); // 5000ms + 1000ms = 6000ms

      expect(screen.getByText("Test message")).toBeInTheDocument();
      expect(screen.getByText("Custom")).toBeInTheDocument();

      // After 3000ms, first toast should be removed
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.queryByText("Test message")).not.toBeInTheDocument();
      expect(screen.getByText("Custom")).toBeInTheDocument();

      // After another 3500ms (total 6500ms), second toast should be removed
      // Note: ToastContext has fallback timer at duration + 1500ms
      act(() => {
        vi.advanceTimersByTime(3500);
      });

      expect(screen.queryByText("Custom")).not.toBeInTheDocument();
    });
  });

  describe("Toast rendering", () => {
    it("should render toast container at correct position", () => {
      const { container } = render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const toastContainer = container.querySelector(
        '[style*="position: fixed"]'
      );
      expect(toastContainer).toBeInTheDocument();
      expect(toastContainer).toHaveStyle({
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: "9999",
      });
    });

    it("should render toasts in correct order (newest at bottom)", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText("Show Success"));
      fireEvent.click(screen.getByText("Show Error"));
      fireEvent.click(screen.getByText("Show Info"));

      const toasts = screen.getAllByRole("alert");
      expect(toasts[0]).toHaveTextContent("Success!");
      expect(toasts[1]).toHaveTextContent("Error!");
      expect(toasts[2]).toHaveTextContent("Info!");
    });

    it("should pass duration prop to Toast component", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText("Show Custom Duration");
      fireEvent.click(button);

      // Toast appears
      expect(screen.getByText("Custom")).toBeInTheDocument();

      // Should not dismiss after default duration (2000ms + 1000ms)
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText("Custom")).toBeInTheDocument();

      // Should dismiss after custom duration (5000ms + 1000ms)
      act(() => {
        vi.advanceTimersByTime(3000); // Total 6000ms
      });
      expect(screen.queryByText("Custom")).not.toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle rapid successive toast calls", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText("Show Default Toast");

      // Click 5 times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      const toasts = screen.getAllByRole("alert");
      expect(toasts.length).toBe(5);
    });

    it("should handle empty message", () => {
      function EmptyMessageComponent() {
        const { showToast } = useToast();
        return (
          <button onClick={() => showToast({ message: "" })}>Show Empty</button>
        );
      }

      render(
        <ToastProvider>
          <EmptyMessageComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText("Show Empty"));

      const toast = screen.getByRole("alert");
      expect(toast).toBeInTheDocument();
    });

    it("should handle very long messages", () => {
      const longMessage = "A".repeat(500);

      function LongMessageComponent() {
        const { showToast } = useToast();
        return (
          <button onClick={() => showToast({ message: longMessage })}>
            Show Long
          </button>
        );
      }

      render(
        <ToastProvider>
          <LongMessageComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText("Show Long"));

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("should clean up timers on unmount", () => {
      const { unmount } = render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText("Show Default Toast");
      fireEvent.click(button);

      expect(screen.getByText("Test message")).toBeInTheDocument();

      // Unmount before timer completes
      unmount();

      // Advance timers
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    });
  });
});
