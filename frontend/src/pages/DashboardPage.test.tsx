import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockUseDashboardSummary = vi.fn();
vi.mock("../hooks/useDashboardSummary", () => ({
  useDashboardSummary: (...args: unknown[]) => mockUseDashboardSummary(...args),
}));

import DashboardPage from "./DashboardPage";

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading spinner while fetching", () => {
    mockUseDashboardSummary.mockReturnValue({ data: null, loading: true, error: null });
    renderDashboard();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows error state with retry button", () => {
    mockUseDashboardSummary.mockReturnValue({
      data: null,
      loading: false,
      error: "Network error",
    });
    renderDashboard();
    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("renders summary stats with data", () => {
    mockUseDashboardSummary.mockReturnValue({
      data: {
        todayLogCount: 3,
        recentSymptomScore: 6,
        recentBristolType: 4,
        topHypothesis: {
          trigger_name: "Garlic & Onion",
          fodmap_category: "F",
          confidence_score: 0.72,
          confidence_label: "High",
          direction: "worsens",
          symptom_pattern: "Bloating within 8-12 hours",
          supporting_events: 6,
          contradicting_events: 1,
        },
      },
      loading: false,
      error: null,
    });
    renderDashboard();

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("6/10")).toBeInTheDocument();
    expect(screen.getByText("Type 4")).toBeInTheDocument();
  });

  it("renders empty state placeholders when no data", () => {
    mockUseDashboardSummary.mockReturnValue({
      data: {
        todayLogCount: 0,
        recentSymptomScore: null,
        recentBristolType: null,
        topHypothesis: null,
      },
      loading: false,
      error: null,
    });
    renderDashboard();

    // All stat cards show "—"
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it("shows CTA to run AI review when no hypotheses", () => {
    mockUseDashboardSummary.mockReturnValue({
      data: {
        todayLogCount: 0,
        recentSymptomScore: null,
        recentBristolType: null,
        topHypothesis: null,
      },
      loading: false,
      error: null,
    });
    renderDashboard();

    expect(screen.getByText("No trigger hypotheses yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /run ai review/i }),
    ).toBeInTheDocument();
  });

  it("shows hypothesis teaser card with top trigger", () => {
    mockUseDashboardSummary.mockReturnValue({
      data: {
        todayLogCount: 2,
        recentSymptomScore: 5,
        recentBristolType: 6,
        topHypothesis: {
          trigger_name: "Lactose",
          fodmap_category: "D",
          confidence_score: 0.45,
          confidence_label: "Moderate",
          direction: "worsens",
          symptom_pattern: "Mild bloating",
          supporting_events: 3,
          contradicting_events: 2,
        },
      },
      loading: false,
      error: null,
    });
    renderDashboard();

    expect(screen.getByText("Lactose")).toBeInTheDocument();
    expect(screen.getByText("FODMAP: D")).toBeInTheDocument();
    expect(screen.getByText(/Moderate/)).toBeInTheDocument();
  });

  it("renders all 4 quick-log buttons", () => {
    mockUseDashboardSummary.mockReturnValue({
      data: {
        todayLogCount: 0,
        recentSymptomScore: null,
        recentBristolType: null,
        topHypothesis: null,
      },
      loading: false,
      error: null,
    });
    renderDashboard();

    expect(screen.getByRole("button", { name: /meal/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stool/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /context/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /symptoms/i })).toBeInTheDocument();
  });
});
