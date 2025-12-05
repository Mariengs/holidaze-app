import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import LoginModal from "../../app/components/LoginModal";
import * as authApi from "../../app/api/auth";

describe("LoginModal", () => {
  const mockOnSuccess = vi.fn();
  const mockOnClose = vi.fn();
  let loginUserSpy: ReturnType<typeof vi.spyOn>;
  let registerUserSpy: ReturnType<typeof vi.spyOn>;
  let forceVenueManagerTrueSpy: ReturnType<typeof vi.spyOn>;

  const defaultProps = {
    onSuccess: mockOnSuccess,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    loginUserSpy = vi.spyOn(authApi, "loginUser");
    registerUserSpy = vi.spyOn(authApi, "registerUser");
    forceVenueManagerTrueSpy = vi.spyOn(authApi, "forceVenueManagerTrue");
  });

  afterEach(() => {
    loginUserSpy.mockRestore();
    registerUserSpy.mockRestore();
    forceVenueManagerTrueSpy.mockRestore();
    cleanup();
  });

  // Rendering
  describe("Rendering", () => {
    it("should render modal with all elements (login tab by default)", () => {
      render(<LoginModal {...defaultProps} />);

      // Heading
      expect(
        screen.getByRole("heading", { name: "Holidaze" })
      ).toBeInTheDocument();

      // Login form (default)
      expect(
        screen.getByPlaceholderText("your.name@stud.noroff.no")
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Log in" })
      ).toBeInTheDocument();

      // Close button
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

      // Tab buttons (role="tab")
      expect(screen.getByRole("tab", { name: "Login" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Register" })).toBeInTheDocument();
    });

    it("should render email input with correct attributes", () => {
      render(<LoginModal {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText(
        "your.name@stud.noroff.no"
      );
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toBeRequired();
    });

    it("should render password input with correct attributes", () => {
      render(<LoginModal {...defaultProps} />);

      const passwordInput = screen.getByPlaceholderText("••••••••");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toBeRequired();
    });

    it("should not show error message initially", () => {
      render(<LoginModal {...defaultProps} />);
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    });
  });

  // User interactions
  describe("User interactions", () => {
    it("should update email when user types", () => {
      render(<LoginModal {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText(
        "your.name@stud.noroff.no"
      );
      fireEvent.change(emailInput, {
        target: { value: "test@stud.noroff.no" },
      });

      expect(emailInput).toHaveValue("test@stud.noroff.no");
    });

    it("should update password when user types", () => {
      render(<LoginModal {...defaultProps} />);

      const passwordInput = screen.getByPlaceholderText("••••••••");
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      expect(passwordInput).toHaveValue("password123");
    });

    it("should call onClose when close button is clicked", () => {
      render(<LoginModal {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: "Close" }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should switch to register tab when Register tab is clicked", () => {
      render(<LoginModal {...defaultProps} />);

      fireEvent.click(screen.getByRole("tab", { name: "Register" }));

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email (@stud.noroff.no)")).toBeInTheDocument();
      expect(screen.getByText("Confirm Password")).toBeInTheDocument();
    });
  });

  // Form submission (login)
  describe("Form submission", () => {
    it("should call loginUser when form is submitted", async () => {
      loginUserSpy.mockResolvedValueOnce(undefined);

      render(<LoginModal {...defaultProps} />);

      fireEvent.change(
        screen.getByPlaceholderText("your.name@stud.noroff.no"),
        {
          target: { value: "test@stud.noroff.no" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "password123" },
      });

      const form = screen
        .getByRole("button", { name: "Log in" })
        .closest("form")!;
      fireEvent.submit(form);

      // flush microtasks
      await Promise.resolve();

      expect(loginUserSpy).toHaveBeenCalledTimes(1);
    });

    it("should call onSuccess when login succeeds", async () => {
      loginUserSpy.mockResolvedValueOnce(undefined);

      render(<LoginModal {...defaultProps} />);

      fireEvent.change(
        screen.getByPlaceholderText("your.name@stud.noroff.no"),
        {
          target: { value: "test@stud.noroff.no" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "password123" },
      });

      const form = screen
        .getByRole("button", { name: "Log in" })
        .closest("form")!;
      fireEvent.submit(form);

      await Promise.resolve();

      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it("should show loading state during login", () => {
      loginUserSpy.mockImplementation(() => new Promise(() => {}));

      render(<LoginModal {...defaultProps} />);

      fireEvent.change(
        screen.getByPlaceholderText("your.name@stud.noroff.no"),
        {
          target: { value: "test@stud.noroff.no" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "password123" },
      });

      const form = screen
        .getByRole("button", { name: "Log in" })
        .closest("form")!;
      fireEvent.submit(form);

      expect(screen.getByText("Logging in...")).toBeInTheDocument();
    });

    it("should disable submit button during loading", () => {
      loginUserSpy.mockImplementation(() => new Promise(() => {}));

      render(<LoginModal {...defaultProps} />);

      fireEvent.change(
        screen.getByPlaceholderText("your.name@stud.noroff.no"),
        {
          target: { value: "test@stud.noroff.no" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "password123" },
      });

      const form = screen
        .getByRole("button", { name: "Log in" })
        .closest("form")!;
      fireEvent.submit(form);

      const submitButton = screen.getByRole("button", {
        name: "Logging in...",
      });
      expect(submitButton).toBeDisabled();
    });
  });

  // Error handling (login)
  describe("Error handling", () => {
    it("should call loginUser when login fails", async () => {
      loginUserSpy.mockRejectedValueOnce(new Error("Invalid credentials"));

      render(<LoginModal {...defaultProps} />);

      fireEvent.change(
        screen.getByPlaceholderText("your.name@stud.noroff.no"),
        {
          target: { value: "test@stud.noroff.no" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "wrongpassword" },
      });

      const form = screen
        .getByRole("button", { name: "Log in" })
        .closest("form")!;
      fireEvent.submit(form);

      await Promise.resolve();

      expect(loginUserSpy).toHaveBeenCalledTimes(1);
    });

    it("should not call onSuccess when login fails", async () => {
      loginUserSpy.mockRejectedValueOnce(new Error("Login failed"));

      render(<LoginModal {...defaultProps} />);

      fireEvent.change(
        screen.getByPlaceholderText("your.name@stud.noroff.no"),
        {
          target: { value: "test@stud.noroff.no" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "wrongpassword" },
      });

      const form = screen
        .getByRole("button", { name: "Log in" })
        .closest("form")!;
      fireEvent.submit(form);

      await Promise.resolve();

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should call API on error", async () => {
      loginUserSpy.mockRejectedValueOnce(new Error("Login failed"));

      render(<LoginModal {...defaultProps} />);

      fireEvent.change(
        screen.getByPlaceholderText("your.name@stud.noroff.no"),
        {
          target: { value: "test@stud.noroff.no" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "wrongpassword" },
      });

      const form = screen
        .getByRole("button", { name: "Log in" })
        .closest("form")!;
      fireEvent.submit(form);

      await Promise.resolve();

      expect(loginUserSpy).toHaveBeenCalled();
    });

    it("should handle error without message", async () => {
      loginUserSpy.mockRejectedValueOnce(new Error(""));

      render(<LoginModal {...defaultProps} />);

      fireEvent.change(
        screen.getByPlaceholderText("your.name@stud.noroff.no"),
        {
          target: { value: "test@stud.noroff.no" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "password" },
      });

      const form = screen
        .getByRole("button", { name: "Log in" })
        .closest("form")!;
      fireEvent.submit(form);

      await Promise.resolve();

      expect(loginUserSpy).toHaveBeenCalled();
    });
  });

  // Edge cases
  describe("Edge cases", () => {
    it("should handle rapid form submits", async () => {
      loginUserSpy.mockResolvedValue(undefined);

      render(<LoginModal {...defaultProps} />);

      fireEvent.change(
        screen.getByPlaceholderText("your.name@stud.noroff.no"),
        {
          target: { value: "test@stud.noroff.no" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "password123" },
      });

      const form = screen
        .getByRole("button", { name: "Log in" })
        .closest("form")!;

      fireEvent.submit(form);
      fireEvent.submit(form);
      fireEvent.submit(form);

      await Promise.resolve();

      expect(loginUserSpy).toHaveBeenCalled();
    });

    it("should handle empty email and password", () => {
      render(<LoginModal {...defaultProps} />);

      expect(
        screen.getByPlaceholderText("your.name@stud.noroff.no")
      ).toHaveValue("");
      expect(screen.getByPlaceholderText("••••••••")).toHaveValue("");
    });

    it("should handle very long email", () => {
      render(<LoginModal {...defaultProps} />);

      const longEmail = "a".repeat(100) + "@stud.noroff.no";
      fireEvent.change(
        screen.getByPlaceholderText("your.name@stud.noroff.no"),
        {
          target: { value: longEmail },
        }
      );

      expect(
        screen.getByPlaceholderText("your.name@stud.noroff.no")
      ).toHaveValue(longEmail);
    });

    it("should handle very long password", () => {
      render(<LoginModal {...defaultProps} />);

      const longPassword = "a".repeat(200);
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: longPassword },
      });

      expect(screen.getByPlaceholderText("••••••••")).toHaveValue(longPassword);
    });
  });

  // Registration flow
  describe("Registration flow", () => {
    it("should allow submitting registration form with valid data", () => {
      render(<LoginModal {...defaultProps} />);

      fireEvent.click(screen.getByRole("tab", { name: "Register" }));
      fireEvent.change(screen.getByLabelText("Name"), {
        target: { value: "Test User" },
      });
      fireEvent.change(screen.getByLabelText("Email (@stud.noroff.no)"), {
        target: { value: "test@stud.noroff.no" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText("Confirm Password"), {
        target: { value: "password123" },
      });

      const form = screen
        .getByRole("button", { name: "Register" })
        .closest("form")!;
      fireEvent.submit(form);
    });

    it("should toggle venue manager checkbox", () => {
      render(<LoginModal {...defaultProps} />);

      fireEvent.click(screen.getByRole("tab", { name: "Register" }));

      const checkbox = screen.getByLabelText(
        "I am a Venue Manager"
      ) as HTMLInputElement;

      expect(checkbox.checked).toBe(false);
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });
  });

  // Accessibility
  describe("Accessibility", () => {
    it("should have accessible close button", () => {
      render(<LoginModal {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Close" })
      ).toHaveAccessibleName("Close");
    });

    it("should have visible labels", () => {
      render(<LoginModal {...defaultProps} />);
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Password")).toBeInTheDocument();
    });

    it("should mark required fields as required", () => {
      render(<LoginModal {...defaultProps} />);
      expect(
        screen.getByPlaceholderText("your.name@stud.noroff.no")
      ).toBeRequired();
      expect(screen.getByPlaceholderText("••••••••")).toBeRequired();
    });
  });
});
