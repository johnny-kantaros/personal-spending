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
    <div className="flex-1 min-w-[200px]">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
        Select Month
      </label>
      <select
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-600 transition-all cursor-pointer hover:border-slate-400 dark:hover:border-slate-600"
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
