import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import SettingsPage from "./SettingsPage";

vi.mock("../lib/api", () => ({
  exportData: vi.fn(),
}));

import { exportData } from "../lib/api";
const mockExportData = vi.mocked(exportData);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SettingsPage", () => {
  it("renders heading and export section", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Data Export")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export Data" }),
    ).toBeInTheDocument();
  });

  it("renders JSON and CSV radio options with JSON selected by default", () => {
    render(<SettingsPage />);
    const jsonRadio = screen.getByLabelText("JSON") as HTMLInputElement;
    const csvRadio = screen.getByLabelText("CSV") as HTMLInputElement;
    expect(jsonRadio.checked).toBe(true);
    expect(csvRadio.checked).toBe(false);
  });

  it("switches format when CSV is selected", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    const csvRadio = screen.getByLabelText("CSV");
    await user.click(csvRadio);
    expect((csvRadio as HTMLInputElement).checked).toBe(true);
    expect(
      screen.getByText("One CSV file per table with header rows."),
    ).toBeInTheDocument();
  });

  it("triggers export and initiates download on success", async () => {
    const user = userEvent.setup();
    const mockBlob = new Blob(["test"], { type: "application/json" });
    mockExportData.mockResolvedValueOnce({
      blob: mockBlob,
      filename: "ipoop-export-json-2025-01-15.json",
    });

    render(<SettingsPage />);
    await user.click(screen.getByRole("button", { name: "Export Data" }));

    expect(mockExportData).toHaveBeenCalledWith("json");
    expect(
      await screen.findByText("Exported as ipoop-export-json-2025-01-15.json"),
    ).toBeInTheDocument();
  });

  it("shows error message when export fails", async () => {
    const user = userEvent.setup();
    mockExportData.mockRejectedValueOnce(new Error("Network error"));

    render(<SettingsPage />);
    await user.click(screen.getByRole("button", { name: "Export Data" }));

    expect(
      await screen.findByText("Export failed. Please try again."),
    ).toBeInTheDocument();
  });

  it("exports CSV when CSV format is selected", async () => {
    const user = userEvent.setup();
    const mockBlob = new Blob(["id,logged_at"], { type: "text/csv" });
    mockExportData.mockResolvedValueOnce({
      blob: mockBlob,
      filename: "ipoop-export-csv-2025-01-15.csv",
    });

    render(<SettingsPage />);
    await user.click(screen.getByLabelText("CSV"));
    await user.click(screen.getByRole("button", { name: "Export Data" }));

    expect(mockExportData).toHaveBeenCalledWith("csv");
  });

  it("disables button while exporting", async () => {
    const user = userEvent.setup();
    let resolveExport: (v: { blob: Blob; filename: string }) => void;
    mockExportData.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveExport = resolve;
        }),
    );

    render(<SettingsPage />);
    await user.click(screen.getByRole("button", { name: "Export Data" }));

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText("Exporting…")).toBeInTheDocument();

    // Resolve to clean up
    resolveExport!({
      blob: new Blob(["test"]),
      filename: "ipoop-export-json-2025-01-15.json",
    });
    await screen.findByText(/Exported as/);
    expect(button).not.toBeDisabled();
  });
});
