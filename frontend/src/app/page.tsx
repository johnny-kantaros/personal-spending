"use client";
import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { createLinkToken, exchangePublicToken } from "@/lib/plaid";
import { PlaidLinkError } from "react-plaid-link";

export default function Home() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = await createLinkToken("user-123");
      setLinkToken(token);
    })();
  }, []);

  const config = {
    token: linkToken!,
    onSuccess: async (public_token: string) => {
      const response = await exchangePublicToken(public_token);
      setAccessToken(response.access_token);
    },
    onExit: (err: PlaidLinkError | null) => {
      if (err) console.log("Link exit:", err);
    },
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Personal Spending Dashboard</h1>

      {!accessToken && (
        <button
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg shadow-md transition-colors duration-200"
          onClick={() => open()}
          disabled={!ready}
        >
          Connect Your Bank
        </button>
      )}

      {accessToken && (
        <div className="mt-6 flex flex-col items-center space-y-3">
          <p className="text-green-600 font-medium bg-green-50 px-4 py-2 rounded-md shadow-sm">
            ✅ Bank linked successfully!
          </p>
          <a
            href="/transactions"
            className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-medium rounded-lg shadow-md transition-colors duration-200"
          >
            View Transactions
          </a>
        </div>
      )}
    </main>
  );
}
