import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("../lib/api", () => ({
  createSymptom: vi.fn(),
}));

import SymptomLogPage from "./SymptomLogPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <SymptomLogPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SymptomLogPage", () => {
  it("renders all 6 severity sliders (as unset placeholders initially)", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Log Symptoms" })).toBeInTheDocument();

    // All 6 fields shown as "Not set" initially
    const fields = ["bloating", "cramping", "nausea", "urgency", "fatigue", "overall"];
    for (const field of fields) {
      expect(
        screen.getByRole("button", { name: new RegExp(`set ${field} severity`, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("shows validation errors when sliders not set on submit", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: /log symptoms/i }),
    );

    // All 6 fields should show required errors
    const alerts = screen.getAllByRole("alert");
    expect(alerts.length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText("bloating is required")).toBeInTheDocument();
    expect(screen.getByText("cramping is required")).toBeInTheDocument();
    expect(screen.getByText("nausea is required")).toBeInTheDocument();
    expect(screen.getByText("urgency is required")).toBeInTheDocument();
    expect(screen.getByText("fatigue is required")).toBeInTheDocument();
    expect(screen.getByText("overall is required")).toBeInTheDocument();
  });

  it("activates slider when placeholder button is tapped", async () => {
    const user = userEvent.setup();
    renderPage();

    // Tap the bloating placeholder
    await user.click(
      screen.getByRole("button", { name: /set bloating severity/i }),
    );

    // Now the slider should be visible (label "Bloating" with value)
    expect(screen.getByText("Bloating")).toBeInTheDocument();
    // The "Not set" for bloating should be gone, but others remain
    expect(
      screen.queryByRole("button", { name: /set bloating severity/i }),
    ).not.toBeInTheDocument();
  });

  it("renders notes field", () => {
    renderPage();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByText("0/1000")).toBeInTheDocument();
  });

  it("clears field error after activating that slider", async () => {
    const user = userEvent.setup();
    renderPage();

    // Submit to trigger errors
    await user.click(
      screen.getByRole("button", { name: /log symptoms/i }),
    );
    expect(screen.getByText("bloating is required")).toBeInTheDocument();

    // Activate bloating slider
    await user.click(
      screen.getByRole("button", { name: /set bloating severity/i }),
    );

    // Error for bloating should be cleared
    expect(
      screen.queryByText("bloating is required"),
    ).not.toBeInTheDocument();
  });
});
