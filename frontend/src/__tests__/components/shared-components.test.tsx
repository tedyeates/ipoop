import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import Disclaimer from "../../components/Disclaimer";
import LoadingSpinner from "../../components/LoadingSpinner";
import { QuickLogButton } from "../../components/QuickLogButton";
import { FodmapCheckboxes } from "../../components/FodmapCheckboxes";
import { BristolPicker } from "../../components/BristolPicker";
import { SeveritySlider } from "../../components/SeveritySlider";
import { ConfidenceBadge } from "../../components/ConfidenceBadge";
import { HypothesisCard } from "../../components/HypothesisCard";
import { LogEntryCard } from "../../components/LogEntryCard";
import { IngredientBreakdown } from "../../components/IngredientBreakdown";

import type { Hypothesis, MealLog, StoolLog, ContextLog, SymptomLog, ScanResponse } from "../../lib/types";

afterEach(() => {
  cleanup();
});

// ─── BottomNav ───────────────────────────────────────────────────────────────

describe("BottomNav", () => {
  const labels = ["Home", "Meal", "Stool", "Context", "Symptoms"];

  it("renders all 5 nav items with correct labels", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <BottomNav />
      </MemoryRouter>
    );
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("highlights active route", () => {
    render(
      <MemoryRouter initialEntries={["/log/meal"]}>
        <BottomNav />
      </MemoryRouter>
    );
    const mealLink = screen.getByText("Meal").closest("a");
    expect(mealLink).toHaveClass("text-indigo-600");

    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveClass("text-gray-500");
  });

  it("renders icons (svg elements present)", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <BottomNav />
      </MemoryRouter>
    );
    const nav = screen.getByRole("navigation", { name: /main navigation/i });
    const svgs = nav.querySelectorAll("svg");
    expect(svgs.length).toBe(5);
  });
});

// ─── Disclaimer ──────────────────────────────────────────────────────────────

describe("Disclaimer", () => {
  it("renders footer variant with medical disclaimer text", () => {
    render(<Disclaimer variant="footer" />);
    expect(
      screen.getByText(/personal research tool, not a medical device/i)
    ).toBeInTheDocument();
  });

  it("renders contextual variant with AI suggestion text", () => {
    render(<Disclaimer variant="contextual" />);
    expect(
      screen.getByText(/AI-generated suggestions/i)
    ).toBeInTheDocument();
  });
});

// ─── LoadingSpinner ──────────────────────────────────────────────────────────

describe("LoadingSpinner", () => {
  it("renders spinner element with status role", () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has accessible loading label", () => {
    render(<LoadingSpinner />);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });
});

// ─── QuickLogButton ──────────────────────────────────────────────────────────

describe("QuickLogButton", () => {
  it("renders with label", () => {
    render(<QuickLogButton label="Log Meal" onClick={() => {}} />);
    expect(screen.getByText("Log Meal")).toBeInTheDocument();
  });

  it("meets 44px min size via class", () => {
    render(<QuickLogButton label="Test" onClick={() => {}} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("min-w-[44px]");
    expect(btn).toHaveClass("min-h-[44px]");
  });
});

// ─── FodmapCheckboxes ────────────────────────────────────────────────────────

describe("FodmapCheckboxes", () => {
  const allFlags = ["F", "O", "D", "M", "P"] as const;

  it("renders all 5 FODMAP options", () => {
    render(<FodmapCheckboxes selected={[]} onChange={() => {}} />);
    for (const flag of allFlags) {
      expect(screen.getByText(flag)).toBeInTheDocument();
    }
  });

  it("shows checked state for pre-selected values", () => {
    render(<FodmapCheckboxes selected={["F", "D"]} onChange={() => {}} />);
    const fCheckbox = screen.getByRole("checkbox", { name: /fermentable/i });
    const dCheckbox = screen.getByRole("checkbox", { name: /disaccharides/i });
    expect(fCheckbox).toBeChecked();
    expect(dCheckbox).toBeChecked();
  });

  it("shows unchecked for empty selection", () => {
    render(<FodmapCheckboxes selected={[]} onChange={() => {}} />);
    const checkboxes = screen.getAllByRole("checkbox");
    for (const cb of checkboxes) {
      expect(cb).not.toBeChecked();
    }
  });
});

// ─── BristolPicker ───────────────────────────────────────────────────────────

describe("BristolPicker", () => {
  it("renders all 7 options", () => {
    render(<BristolPicker value={null} onChange={() => {}} />);
    for (let i = 1; i <= 7; i++) {
      expect(
        screen.getByRole("button", { name: new RegExp(`Type ${i}`) })
      ).toBeInTheDocument();
    }
  });

  it("highlights selected value", () => {
    render(<BristolPicker value={4} onChange={() => {}} />);
    const btn = screen.getByRole("button", { name: /Type 4/i });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).toHaveClass("border-indigo-600");
  });

  it("shows nothing selected for null value", () => {
    render(<BristolPicker value={null} onChange={() => {}} />);
    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect(btn).toHaveAttribute("aria-pressed", "false");
    }
  });
});

// ─── SeveritySlider ──────────────────────────────────────────────────────────

describe("SeveritySlider", () => {
  it("renders with label", () => {
    render(<SeveritySlider label="Bloating" value={5} onChange={() => {}} />);
    expect(screen.getByText("Bloating")).toBeInTheDocument();
  });

  it("displays current value 0", () => {
    render(<SeveritySlider label="Test" value={0} onChange={() => {}} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuenow", "0");
  });

  it("displays current value 5", () => {
    render(<SeveritySlider label="Test" value={5} onChange={() => {}} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuenow", "5");
  });

  it("displays current value 10", () => {
    render(<SeveritySlider label="Test" value={10} onChange={() => {}} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuenow", "10");
  });

  it("shows min/max labels", () => {
    render(<SeveritySlider label="Test" value={5} onChange={() => {}} />);
    // min=0 and max=10 shown as text
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "10");
  });
});

// ─── ConfidenceBadge ─────────────────────────────────────────────────────────

describe("ConfidenceBadge", () => {
  it("renders Low label with correct colour", () => {
    render(<ConfidenceBadge score={0.2} label="Low" />);
    const badge = screen.getByText(/Low/);
    expect(badge).toHaveClass("bg-gray-100");
  });

  it("renders Moderate label with correct colour", () => {
    render(<ConfidenceBadge score={0.5} label="Moderate" />);
    const badge = screen.getByText(/Moderate/);
    expect(badge).toHaveClass("bg-amber-50");
  });

  it("renders High label with correct colour", () => {
    render(<ConfidenceBadge score={0.75} label="High" />);
    const badge = screen.getByText(/High/);
    expect(badge).toHaveClass("bg-blue-50");
  });

  it("renders Very High label with correct colour", () => {
    render(<ConfidenceBadge score={0.9} label="Very High" />);
    const badge = screen.getByText(/Very High/);
    expect(badge).toHaveClass("bg-emerald-50");
  });
});

// ─── HypothesisCard ──────────────────────────────────────────────────────────

describe("HypothesisCard", () => {
  const fullHypothesis: Hypothesis = {
    trigger_name: "Garlic",
    fodmap_category: "F",
    confidence_score: 0.72,
    confidence_label: "High",
    direction: "worsens",
    symptom_pattern: "Bloating 6-12h after meals with garlic",
    supporting_events: 8,
    contradicting_events: 2,
    notes: "Dose-dependent response observed",
  };

  it("renders trigger name", () => {
    render(<HypothesisCard hypothesis={fullHypothesis} />);
    expect(screen.getByText("Garlic")).toBeInTheDocument();
  });

  it("renders FODMAP category", () => {
    render(<HypothesisCard hypothesis={fullHypothesis} />);
    expect(screen.getByText(/FODMAP: F/)).toBeInTheDocument();
  });

  it("renders confidence score", () => {
    render(<HypothesisCard hypothesis={fullHypothesis} />);
    expect(screen.getByText(/0\.72/)).toBeInTheDocument();
  });

  it("renders direction", () => {
    render(<HypothesisCard hypothesis={fullHypothesis} />);
    expect(screen.getByText(/worsens/)).toBeInTheDocument();
  });

  it("renders supporting and contradicting counts", () => {
    render(<HypothesisCard hypothesis={fullHypothesis} />);
    expect(screen.getByText(/8 supporting/)).toBeInTheDocument();
    expect(screen.getByText(/2 contradicting/)).toBeInTheDocument();
  });

  it("renders notes when present", () => {
    render(<HypothesisCard hypothesis={fullHypothesis} />);
    expect(screen.getByText("Dose-dependent response observed")).toBeInTheDocument();
  });

  it("handles missing optional notes", () => {
    const noNotes: Hypothesis = { ...fullHypothesis, notes: undefined };
    render(<HypothesisCard hypothesis={noNotes} />);
    expect(screen.getByText("Garlic")).toBeInTheDocument();
    expect(screen.queryByText("Dose-dependent response observed")).not.toBeInTheDocument();
  });
});

// ─── LogEntryCard ────────────────────────────────────────────────────────────

describe("LogEntryCard", () => {
  it("renders meal entry with description and FODMAP flags", () => {
    const meal: MealLog = {
      id: "01H1",
      logged_at: "2024-01-15T12:00:00Z",
      meal_type: "lunch",
      description: "Pasta with garlic bread",
      fodmap_flags: ["F", "O"],
      ingredients: [],
      fodmap_detail: {},
      portion_size: "medium",
      eating_speed: "normal",
      scan_used: 0,
    };
    render(<LogEntryCard entry={{ type: "meal", data: meal }} />);
    expect(screen.getByText("Meal")).toBeInTheDocument();
    expect(screen.getByText("Pasta with garlic bread")).toBeInTheDocument();
    expect(screen.getByText(/FODMAP: F, O/)).toBeInTheDocument();
  });

  it("renders stool entry with Bristol type", () => {
    const stool: StoolLog = {
      id: "01H2",
      logged_at: "2024-01-15T08:00:00Z",
      bristol_type: 5,
      urgency: 1,
      pain_score: 3,
      blood: 0,
      notes: null,
    };
    render(<LogEntryCard entry={{ type: "stool", data: stool }} />);
    expect(screen.getByText("Stool")).toBeInTheDocument();
    expect(screen.getByText("Bristol 5")).toBeInTheDocument();
    expect(screen.getByText("Pain: 3/10")).toBeInTheDocument();
  });

  it("renders context entry with stress and sleep", () => {
    const context: ContextLog = {
      id: "01H3",
      logged_at: "2024-01-15T22:00:00Z",
      stress_score: 7,
      sleep_hours: 6.5,
      sleep_quality: 3,
      water_litres: 2.0,
      exercise_type: "walk",
      exercise_duration: 30,
      caffeine_mg: 200,
      alcohol_units: 0,
      medications: null,
      menstrual_phase: null,
      notes: null,
    };
    render(<LogEntryCard entry={{ type: "context", data: context }} />);
    expect(screen.getByText("Context")).toBeInTheDocument();
    expect(screen.getByText(/Stress: 7\/10/)).toBeInTheDocument();
    expect(screen.getByText(/Sleep: 6\.5h/)).toBeInTheDocument();
  });

  it("renders symptom entry with overall score", () => {
    const symptom: SymptomLog = {
      id: "01H4",
      logged_at: "2024-01-15T14:00:00Z",
      bloating: 6,
      cramping: 4,
      nausea: 2,
      urgency: 5,
      fatigue: 3,
      overall: 7,
      notes: null,
    };
    render(<LogEntryCard entry={{ type: "symptom", data: symptom }} />);
    expect(screen.getByText("Symptom")).toBeInTheDocument();
    expect(screen.getByText("Overall: 7/10")).toBeInTheDocument();
  });
});

// ─── IngredientBreakdown ─────────────────────────────────────────────────────

describe("IngredientBreakdown", () => {
  const scan: ScanResponse = {
    description: "Pasta dish with garlic and onion",
    ingredients: ["pasta", "garlic", "onion", "olive oil", "parmesan"],
    fodmap_flags: ["F", "O"],
    fodmap_detail: { F: ["garlic", "onion"], O: ["garlic"] },
    confidence: "high",
    notes: "Garlic is dose-dependent",
  };

  it("renders ingredient count in collapsed state", () => {
    render(<IngredientBreakdown scan={scan} />);
    expect(screen.getByText(/5 ingredients/)).toBeInTheDocument();
  });

  it("expands to show ingredient list on click", async () => {
    const user = userEvent.setup();
    render(<IngredientBreakdown scan={scan} />);

    // Initially collapsed — ingredients not visible
    expect(screen.queryByText("pasta")).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getByRole("button", { name: /scan results/i }));

    // Now ingredients visible (garlic appears in both ingredient list and FODMAP detail)
    expect(screen.getByText("pasta")).toBeInTheDocument();
    expect(screen.getAllByText("garlic").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("onion").length).toBeGreaterThanOrEqual(1);
  });

  it("shows FODMAP detail when expanded", async () => {
    const user = userEvent.setup();
    render(<IngredientBreakdown scan={scan} />);

    await user.click(screen.getByRole("button", { name: /scan results/i }));

    expect(screen.getByText(/F \(Fructans\)/)).toBeInTheDocument();
    expect(screen.getByText(/garlic, onion/)).toBeInTheDocument();
  });

  it("collapses on second click", async () => {
    const user = userEvent.setup();
    render(<IngredientBreakdown scan={scan} />);

    const toggle = screen.getByRole("button", { name: /scan results/i });
    await user.click(toggle); // expand
    expect(screen.getByText("pasta")).toBeInTheDocument();

    await user.click(toggle); // collapse
    expect(screen.queryByText("pasta")).not.toBeInTheDocument();
  });
});
