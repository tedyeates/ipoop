type FodmapFlag = "F" | "O" | "D" | "M" | "P";

const FODMAP_LABELS: Record<FodmapFlag, string> = {
  F: "Fermentable",
  O: "Oligosaccharides",
  D: "Disaccharides",
  M: "Monosaccharides",
  P: "Polyols",
};

interface FodmapCheckboxesProps {
  selected: FodmapFlag[];
  onChange: (flags: FodmapFlag[]) => void;
  disabled?: boolean;
}

export function FodmapCheckboxes({
  selected,
  onChange,
  disabled = false,
}: FodmapCheckboxesProps) {
  function toggle(flag: FodmapFlag) {
    if (selected.includes(flag)) {
      onChange(selected.filter((f) => f !== flag));
    } else {
      onChange([...selected, flag]);
    }
  }

  return (
    <fieldset className="flex flex-wrap gap-2" disabled={disabled}>
      <legend className="sr-only">FODMAP categories</legend>
      {(Object.keys(FODMAP_LABELS) as FodmapFlag[]).map((flag) => {
        const checked = selected.includes(flag);
        return (
          <label
            key={flag}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border-2 px-3 py-2 cursor-pointer select-none transition-colors ${
              checked
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={() => toggle(flag)}
              disabled={disabled}
              aria-label={FODMAP_LABELS[flag]}
            />
            <span className="font-semibold text-lg">{flag}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
