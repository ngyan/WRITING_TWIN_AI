export const colors = {
  primary: {
    50:  "#F0F1FF",
    500: "#4F46E5",
    600: "#3F37C9",
    700: "#312AA8",
  },
  accent: {
    500: "#F59E0B",
    600: "#D97706",
  },
  neutral: {
    0:   "#FFFFFF",
    50:  "#FAFAFB",
    100: "#F4F5F7",
    200: "#E8EAED",
    400: "#A1A5AE",
    500: "#6B7280",
    700: "#374151",
    800: "#1F2937",
    900: "#0F172A",
  },
  success: "#10B981",
  error:   "#EF4444",
  warning: "#F59E0B",
} as const;

export const tones = {
  casual:       { label: "Casual",       color: "#06B6D4" },
  professional: { label: "Professional", color: "#4F46E5" },
  executive:    { label: "Executive",    color: "#0F172A" },
  friendly:     { label: "Friendly",     color: "#F59E0B" },
  direct:       { label: "Direct",       color: "#DC2626" },
  diplomatic:   { label: "Diplomatic",   color: "#7C3AED" },
} as const;
