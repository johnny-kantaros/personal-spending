"use client";

import { useState, useEffect } from "react";
import { getConnectedItems, getTransactions, getTransactionsSummary } from "@/lib/plaid";
import TransactionList from "@/components/transactions/TransactionList";
import SpendingChart from "@/components/transactions/SpendingChart";
import MonthSelector from "@/components/transactions/MonthSelector";
import BankSelector from "@/components/transactions/BankSelector";
import AddBankModal from "@/components/AddBankModal";
import { Transaction } from "@/types/transactions";

interface BankItem {
  id: string;
  institution_name: string;
}

interface MonthlySummary {
  month: string; // format "YYYY-MM"
  categories: { name: string; total: number }[];
  total: number;
}

export default function DashboardPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<MonthlySummary[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableBanks, setAvailableBanks] = useState<BankItem[]>([]);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch connected banks
  useEffect(() => {
    (async () => {
      try {
        const banks: BankItem[] = await getConnectedItems();
        setAvailableBanks(banks);
        setSelectedBanks(banks.map((b) => b.id));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // Fetch monthly summary
  useEffect(() => {
    if (!selectedBanks.length) return;
    (async () => {
      try {
        const data: MonthlySummary[] = await getTransactionsSummary(selectedBanks);
        setSummary(data);

        const monthsAvailable = data.map((d) => d.month);
        setMonths(monthsAvailable);

        if (!selectedMonth && monthsAvailable.length) {
          setSelectedMonth(monthsAvailable[monthsAvailable.length - 1]);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [selectedBanks]);

  // Fetch transactions when month or banks change
  useEffect(() => {
    if (!selectedMonth || !selectedBanks.length) return;
    setLoading(true);

    (async () => {
      try {
        const txs: Transaction[] = await getTransactions(selectedBanks, selectedMonth);
        setAllTransactions(txs.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedMonth, selectedBanks]);

  // Filter transactions locally by selected category
  const transactions = selectedCategory
    ? allTransactions.filter((t) => t.primary_category === selectedCategory)
    : allTransactions;

  const chartData = summary.find((s) => s.month === selectedMonth)?.categories || [];

  // Sync transactions
  const handleSyncTransactions = async () => {
    if (!availableBanks.length) return;
    setSyncing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/items/sync`, {
        method: "POST",
      });
      const result = await res.json();
      console.log("Sync result:", result);
      // After sync, refetch transactions and summary
      const data: MonthlySummary[] = await getTransactionsSummary(selectedBanks);
      setSummary(data);
      const txs: Transaction[] = await getTransactions(selectedBanks, selectedMonth);
      setAllTransactions(txs.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)));
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      {/* Top row: Connected Banks + Add Bank + Sync */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2 className="text-lg font-semibold">Connected Banks</h2>
        <div className="flex gap-2">
          <button
            onClick={handleSyncTransactions}
            disabled={syncing}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg font-medium shadow"
          >
            {syncing ? "Syncing..." : "Sync Transactions"}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg font-medium shadow"
          >
            + Add Bank
          </button>
        </div>
      </div>

      {/* Banks + month selector */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow flex flex-wrap items-center gap-4">
        <BankSelector selectedBanks={selectedBanks} banks={availableBanks} onChange={setSelectedBanks} />
        <MonthSelector months={months} selectedMonth={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Spending chart */}
      <SpendingChart
        categories={chartData}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Transaction list */}
      {loading ? (
        <p className="mt-4 text-gray-500">Loading transactions...</p>
      ) : (
        <TransactionList transactions={transactions} />
      )}

      {/* Add Bank Modal */}
      <AddBankModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onBankAdded={(banks) => setAvailableBanks(banks)}
      />
    </main>
  );
}
