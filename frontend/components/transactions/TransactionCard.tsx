"use client";
import { Transaction } from "../../types/transactions";

interface Props {
  tx: Transaction;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getCategoryColor() {
  // Minimalist approach - all categories same neutral styling
  return "bg-[#E8E6E1] text-[#6B645D] dark:bg-[#2a2a2a] dark:text-[#b0a8a5]";
}

export default function TransactionCard({ tx }: Props) {
  const isPositive = tx.amount < 0; // Negative amounts are income in Plaid

  return (
    <div className="bg-[#F5F4F0] dark:bg-[#19191a] rounded-lg border border-[#D8D5D0] dark:border-[#363636] p-4 transition-colors hover:bg-[#FDFCFA] dark:hover:bg-[#2a2a2a] shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Merchant Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Logo or Icon */}
          {tx.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tx.logo_url}
              alt={tx.merchant_name || tx.name}
              className="w-10 h-10 rounded-md object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-[#E8E6E1] dark:bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
              <span className="text-[#6B645D] dark:text-[#938a87] font-medium text-sm">
                {(tx.merchant_name || tx.name).charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Merchant Name & Date */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#2D2A27] dark:text-[#E6EAF0] truncate">
              {tx.merchant_name || tx.name}
            </p>
            <p className="text-sm text-[#8A837C] dark:text-[#b0a8a5]">
              {formatDate(tx.date)}
            </p>
          </div>
        </div>

        {/* Right: Amount & Category */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Category Badge */}
          {tx.primary_category && (
            <span className={`px-2 py-1 rounded-md text-xs ${getCategoryColor()} hidden sm:inline-block`}>
              {tx.primary_category.replace(/_/g, " ")}
            </span>
          )}

          {/* Amount */}
          <div className="text-right min-w-[80px]">
            <p className="text-base font-semibold text-[#2D2A27] dark:text-[#E6EAF0]">
              {isPositive ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Category Badge */}
      {tx.primary_category && (
        <div className="mt-2 sm:hidden">
          <span className={`px-2 py-1 rounded-md text-xs ${getCategoryColor()}`}>
            {tx.primary_category.replace(/_/g, " ")}
          </span>
        </div>
      )}
    </div>
  );
}
