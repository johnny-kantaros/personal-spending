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
      <label className="text-sm font-medium text-[#2D2A27] dark:text-[#E6EAF0] mb-2 block">
        Select Month
      </label>
      <select
        className="w-full px-3 py-2 border border-[#D8D5D0] dark:border-[#363636] rounded-md bg-[#FDFCFA] dark:bg-[#2a2a2a] text-[#2D2A27] dark:text-[#E6EAF0] focus:outline-none focus:ring-2 focus:ring-[#6B8CAE] dark:focus:ring-[#7A9FBF] transition-all cursor-pointer hover:border-[#6B8CAE] dark:hover:border-[#7A9FBF]"
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
