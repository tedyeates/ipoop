import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockUseInfiniteHistory = vi.fn();
vi.mock("../hooks/useInfiniteHistory", () => ({
  useInfiniteHistory: (...args: unknown[]) => mockUseInfiniteHistory(...args),
}));

import HistoryPage from "./HistoryPage";

describe("HistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock IntersectionObserver as a class
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows loading spinner while fetching", () => {
    mockUseInfiniteHistory.mockReturnValue({
      groups: [],
      loading: true,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      isEmpty: false,
    });
    render(<HistoryPage />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders empty state when no entries exist", () => {
    mockUseInfiniteHistory.mockReturnValue({
      groups: [],
      loading: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      isEmpty: true,
    });
    render(<HistoryPage />);
    expect(screen.getByText("No entries yet")).toBeInTheDocument();
    expect(
      screen.getByText(/start logging meals, stools, context, or symptoms/i),
    ).toBeInTheDocument();
  });

  it("renders grouped entries by day with date headings", () => {
    mockUseInfiniteHistory.mockReturnValue({
      groups: [
        {
          date: "2025-01-15",
          entries: [
            {
              type: "meal",
              data: {
                id: "01MEAL001",
                logged_at: "2025-01-15T12:00:00Z",
                meal_type: "lunch",
                description: "Pasta with garlic",
                fodmap_flags: ["F"],
                ingredients: [],
                fodmap_detail: {},
                portion_size: null,
                eating_speed: null,
                scan_used: 0,
              },
            },
            {
              type: "stool",
              data: {
                id: "01STOOL001",
                logged_at: "2025-01-15T08:00:00Z",
                bristol_type: 4,
                urgency: null,
                pain_score: 2,
                blood: null,
                notes: null,
              },
            },
          ],
        },
        {
          date: "2025-01-14",
          entries: [
            {
              type: "symptom",
              data: {
                id: "01SYMP001",
                logged_at: "2025-01-14T20:00:00Z",
                bloating: 5,
                cramping: 3,
                nausea: 1,
                urgency: 2,
                fatigue: 4,
                overall: 4,
                notes: null,
              },
            },
          ],
        },
      ],
      loading: false,
      error: null,
      hasMore: true,
      loadMore: vi.fn(),
      isEmpty: false,
    });
    render(<HistoryPage />);

    // Date headings rendered
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.length).toBe(2);

    // Entry content visible
    expect(screen.getByText("Pasta with garlic")).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseInfiniteHistory.mockReturnValue({
      groups: [],
      loading: false,
      error: "Failed to load history",
      hasMore: false,
      loadMore: vi.fn(),
      isEmpty: false,
    });
    render(<HistoryPage />);
    expect(screen.getByText("Failed to load history")).toBeInTheDocument();
  });
});
