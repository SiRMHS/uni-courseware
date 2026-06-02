"use client";

import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

const themeCycle = ["default-light", "default-dark", "warm-amber", "forest-green", "ocean-blue"];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const idx = themeCycle.indexOf(theme);
    const next = themeCycle[(idx + 1) % themeCycle.length];
    setTheme(next);
  };

  return (
    <Button variant="outline" size="icon" className="rounded-xl" onClick={cycleTheme}>
      <Palette className="h-4 w-4" />
    </Button>
  );
}
