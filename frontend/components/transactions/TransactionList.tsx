"use client";
import { Transaction } from "../../types/transactions";
import TransactionCard from "./TransactionCard";

interface Props {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: Props) {
  if (!transactions.length) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-12 text-center">
        <svg
          className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4"
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
        <p className="text-slate-500 dark:text-slate-400 text-lg">No transactions to display</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
          Try adjusting your filters or syncing your accounts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          Transactions
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {transactions.length} {transactions.length === 1 ? "transaction" : "transactions"}
        </span>
      </div>
      <div className="space-y-1">
        {transactions.map((tx) => (
          <TransactionCard key={tx.transaction_id} tx={tx} />
        ))}
      </div>
    </div>
  );
}
