import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("../lib/api", () => ({
  createStool: vi.fn(),
}));

import StoolLogPage from "./StoolLogPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <StoolLogPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StoolLogPage", () => {
  it("renders Bristol picker and all fields", () => {
    renderPage();

    expect(screen.getByText("Log Stool")).toBeInTheDocument();
    // Bristol picker renders 7 type buttons
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByRole("button", { name: new RegExp(`Type ${i}`) })).toBeInTheDocument();
    }
    expect(screen.getByLabelText(/urgency/i)).toBeInTheDocument();
    expect(screen.getByText("Pain Score")).toBeInTheDocument();
    expect(screen.getByLabelText(/blood present/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save stool log/i }),
    ).toBeInTheDocument();
  });

  it("shows validation error when no Bristol type selected on submit", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: /save stool log/i }),
    );

    expect(
      screen.getByText("Bristol type is required"),
    ).toBeInTheDocument();
  });

  it("clears Bristol error after selecting a type", async () => {
    const user = userEvent.setup();
    renderPage();

    // Submit without selection
    await user.click(
      screen.getByRole("button", { name: /save stool log/i }),
    );
    expect(screen.getByText("Bristol type is required")).toBeInTheDocument();

    // Select a Bristol type
    await user.click(screen.getByRole("button", { name: /Type 4/i }));
    expect(
      screen.queryByText("Bristol type is required"),
    ).not.toBeInTheDocument();
  });

  it("renders notes field with character count", () => {
    renderPage();
    expect(screen.getByText("0/1000")).toBeInTheDocument();
  });
});
