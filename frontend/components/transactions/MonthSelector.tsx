"use client";

interface Props {
  months: string[]; // array of "YYYY-MM"
  selectedMonth?: string;
  onChange: (month: string) => void;
}

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1); // JS months 0-indexed
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

export default function MonthSelector({ months, selectedMonth, onChange }: Props) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">Select Month</label>
      <select
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={selectedMonth || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {months.length === 0 ? (
          <option value="">No months available</option>
        ) : (
          months.map((month) => (
            <option key={month} value={month}>
              {formatMonth(month)}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
