import { useState } from "react";
import type { ScanResponse } from "../lib/types";

interface IngredientBreakdownProps {
  scan: ScanResponse;
}

const fodmapLabels: Record<string, string> = {
  F: "Fructans",
  O: "Oligosaccharides",
  D: "Disaccharides",
  M: "Monosaccharides",
  P: "Polyols",
};

export function IngredientBreakdown({ scan }: IngredientBreakdownProps) {
  const [expanded, setExpanded] = useState(false);

  const hasFodmapDetail =
    Object.keys(scan.fodmap_detail).length > 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] text-left"
      >
        <span className="text-sm font-medium text-gray-800">
          Scan Results ({scan.ingredients.length} ingredients)
        </span>
        <span className="text-gray-400 text-xs">
          {expanded ? "▲ Hide" : "▼ Show"}
        </span>
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-200 pt-2">
          {/* Description */}
          <p className="text-sm text-gray-700">{scan.description}</p>

          {/* Confidence */}
          <p className="text-xs text-gray-500">
            Confidence: <span className="font-medium">{scan.confidence}</span>
          </p>

          {/* Ingredients list */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">
              Ingredients:
            </p>
            <div className="flex flex-wrap gap-1">
              {scan.ingredients.map((ing) => (
                <span
                  key={ing}
                  className="rounded bg-white border border-gray-200 px-1.5 py-0.5 text-xs text-gray-700"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>

          {/* FODMAP breakdown */}
          {hasFodmapDetail && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">
                FODMAP Breakdown:
              </p>
              <div className="space-y-1">
                {Object.entries(scan.fodmap_detail).map(([cat, items]) => (
                  <div key={cat} className="flex items-start gap-2 text-xs">
                    <span className="shrink-0 font-medium text-gray-700 min-w-[90px]">
                      {cat} ({fodmapLabels[cat] || cat}):
                    </span>
                    <span className="text-gray-600">
                      {items.join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {scan.notes && (
            <p className="text-xs text-gray-500 italic">{scan.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
