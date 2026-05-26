import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockGetHypotheses = vi.fn();
const mockRunReview = vi.fn();

vi.mock("../lib/api", () => ({
  getHypotheses: (...args: unknown[]) => mockGetHypotheses(...args),
  runReview: (...args: unknown[]) => mockRunReview(...args),
}));

import HypothesesPage from "./HypothesesPage";
import type { ReviewResponse } from "../lib/types";

const sampleReview: ReviewResponse = {
  id: "01J0000000HYPO00000000001",
  reviewed_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  summary: "Garlic and onion appear to be your strongest triggers.",
  days_analysed: 14,
  entries_analysed: 42,
  hypotheses: [
    {
      trigger_name: "Garlic & Onion",
      fodmap_category: "F",
      confidence_score: 0.72,
      confidence_label: "High",
      direction: "worsens",
      symptom_pattern: "Bloating within 8-12 hours",
      supporting_events: 6,
      contradicting_events: 1,
    },
    {
      trigger_name: "Lactose",
      fodmap_category: "D",
      confidence_score: 0.45,
      confidence_label: "Moderate",
      direction: "worsens",
      symptom_pattern: "Mild bloating and cramping",
      supporting_events: 3,
      contradicting_events: 2,
    },
  ],
};

function renderPage() {
  return render(<HypothesesPage />);
}

describe("HypothesesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading spinner while fetching hypotheses", () => {
    mockGetHypotheses.mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows empty state when no hypotheses exist", async () => {
    mockGetHypotheses.mockResolvedValue(null);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No hypotheses yet")).toBeInTheDocument();
    });
    expect(
      screen.getByText(/run your first ai review/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /run ai review/i }),
    ).toBeInTheDocument();
  });

  it("shows AI summary paragraph above hypothesis cards", async () => {
    mockGetHypotheses.mockResolvedValue(sampleReview);
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("Garlic and onion appear to be your strongest triggers."),
      ).toBeInTheDocument();
    });
  });

  it("renders hypothesis cards with trigger names", async () => {
    mockGetHypotheses.mockResolvedValue(sampleReview);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Garlic & Onion")).toBeInTheDocument();
    });
    expect(screen.getByText("Lactose")).toBeInTheDocument();
  });

  it("shows last review date and entries analysed count", async () => {
    mockGetHypotheses.mockResolvedValue(sampleReview);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/1 hour ago/)).toBeInTheDocument();
    });
    expect(screen.getByText(/42 entries analysed/)).toBeInTheDocument();
  });

  it("disables button and shows spinner during review", async () => {
    mockGetHypotheses.mockResolvedValue(sampleReview);
    mockRunReview.mockReturnValue(new Promise(() => {})); // never resolves
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /run ai review/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /run ai review/i }));

    expect(screen.getByRole("button", { name: /analysing/i })).toBeDisabled();
  });

  it("shows error state on review failure", async () => {
    mockGetHypotheses.mockResolvedValue(sampleReview);
    mockRunReview.mockRejectedValue(new Error("Network error"));
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /run ai review/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /run ai review/i }));

    await waitFor(() => {
      expect(screen.getByText(/ai review failed/i)).toBeInTheDocument();
    });
    // Button re-enabled after failure
    expect(screen.getByRole("button", { name: /run ai review/i })).not.toBeDisabled();
  });

  it("shows contextual AI disclaimer", async () => {
    mockGetHypotheses.mockResolvedValue(sampleReview);
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/should not replace professional medical advice/i),
      ).toBeInTheDocument();
    });
  });

  it("shows disclaimer in empty state too", async () => {
    mockGetHypotheses.mockResolvedValue(null);
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/should not replace professional medical advice/i),
      ).toBeInTheDocument();
    });
  });
});
