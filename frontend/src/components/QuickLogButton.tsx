import React from "react";

interface QuickLogButtonProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function QuickLogButton({
  label,
  icon,
  onClick,
  disabled = false,
  className = "",
}: QuickLogButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[44px] min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-white font-medium shadow-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
