"use client";

import { useState, useEffect } from "react";
import { getConnectedItems, getTransactions } from "@/lib/plaid";

type Transaction = {
  date: string;
  name: string;
  amount: number;
};

type TransactionsResponse = {
  [env_name: string]: Transaction[] | { error: any };
};

type BankItem = {
  id: string;
  institution_name: string;
};

export default function TransactionsPage() {
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableBanks, setAvailableBanks] = useState<BankItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const items = await getConnectedItems();
        setAvailableBanks(items);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const toggleBank = (env_name: string) => {
    setSelectedBanks((prev) =>
      prev.includes(env_name) ? prev.filter((b) => b !== env_name) : [...prev, env_name]
    );
  };

  const handleFetchTransactions = async () => {
    setLoading(true);
    setTransactions(null);
    try {
      const data = await getTransactions(selectedBanks);
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-16 bg-gray-50 flex flex-col items-center text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Select Banks to View Transactions</h1>

      <div className="mb-6 w-full max-w-md bg-white rounded-lg shadow p-4">
        <p className="mb-2 font-medium text-gray-700">
          Which financial institutions would you like to see transactions from?
        </p>
        <div className="flex flex-col space-y-2">
          {availableBanks.length === 0 ? (
            <p className="text-gray-400">No connected banks found.</p>
          ) : (
            availableBanks.map((bank) => (
              <label
                key={bank.id}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedBanks.includes(bank.id)}
                  onChange={() => toggleBank(bank.id)}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-gray-800">{bank.institution_name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <button
        onClick={handleFetchTransactions}
        disabled={loading || availableBanks.length === 0}
        className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow transition-colors mt-4"
      >
        {loading ? "Fetching..." : "Get Transactions"}
      </button>

      {transactions && (
        <div className="mt-8 w-full max-w-3xl space-y-6">
          {Object.entries(transactions).map(([id, trans]) => {
            const bank = availableBanks.find((b) => b.id === id);
            const displayName = bank ? bank.institution_name : id;

            return (
              <div
                key={id}
                className="bg-white rounded-lg shadow p-4 transition hover:shadow-lg"
              >
                <h2 className="text-xl font-semibold mb-3">{displayName}</h2>
                {"error" in (trans as any) ? (
                  <p className="text-red-600">Error: {(trans as any).error}</p>
                ) : (trans as any).length === 0 ? (
                  <p className="text-gray-500">No recent transactions found.</p>
                ) : (
                  <ul className="space-y-2">
                    {(trans as any).map((t: any, i: number) => (
                      <li
                        key={i}
                        className="flex items-center justify-between border-b border-gray-200 pb-2"
                      >
                        <span className="flex-1 truncate">{t.name}</span>
                        <span className="w-24 text-right font-medium text-gray-800">
                          ${t.amount.toFixed(2)}
                        </span>
                        <span className="w-28 text-right text-gray-500">{t.date}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
