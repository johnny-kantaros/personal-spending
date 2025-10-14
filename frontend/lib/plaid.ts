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

export async function getTransactions(selectedBanks: string[]) {
  const params = selectedBanks.map((b) => `items=${b}`).join("&");
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