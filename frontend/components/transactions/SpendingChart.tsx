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

// Ultra-muted chart palette - earthy tones
const colorPalette = [
  { light: "#7B8A9A", dark: "#6B8CAE" }, // Slate blue
  { light: "#7B9A85", dark: "#6B9679" }, // Sage green
  { light: "#9A8A9A", dark: "#9B8AAE" }, // Dusty purple
  { light: "#B39A6B", dark: "#B8956B" }, // Muted gold
  { light: "#B88A9A", dark: "#B87B96" }, // Dusty rose
  { light: "#7B9A8A", dark: "#6B9B8A" }, // Sea foam
  { light: "#B88A7B", dark: "#B87676" }, // Terra cotta
  { light: "#8B8684", dark: "#8B8684" }, // Warm gray
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
    return isSelected ? (isDark ? "#E6EAF0" : "#5A5550") : baseColor;
  };

  // Custom tooltip styling
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryData; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#FDFCFA] dark:bg-[#2a2a2a] border border-[#D8D5D0] dark:border-[#363636] rounded-lg shadow-xl p-3">
          <p className="font-medium text-[#2D2A27] dark:text-[#E6EAF0]">{payload[0].payload.name}</p>
          <p className="text-lg font-semibold text-[#2D2A27] dark:text-[#E6EAF0]">
            ${Math.abs(payload[0].value).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (categories.length === 0) {
    return (
      <div className="w-full h-80 bg-[#F5F4F0] dark:bg-[#19191a] rounded-lg border border-[#D8D5D0] dark:border-[#363636] flex items-center justify-center shadow-sm">
        <p className="text-[#8A837C] dark:text-[#938a87]">No spending data for this month</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F5F4F0] dark:bg-[#19191a] rounded-lg border border-[#D8D5D0] dark:border-[#363636] p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-[#2D2A27] dark:text-[#E6EAF0]">
        Spending by Category
      </h2>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={categories}
            margin={{ top: 10, right: 10, bottom: 60, left: 10 }}
            onClick={(data) => {
              if (!onSelectCategory || !data || !data.activeLabel) return;
              handleClick(data.activeLabel);
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "#363636" : "#D8D5D0"}
              opacity={0.5}
            />
            <XAxis
              dataKey="name"
              angle={0}
              textAnchor="middle"
              height={80}
              tick={{ fill: isDark ? "#E6EAF0" : "#2D2A27", fontSize: 13, fontWeight: 500 }}
              interval={0}
            />
            <YAxis
              tick={{ fill: isDark ? "#b0a8a5" : "#6B645D", fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "#2a2a2a" : "#E8E6E1" }} />

            <Bar
              dataKey="total"
              cursor={onSelectCategory ? "pointer" : "default"}
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
          <p className="text-sm text-[#6B645D] dark:text-[#938a87]">
            Filtered by: <span className="font-semibold text-[#2D2A27] dark:text-[#E6EAF0]">{selectedCategory}</span>
            <button
              onClick={() => onSelectCategory?.(undefined)}
              className="ml-2 text-xs text-[#8A837C] hover:text-[#6B8CAE] dark:text-[#605e5e] dark:hover:text-[#7A9FBF] underline"
            >
              Clear filter
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
