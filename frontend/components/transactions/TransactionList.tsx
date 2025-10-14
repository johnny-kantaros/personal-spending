"use client";
import { Transaction } from "../../types/transactions";
import TransactionCard from "./TransactionCard";

interface Props {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: Props) {
  if (!transactions.length) return <p className="text-gray-500 mt-4">No transactions to display.</p>;

  return (
    <div className="mt-6 w-full max-w-3xl space-y-4">
      {transactions.map(tx => (
        <TransactionCard key={tx.transaction_id} tx={tx} />
      ))}
    </div>
  );
}
