"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlaidOAuthReturn() {
  const router = useRouter();

  useEffect(() => {
    router.push("/transactions");
  }, [router]);

  return (
    <main className="flex items-center justify-center min-h-screen">
      <p>Completing bank connection...</p>
    </main>
  );
}
