type BristolType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const BRISTOL_DESCRIPTIONS: Record<BristolType, string> = {
  1: "Hard lumps",
  2: "Lumpy sausage",
  3: "Cracked sausage",
  4: "Smooth snake",
  5: "Soft blobs",
  6: "Mushy",
  7: "Watery",
};

interface BristolPickerProps {
  value: BristolType | null;
  onChange: (type: BristolType) => void;
  disabled?: boolean;
}

export function BristolPicker({
  value,
  onChange,
  disabled = false,
}: BristolPickerProps) {
  const types: BristolType[] = [1, 2, 3, 4, 5, 6, 7];

  return (
    <fieldset className="space-y-1" disabled={disabled}>
      <legend className="text-sm font-medium text-gray-700 mb-2">
        Bristol Scale
      </legend>
      <div className="grid grid-cols-7 gap-1">
        {types.map((type) => {
          const selected = value === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              disabled={disabled}
              aria-label={`Type ${type}: ${BRISTOL_DESCRIPTIONS[type]}`}
              aria-pressed={selected}
              className={`min-w-[44px] min-h-[44px] flex flex-col items-center justify-center rounded-lg border-2 p-1 transition-colors ${
                selected
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="text-lg font-bold">{type}</span>
              <span className="text-[10px] leading-tight text-center">
                {BRISTOL_DESCRIPTIONS[type]}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
