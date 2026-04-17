"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-[#D8D5D0] dark:border-[#363636] hover:bg-[#F5F4F0] dark:hover:bg-[#2a2a2a] transition-colors relative group"
      aria-label="Toggle theme"
      title={`Current: ${theme === "auto" ? "Auto (8pm-6am)" : theme === "light" ? "Light" : "Dark"}`}
    >
      {theme === "auto" ? (
        // Auto icon (clock)
        <svg
          className="w-5 h-5 text-[#6B645D] dark:text-[#938a87]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ) : theme === "light" ? (
        // Sun icon
        <svg
          className="w-5 h-5 text-[#6B645D] dark:text-[#938a87]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon
        <svg
          className="w-5 h-5 text-[#6B645D] dark:text-[#938a87]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}

      {/* Tooltip */}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#2D2A27] dark:bg-[#E6EAF0] text-white dark:text-[#2D2A27] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {theme === "auto" ? "Auto" : theme === "light" ? "Light" : "Dark"}
      </span>
    </button>
  );
}
