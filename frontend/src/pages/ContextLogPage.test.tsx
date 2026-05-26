import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("../lib/api", () => ({
  createContext: vi.fn(),
}));

import ContextLogPage from "./ContextLogPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <ContextLogPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ContextLogPage", () => {
  it("renders all optional fields", () => {
    renderPage();

    expect(screen.getByText("Log Context")).toBeInTheDocument();
    expect(screen.getByText("Stress")).toBeInTheDocument();
    expect(screen.getByLabelText(/sleep hours/i)).toBeInTheDocument();
    expect(screen.getByText("Sleep Quality")).toBeInTheDocument();
    expect(screen.getByLabelText(/water/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/exercise type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/exercise duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/caffeine/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/alcohol/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/medications/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/menstrual phase/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save context/i }),
    ).toBeInTheDocument();
  });

  it("shows error when submitting with no fields filled", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: /save context/i }),
    );

    expect(
      screen.getByText("At least one field is required"),
    ).toBeInTheDocument();
  });

  it("renders exercise type options", () => {
    renderPage();
    const select = screen.getByLabelText(/exercise type/i) as HTMLSelectElement;
    // placeholder + 5 options (none, walk, gym, run, other)
    expect(select.options.length).toBe(6);
  });

  it("renders menstrual phase options", () => {
    renderPage();
    const select = screen.getByLabelText(
      /menstrual phase/i,
    ) as HTMLSelectElement;
    // placeholder + 5 options
    expect(select.options.length).toBe(6);
  });

  it("shows slider hint text for untouched sliders", () => {
    renderPage();
    expect(
      screen.getByText("Slide to set stress level"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Slide to set sleep quality"),
    ).toBeInTheDocument();
  });
});
