"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlaidOAuthReturn() {
  const router = useRouter();

  useEffect(() => {
    router.push("/");
  }, [router]);

  return <p className="p-8 text-center">Completing Plaid OAuth flow...</p>;
}
