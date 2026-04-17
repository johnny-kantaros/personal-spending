"use client";

import { useEffect, useState } from "react";
import { usePlaidLink, PlaidLinkError } from "react-plaid-link";
import { createLinkToken, exchangePublicToken, getConnectedItems } from "@/lib/plaid";

interface BankItem {
  id: string;
  institution_name: string;
}

interface AddBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBankAdded: (banks: BankItem[]) => void;
}

export default function AddBankModal({ isOpen, onClose, onBankAdded }: AddBankModalProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          const token = await createLinkToken("user-123");
          setLinkToken(token);
        } catch (err) {
          console.error("Failed to create link token", err);
        }
      })();
    }
  }, [isOpen]);

  const config = {
    token: linkToken!,
    onSuccess: async (public_token: string) => {
      await exchangePublicToken(public_token);
      // Refresh bank list
      const items = await getConnectedItems();
      onBankAdded(items);
      onClose();
    },
    onExit: (err: PlaidLinkError | null) => {
      if (err) console.error("Link exit:", err);
    },
  };

  const { open, ready } = usePlaidLink(config);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-slate-200 dark:border-slate-800 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-slate-50">
            Add a New Bank
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Securely connect your bank account through Plaid&apos;s encrypted connection
          </p>
        </div>

        <button
          onClick={() => open()}
          disabled={!ready}
          className="w-full px-4 py-3 bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {ready ? (
            <>
              Connect Bank
            </>
          ) : (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </>
          )}
        </button>

        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
          🔒 Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
}
