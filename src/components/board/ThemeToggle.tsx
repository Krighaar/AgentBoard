"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

const THEME_ICONS: Record<string, string> = {
  light: "\u2600",
  dark: "\uD83C\uDF19",
  system: "\uD83D\uDCBB",
};

const THEME_LABELS: Record<string, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={cycleTheme}
      title={`Theme: ${THEME_LABELS[theme]}`}
    >
      {THEME_ICONS[theme]}
    </Button>
  );
}
