"use client";
import { useState } from "react";
import { Transaction } from "../../types/transactions";
import { updateTransactionCategory } from "../../lib/plaid";

interface Props {
  tx: Transaction;
  onCategoryUpdate?: (transactionId: string, newCategory: string) => void;
}

const CATEGORIES = [
  "Shopping",
  "Groceries",
  "Dining & Drinks",
  "Transportation",
  "Travel",
  "Bills & Utilities",
  "Healthcare",
  "Entertainment",
  "Other",
];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getCategoryColor() {
  // Minimalist approach - all categories same neutral styling
  return "bg-[#E8E6E1] text-[#6B645D] dark:bg-[#2a2a2a] dark:text-[#b0a8a5]";
}

export default function TransactionCard({ tx, onCategoryUpdate }: Props) {
  const isPositive = tx.amount < 0; // Negative amounts are income in Plaid
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleCategoryChange = async (newCategory: string) => {
    if (newCategory === tx.simplified_category) {
      setIsEditingCategory(false);
      return;
    }

    setUpdating(true);
    try {
      await updateTransactionCategory(tx.transaction_id, newCategory);
      if (onCategoryUpdate) {
        onCategoryUpdate(tx.transaction_id, newCategory);
      }
      setIsEditingCategory(false);
    } catch (err) {
      console.error("Failed to update category:", err);
      alert("Failed to update category");
    } finally {
      setUpdating(false);
    }
  };

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
          {/* Category Badge/Selector */}
          {tx.simplified_category && (
            <div className="hidden sm:block">
              {isEditingCategory ? (
                <select
                  value={tx.simplified_category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  disabled={updating}
                  className="px-2 py-1 rounded-md text-xs bg-[#E8E6E1] text-[#6B645D] dark:bg-[#2a2a2a] dark:text-[#b0a8a5] border border-[#D8D5D0] dark:border-[#363636] focus:outline-none focus:ring-1 focus:ring-[#6B8CAE] dark:focus:ring-[#7A9FBF]"
                  onBlur={() => !updating && setIsEditingCategory(false)}
                  autoFocus
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setIsEditingCategory(true)}
                  className={`px-2 py-1 rounded-md text-xs ${getCategoryColor()} hover:ring-1 hover:ring-[#6B8CAE] dark:hover:ring-[#7A9FBF] transition-all`}
                >
                  {tx.simplified_category}
                </button>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="text-right min-w-[80px]">
            <p className="text-base font-semibold text-[#2D2A27] dark:text-[#E6EAF0]">
              {isPositive ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Category Badge/Selector */}
      {tx.simplified_category && (
        <div className="mt-2 sm:hidden">
          {isEditingCategory ? (
            <select
              value={tx.simplified_category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={updating}
              className="px-2 py-1 rounded-md text-xs bg-[#E8E6E1] text-[#6B645D] dark:bg-[#2a2a2a] dark:text-[#b0a8a5] border border-[#D8D5D0] dark:border-[#363636] focus:outline-none focus:ring-1 focus:ring-[#6B8CAE] dark:focus:ring-[#7A9FBF]"
              onBlur={() => !updating && setIsEditingCategory(false)}
              autoFocus
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          ) : (
            <button
              onClick={() => setIsEditingCategory(true)}
              className={`px-2 py-1 rounded-md text-xs ${getCategoryColor()} hover:ring-1 hover:ring-[#6B8CAE] dark:hover:ring-[#7A9FBF] transition-all`}
            >
              {tx.simplified_category}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
