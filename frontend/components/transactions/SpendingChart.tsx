"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTheme } from "@/contexts/ThemeContext";

interface CategoryData {
  name: string;
  total: number;
}

interface Props {
  categories: CategoryData[];
  selectedCategory?: string;
  onSelectCategory?: (category?: string) => void;
}

// Minimalist color palette - subtle slate tones with muted accents
const colorPalette = [
  { light: "#475569", dark: "#94a3b8" }, // Slate 600/400
  { light: "#64748b", dark: "#cbd5e1" }, // Slate 500/300
  { light: "#0891b2", dark: "#67e8f9" }, // Cyan 600/300
  { light: "#0d9488", dark: "#5eead4" }, // Teal 600/300
  { light: "#6b7280", dark: "#9ca3af" }, // Gray 500/400
  { light: "#059669", dark: "#6ee7b7" }, // Emerald 600/300
  { light: "#334155", dark: "#e2e8f0" }, // Slate 700/200
  { light: "#dc2626", dark: "#fca5a5" }, // Red 600/300
];

export default function SpendingChart({ categories, selectedCategory, onSelectCategory }: Props) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const handleClick = (categoryName: string) => {
    if (!onSelectCategory) return;
    if (selectedCategory === categoryName) {
      onSelectCategory(undefined);
    } else {
      onSelectCategory(categoryName);
    }
  };

  const getColor = (index: number, isSelected: boolean) => {
    const color = colorPalette[index % colorPalette.length];
    const baseColor = isDark ? color.dark : color.light;
    return isSelected ? (isDark ? "#cbd5e1" : "#334155") : baseColor;
  };

  // Custom tooltip styling
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryData; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
          <p className="font-medium text-slate-900 dark:text-slate-100">{payload[0].payload.name}</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            ${Math.abs(payload[0].value).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (categories.length === 0) {
    return (
      <div className="w-full h-80 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">No spending data for this month</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
      <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-50">
        Spending by Category
      </h2>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categories} margin={{ top: 10, right: 10, bottom: 60, left: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "#334155" : "#e2e8f0"}
              opacity={0.5}
            />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "#1e293b" : "#f8fafc" }} />

            <Bar
              dataKey="total"
              cursor={onSelectCategory ? "pointer" : "default"}
              onClick={(data) => {
                const categoryName = data.name;
                if (categoryName) {
                  handleClick(categoryName);
                }
              }}
              radius={[8, 8, 0, 0]}
            >
              {categories.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={getColor(index, selectedCategory === entry.name)}
                  opacity={selectedCategory && selectedCategory !== entry.name ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {selectedCategory && (
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Filtered by: <span className="font-semibold text-slate-900 dark:text-slate-50">{selectedCategory}</span>
            <button
              onClick={() => onSelectCategory?.(undefined)}
              className="ml-2 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 underline"
            >
              Clear filter
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
