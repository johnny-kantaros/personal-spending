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
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Personal Spending Dashboard</h1>
      {!accessToken && (
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow"
          onClick={() => open()}
          disabled={!ready}
        >
          Connect Your Bank
        </button>
      )}
      {accessToken && (
        <p className="mt-4 text-green-600">✅ Bank linked successfully!</p>
      )}
    </main>
  );
}
