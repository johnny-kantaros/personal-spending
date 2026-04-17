"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Transaction } from "../../types/transactions";
import { updateTransactionCategory, linkTransaction, unlinkTransaction, getLinkedPayments, setVendorRule, excludeTransaction } from "../../lib/plaid";

interface Props {
  tx: Transaction;
  allTransactions?: Transaction[];
  onCategoryUpdate?: (transactionId: string, newCategory: string) => void;
  onLink?: () => void;
}

const CATEGORIES = [
  "Shopping",
  "Groceries",
  "Dining & Drinks",
  "Transportation",
  "Travel",
  "Bills & Utilities",
  "Personal Care",
  "Gym & Activities",
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

export default function TransactionCard({ tx, allTransactions = [], onCategoryUpdate, onLink }: Props) {
  // In Plaid API: positive amount = spending, negative = income
  // But we display it flipped: spending shows with -, income shows with +
  const isIncome = tx.amount < 0;
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkedPayments, setLinkedPayments] = useState<Transaction[]>([]);
  const [showLinkedPayments, setShowLinkedPayments] = useState(false);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const [showVendorRuleModal, setShowVendorRuleModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  // Fetch linked payments on mount for spending transactions (positive amounts in DB)
  useEffect(() => {
    if (tx.amount > 0) { // Spending transactions
      setLoadingLinked(true);
      getLinkedPayments(tx.transaction_id)
        .then(setLinkedPayments)
        .catch(console.error)
        .finally(() => setLoadingLinked(false));
    }
  }, [tx.transaction_id, tx.amount]);

  // Calculate adjusted amount
  // tx.amount = 172 (spending), linked payment = -100 (income received)
  // We want: 172 - 100 = 72
  const linkedTotal = linkedPayments.reduce((sum, p) => sum + Math.abs(p.amount), 0);
  const adjustedAmount = tx.amount - linkedTotal;
  const hasLinkedPayments = linkedPayments.length > 0;

  const handleCategoryChange = async (newCategory: string) => {
    if (newCategory === tx.simplified_category) {
      setIsEditingCategory(false);
      return;
    }

    // Handle exclude option
    if (newCategory === "__EXCLUDE__") {
      setIsEditingCategory(false);
      handleExclude();
      return;
    }

    setIsEditingCategory(false);

    // Ask about vendor rule FIRST, before updating
    setPendingCategory(newCategory);
    setShowVendorRuleModal(true);
  };

  const handleSetVendorRuleYes = async () => {
    if (!pendingCategory) return;

    setUpdating(true);
    setShowVendorRuleModal(false);

    try {
      // Update this transaction first
      await updateTransactionCategory(tx.transaction_id, pendingCategory);

      // Then set the vendor rule
      const result = await setVendorRule(tx.transaction_id, pendingCategory);
      alert(`✓ Updated ${result.transactions_updated} transactions from "${result.vendor_name}"`);

      if (onCategoryUpdate) {
        onCategoryUpdate(tx.transaction_id, pendingCategory);
      }
      if (onLink) {
        onLink(); // Refetch to show updated categories
      }
    } catch (err) {
      console.error("Failed to set vendor rule:", err);
      alert("Failed to set vendor rule");
    } finally {
      setUpdating(false);
      setPendingCategory(null);
    }
  };

  const handleSetVendorRuleNo = async () => {
    if (!pendingCategory) return;

    setShowVendorRuleModal(false);
    setUpdating(true);

    try {
      // Just update this transaction, no vendor rule
      await updateTransactionCategory(tx.transaction_id, pendingCategory);
      if (onCategoryUpdate) {
        onCategoryUpdate(tx.transaction_id, pendingCategory);
      }
    } catch (err) {
      console.error("Failed to update category:", err);
      alert("Failed to update category");
    } finally {
      setUpdating(false);
      setPendingCategory(null);
    }
  };

  const handleExclude = async () => {
    const confirmed = confirm(
      `Are you sure you want to exclude this from spending?\n\n${tx.merchant_name || tx.name} - $${Math.abs(tx.amount).toFixed(2)}`
    );

    if (!confirmed) return;

    setUpdating(true);
    try {
      await excludeTransaction(tx.transaction_id);
      if (onLink) {
        onLink(); // Refetch to remove from list
      }
    } catch (err) {
      console.error("Failed to exclude transaction:", err);
      alert("Failed to exclude transaction");
    } finally {
      setUpdating(false);
    }
  };

  const handleLinkToTransaction = async (parentId: string) => {
    setUpdating(true);
    try {
      await linkTransaction(tx.transaction_id, parentId);
      setShowLinkModal(false);
      if (onLink) {
        onLink(); // This will refetch all transactions and update the parent's linked payments
      }
    } catch (err) {
      console.error("Failed to link transaction:", err);
      alert("Failed to link transaction");
    } finally {
      setUpdating(false);
    }
  };

  const handleUnlink = async (paymentId: string) => {
    setUpdating(true);
    try {
      await unlinkTransaction(paymentId);
      setLinkedPayments(prev => prev.filter(p => p.transaction_id !== paymentId));
      if (onLink) onLink();
    } catch (err) {
      console.error("Failed to unlink transaction:", err);
      alert("Failed to unlink transaction");
    } finally {
      setUpdating(false);
    }
  };

  // Filter to show recent spending transactions (positive amounts = money out, within last 60 days)
  const recentSpending = allTransactions.filter(t => {
    if (t.amount <= 0) return false; // Exclude income/Venmo (negative amounts)
    if (!t.simplified_category) return false; // Exclude uncategorized
    const daysDiff = Math.abs(new Date(tx.date).getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 60;
  }).slice(0, 20);

  console.log('TransactionCard render - showVendorRuleModal:', showVendorRuleModal, 'pendingCategory:', pendingCategory);

  return (
    <>
      {/* Vendor Rule Modal - rendered at body level */}
      {showVendorRuleModal && typeof document !== 'undefined' && (console.log('Rendering portal'), createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleSetVendorRuleNo}>
          <div className="bg-[#F5F4F0] dark:bg-[#19191a] rounded-lg border border-[#D8D5D0] dark:border-[#363636] p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[#2D2A27] dark:text-[#E6EAF0] mb-4">
              Set as default?
            </h3>
            <p className="text-sm text-[#6B645D] dark:text-[#938a87] mb-6">
              Should "{tx.merchant_name || tx.name}" always be in {pendingCategory}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSetVendorRuleYes}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-[#6B8CAE] hover:bg-[#5A7B9D] dark:bg-[#7A9FBF] dark:hover:bg-[#8BADC9] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Yes
              </button>
              <button
                onClick={handleSetVendorRuleNo}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-[#D8D5D0] dark:bg-[#363636] text-[#2D2A27] dark:text-[#E6EAF0] rounded-lg font-medium hover:bg-[#C8C5C0] dark:hover:bg-[#4a4a4a] transition-colors disabled:opacity-50"
              >
                No
              </button>
            </div>
          </div>
        </div>,
        document.body
      ))}

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
                  <option value="__EXCLUDE__" className="text-[#B87676]">
                    ───────────────
                  </option>
                  <option value="__EXCLUDE__" className="text-[#B87676]">
                    🗑️ Exclude from spending
                  </option>
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
            {hasLinkedPayments && tx.amount > 0 ? (
              <div>
                <p className="text-xs text-[#8A837C] dark:text-[#b0a8a5] line-through">
                  -${tx.amount.toFixed(2)}
                </p>
                <p className="text-base font-semibold text-[#2D2A27] dark:text-[#E6EAF0]">
                  {adjustedAmount >= 0 ? '-' : '+'}${Math.abs(adjustedAmount).toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-base font-semibold text-[#2D2A27] dark:text-[#E6EAF0]">
                {isIncome ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Linked Payments Indicator (for spending transactions) */}
      {tx.amount > 0 && linkedPayments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#D8D5D0] dark:border-[#363636]">
          <button
            onClick={() => setShowLinkedPayments(!showLinkedPayments)}
            className="text-xs text-[#6B8CAE] dark:text-[#7A9FBF] hover:underline flex items-center gap-1"
          >
            {linkedPayments.length} linked payment{linkedPayments.length > 1 ? 's' : ''}
            <span className="text-[10px]">{showLinkedPayments ? '▼' : '▶'}</span>
          </button>

          {showLinkedPayments && (
            <div className="mt-2 space-y-1">
              {loadingLinked ? (
                <p className="text-xs text-[#8A837C] dark:text-[#b0a8a5]">Loading...</p>
              ) : (
                linkedPayments.map((payment) => (
                  <div key={payment.transaction_id} className="flex items-center justify-between text-xs bg-[#E8E6E1] dark:bg-[#2a2a2a] p-2 rounded">
                    <span className="text-[#6B645D] dark:text-[#b0a8a5]">
                      {payment.merchant_name || payment.name} - ${Math.abs(payment.amount).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleUnlink(payment.transaction_id)}
                      disabled={updating}
                      className="text-[#B87676] hover:text-[#A86666] disabled:opacity-50"
                    >
                      Unlink
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Link to Transaction Button (for income/Venmo transactions) */}
      {isIncome && (
        <div className="mt-3 pt-3 border-t border-[#D8D5D0] dark:border-[#363636]">
          <button
            onClick={() => setShowLinkModal(true)}
            className="text-xs text-[#6B8CAE] dark:text-[#7A9FBF] hover:underline"
          >
            Link to transaction
          </button>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLinkModal(false)}>
          <div className="bg-[#F5F4F0] dark:bg-[#19191a] rounded-lg border border-[#D8D5D0] dark:border-[#363636] p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[#2D2A27] dark:text-[#E6EAF0] mb-4">
              Link payment to transaction
            </h3>
            <p className="text-sm text-[#8A837C] dark:text-[#b0a8a5] mb-4">
              Select which spending transaction this payment should be linked to:
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentSpending.map((t) => (
                <button
                  key={t.transaction_id}
                  onClick={() => handleLinkToTransaction(t.transaction_id)}
                  disabled={updating}
                  className="w-full text-left p-3 bg-[#FDFCFA] dark:bg-[#2a2a2a] hover:bg-[#E8E6E1] dark:hover:bg-[#363636] rounded border border-[#D8D5D0] dark:border-[#363636] disabled:opacity-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-[#2D2A27] dark:text-[#E6EAF0]">
                        {t.merchant_name || t.name}
                      </p>
                      <p className="text-xs text-[#8A837C] dark:text-[#b0a8a5]">
                        {formatDate(t.date)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#2D2A27] dark:text-[#E6EAF0]">
                      ${Math.abs(t.amount).toFixed(2)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLinkModal(false)}
              className="mt-4 w-full px-4 py-2 bg-[#D8D5D0] dark:bg-[#363636] text-[#2D2A27] dark:text-[#E6EAF0] rounded hover:bg-[#C8C5C0] dark:hover:bg-[#4a4a4a] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
              <option value="__EXCLUDE__" className="text-[#B87676]">
                ───────────────
              </option>
              <option value="__EXCLUDE__" className="text-[#B87676]">
                🗑️ Exclude from spending
              </option>
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
    </>
  );
}
