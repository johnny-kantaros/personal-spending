export async function createLinkToken(userId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/link_token/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  const data = await res.json();
  return data.link_token;
}

export async function exchangePublicToken(publicToken: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/item/public_token/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public_token: publicToken }),
  });
  return res.json();
}

export async function getTransactions(selectedBanks: string[], month?: string) {
  const paramsArray: string[] = selectedBanks.map((b) => `item_ids=${b}`); // FIXED

  if (month) {
    const [year, mon] = month.split("-");
    paramsArray.push(`year=${Number(year)}`);
    paramsArray.push(`month=${Number(mon)}`);
  }

  const params = paramsArray.join("&");
  const url = params
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions?${params}`
    : `${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.statusText}`);
  return res.json();
}


export async function getConnectedItems() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/items`);
  if (!res.ok) throw new Error(`Failed to fetch connected items: ${res.statusText}`);
  const data = await res.json();
  return data.items;
}

export async function getTransactionsSummary(selectedBanks: string[]) {
  const params = selectedBanks.map((b) => `items=${b}`).join("&");
  const url = params
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/summary?${params}`
    : `${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/summary`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch transaction summary: ${res.statusText}`);
  return res.json();
}

export async function syncTransactions() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/items/sync`, {
    method: "POST",
  });

  if (!res.ok) throw new Error(`Failed to sync transactions: ${res.statusText}`);
  return res.json(); // returns { "SoFi": "synced", ... }
}