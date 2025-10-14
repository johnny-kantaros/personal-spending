"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CategoryData {
  name: string;
  total: number;
}

interface Props {
  categories: CategoryData[];
  selectedCategory?: string;
  onSelectCategory?: (category?: string) => void;
}

export default function SpendingChart({ categories, selectedCategory, onSelectCategory }: Props) {
  const handleClick = (categoryName: string) => {
    if (!onSelectCategory) return;
    if (selectedCategory === categoryName) {
      onSelectCategory(undefined);
    } else {
      onSelectCategory(categoryName);
    }
  };

  return (
    <div className="w-full h-64 bg-white p-4 rounded-lg shadow">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={categories} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />

            <Bar
            dataKey="total"
            fill="#4F46E5"
            cursor={onSelectCategory ? "pointer" : "default"}
            onClick={(data, index) => {
                const categoryName = data.name;
                if (categoryName) {       // <-- guard against undefined
                handleClick(categoryName);
                }
            }}
            >
            {categories.map((entry) => (
              <Cell
                key={entry.name}
                fill={selectedCategory === entry.name ? "#1D4ED8" : "#4F46E5"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
