"use client";

import { useEffect, useState } from "react";
import { usePlaidLink, PlaidLinkError } from "react-plaid-link";
import { createLinkToken, exchangePublicToken, getConnectedItems } from "@/lib/plaid";

interface AddBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBankAdded: (banks: any[]) => void;
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
      const response = await exchangePublicToken(public_token);
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
      className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm relative"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4">Add a New Bank</h2>
        <p className="text-gray-600 mb-6">
          Connect your bank account securely using Plaid.
        </p>

        <button
          onClick={() => open()}
          disabled={!ready}
          className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow transition-colors"
        >
          Connect Bank
        </button>
      </div>
    </div>
  );
}
