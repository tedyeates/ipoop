interface DisclaimerProps {
  variant?: "footer" | "contextual";
}

export default function Disclaimer({ variant = "footer" }: DisclaimerProps) {
  if (variant === "contextual") {
    return (
      <p className="text-xs text-gray-500 italic mt-2">
        Results are AI-generated suggestions and should not replace professional
        medical advice.
      </p>
    );
  }

  return (
    <footer className="px-4 py-3 text-center text-xs text-gray-400">
      This app is a personal research tool, not a medical device. AI outputs are
      suggestions, not clinical diagnoses.
    </footer>
  );
}
