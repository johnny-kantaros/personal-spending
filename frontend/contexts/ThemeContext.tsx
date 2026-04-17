"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  effectiveTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getEffectiveTheme(theme: Theme): "light" | "dark" {
  if (theme === "auto") {
    // Auto mode: check time (8pm-6am = dark)
    const hour = new Date().getHours();
    return hour >= 20 || hour < 6 ? "dark" : "light";
  }
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("auto");
  const [mounted, setMounted] = useState(false);

  // Get the actual theme being displayed
  const effectiveTheme = getEffectiveTheme(theme);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem("theme") as Theme) || "auto";
    setTheme(savedTheme);

    // Apply initial theme to document
    const effective = getEffectiveTheme(savedTheme);
    if (effective === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Update theme when it changes or check time every minute for auto mode
  useEffect(() => {
    if (!mounted) return;

    const effective = getEffectiveTheme(theme);

    if (effective === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // If in auto mode, check every minute for time changes
    if (theme === "auto") {
      const interval = setInterval(() => {
        const newEffective = getEffectiveTheme("auto");
        const currentlyDark = document.documentElement.classList.contains("dark");

        if (newEffective === "dark" && !currentlyDark) {
          document.documentElement.classList.add("dark");
        } else if (newEffective === "light" && currentlyDark) {
          document.documentElement.classList.remove("dark");
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    // Cycle through: auto -> light -> dark -> auto
    const newTheme = theme === "auto" ? "light" : theme === "light" ? "dark" : "auto";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    // Immediately apply the theme to the DOM
    const effective = getEffectiveTheme(newTheme);
    if (effective === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    console.log("Theme toggled to:", newTheme, "Effective theme:", effective);
    console.log("HTML has dark class:", document.documentElement.classList.contains("dark"));
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
