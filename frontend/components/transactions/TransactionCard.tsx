"use client";
import { Transaction } from "../../types/transactions";

interface Props {
  tx: Transaction;
}

export default function TransactionCard({ tx }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-4 transition hover:shadow-lg">
      <div className="grid grid-cols-[2fr_1fr_1fr] items-center gap-4">
        <span className="truncate font-semibold">{tx.merchant_name || tx.name}</span>
        <span className="text-right font-medium">${tx.amount.toFixed(2)}</span>
        {tx.primary_category ? (
          <span className="px-2 py-1 bg-gray-200 rounded text-sm text-center">
            {tx.primary_category}
          </span>
        ) : <span></span>}
      </div>
      <span className="block mt-1 text-gray-500 text-sm">{tx.date}</span>
    </div>
  );
}
