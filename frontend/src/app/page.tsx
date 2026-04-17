"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getConnectedItems, getTransactions, getTransactionsSummary } from "@/lib/plaid";
import TransactionList from "@/components/transactions/TransactionList";
import MonthSelector from "@/components/transactions/MonthSelector";
import BankSelector from "@/components/transactions/BankSelector";
import AddBankModal from "@/components/AddBankModal";
import { Transaction } from "@/types/transactions";

// Dynamically import components that use theme context to avoid SSR issues
const SpendingChart = dynamic(() => import("@/components/transactions/SpendingChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
      <p className="text-gray-500 dark:text-gray-400">Loading chart...</p>
    </div>
  ),
});

const ThemeToggle = dynamic(() => import("@/components/ThemeToggle"), {
  ssr: false,
});

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    ? allTransactions.filter((t) => t.simplified_category === selectedCategory)
    : allTransactions;

  // Sort categories by total amount (highest to lowest) - create new array to avoid mutating readonly
  const chartData = [...(summary.find((s) => s.month === selectedMonth)?.categories || [])]
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

  // Handle category update
  const handleCategoryUpdate = (transactionId: string, newCategory: string) => {
    // Update local state
    setAllTransactions((prev) =>
      prev.map((t) =>
        t.transaction_id === transactionId ? { ...t, simplified_category: newCategory } : t
      )
    );

    // Refetch summary to update chart
    (async () => {
      try {
        const data: MonthlySummary[] = await getTransactionsSummary(selectedBanks);
        setSummary(data);
      } catch (err) {
        console.error(err);
      }
    })();
  };

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

      // Update months list after sync
      const monthsAvailable = data.map((d) => d.month);
      setMonths(monthsAvailable);

      // Set selected month if not already set
      if (!selectedMonth && monthsAvailable.length) {
        setSelectedMonth(monthsAvailable[monthsAvailable.length - 1]);
      }

      const txs: Transaction[] = await getTransactions(selectedBanks, selectedMonth);
      setAllTransactions(txs.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)));
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#E8E6E1] dark:bg-[#0a0a0a] transition-colors duration-200">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-[#2D2A27] dark:text-[#E6EAF0]">
                Spending Tracker
              </h1>
              <p className="text-sm text-[#6B645D] dark:text-[#b8b0ad] mt-1">
                Track and analyze your spending across all accounts
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleSyncTransactions}
              disabled={syncing}
              className="px-4 py-2 bg-[#6B8CAE] hover:bg-[#5A7B9D] dark:bg-[#7A9FBF] dark:hover:bg-[#8BADC9] disabled:bg-[#D8D5D0] dark:disabled:bg-[#363636] text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed shadow-sm"
            >
              {syncing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Syncing...
                </span>
              ) : (
                "Sync Transactions"
              )}
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 border border-[#D8D5D0] dark:border-[#363636] hover:bg-[#F5F4F0] dark:hover:bg-[#161A21] text-[#2D2A27] dark:text-[#E6EAF0] rounded-lg font-medium transition-colors"
            >
              + Add Bank
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-6 bg-[#F5F4F0] dark:bg-[#19191a] p-5 rounded-lg border border-[#D8D5D0] dark:border-[#363636] transition-colors duration-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <BankSelector selectedBanks={selectedBanks} banks={availableBanks} onChange={setSelectedBanks} />
            <MonthSelector months={months} selectedMonth={selectedMonth} onChange={setSelectedMonth} />
          </div>
        </div>

        {/* Spending Chart */}
        <div className="mb-6">
          <SpendingChart
            categories={chartData}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-[#4F8CFF] mx-auto mb-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-[#6B645D] dark:text-[#938a87]">Loading transactions...</p>
            </div>
          </div>
        ) : (
          <TransactionList transactions={transactions} onCategoryUpdate={handleCategoryUpdate} />
        )}

        {/* Add Bank Modal */}
        <AddBankModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onBankAdded={(banks) => setAvailableBanks(banks)}
        />
      </div>
    </main>
  );
}
