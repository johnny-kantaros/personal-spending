"use client";
import { Transaction } from "../../types/transactions";
import TransactionCard from "./TransactionCard";

interface Props {
  transactions: Transaction[];
  onCategoryUpdate?: (transactionId: string, newCategory: string) => void;
}

export default function TransactionList({ transactions, onCategoryUpdate }: Props) {
  if (!transactions.length) {
    return (
      <div className="bg-[#F5F4F0] dark:bg-[#19191a] rounded-lg border border-[#D8D5D0] dark:border-[#363636] p-12 text-center shadow-sm">
        <svg
          className="w-16 h-16 mx-auto text-[#D8D5D0] dark:text-[#363636] mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-[#6B645D] dark:text-[#938a87] text-lg">No transactions to display</p>
        <p className="text-[#8A837C] dark:text-[#605e5e] text-sm mt-2">
          Try adjusting your filters or syncing your accounts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#2D2A27] dark:text-[#E6EAF0]">
          Transactions
        </h2>
        <span className="text-sm text-[#8A837C] dark:text-[#b0a8a5]">
          {transactions.length} {transactions.length === 1 ? "transaction" : "transactions"}
        </span>
      </div>
      <div className="space-y-1">
        {transactions.map((tx) => (
          <TransactionCard key={tx.transaction_id} tx={tx} onCategoryUpdate={onCategoryUpdate} />
        ))}
      </div>
    </div>
  );
}
