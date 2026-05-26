import { useState } from "react";
import { exportData } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";

type ExportFormat = "json" | "csv";

export default function SettingsPage() {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const { blob, filename } = await exportData(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess(`Exported as ${filename}`);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      {/* Data Export Section */}
      <section className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Data Export</h2>
        <p className="text-sm text-gray-600">
          Export all your logged data (meals, stools, context, symptoms, and
          hypotheses) in your preferred format.
        </p>

        {/* Format Selection */}
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">
            Export format
          </legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="export-format"
                value="json"
                checked={format === "json"}
                onChange={() => setFormat("json")}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">JSON</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="export-format"
                value="csv"
                checked={format === "csv"}
                onChange={() => setFormat("csv")}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">CSV</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {format === "json"
              ? "Single file with all tables as arrays."
              : "One CSV file per table with header rows."}
          </p>
        </fieldset>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed active:bg-indigo-700 transition-colors"
        >
          {exporting ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Exporting…</span>
            </>
          ) : (
            <span>Export Data</span>
          )}
        </button>

        {/* Feedback Messages */}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-600" role="status">
            {success}
          </p>
        )}
      </section>
    </div>
  );
}
