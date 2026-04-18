import { getAuthHeaders } from './auth';

export async function createLinkToken(userId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/link_token/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ user_id: userId }),
  });
  const data = await res.json();
  return data.link_token;
}

export async function exchangePublicToken(publicToken: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/item/public_token/exchange`, {
    method: "POST",
    headers: getAuthHeaders(),
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

  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.statusText}`);
  return res.json();
}


export async function getConnectedItems() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/items`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch connected items: ${res.statusText}`);
  const data = await res.json();
  return data.items;
}

export async function getTransactionsSummary(selectedBanks: string[]) {
  const params = selectedBanks.map((b) => `item_ids=${b}`).join("&");
  const url = params
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/summary?${params}`
    : `${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/summary`;

  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch transaction summary: ${res.statusText}`);
  return res.json();
}

export async function syncTransactions() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/items/sync`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to sync transactions: ${res.statusText}`);
  return res.json(); // returns { "SoFi": "synced", ... }
}

export async function updateTransactionCategory(transactionId: string, simplifiedCategory: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/${transactionId}/category`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ simplified_category: simplifiedCategory }),
  });

  if (!res.ok) throw new Error(`Failed to update transaction category: ${res.statusText}`);
  return res.json();
}

export async function linkTransaction(paymentTransactionId: string, parentTransactionId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/${paymentTransactionId}/link`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ parent_transaction_id: parentTransactionId }),
  });

  if (!res.ok) throw new Error(`Failed to link transaction: ${res.statusText}`);
  return res.json();
}

export async function unlinkTransaction(paymentTransactionId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/${paymentTransactionId}/unlink`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to unlink transaction: ${res.statusText}`);
  return res.json();
}

export async function getLinkedPayments(parentTransactionId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/${parentTransactionId}/linked`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to fetch linked payments: ${res.statusText}`);
  return res.json();
}

export async function setVendorRule(transactionId: string, simplifiedCategory: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/${transactionId}/set-vendor-rule`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ simplified_category: simplifiedCategory }),
  });

  if (!res.ok) throw new Error(`Failed to set vendor rule: ${res.statusText}`);
  return res.json();
}

export async function excludeTransaction(transactionId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/${transactionId}/exclude`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to exclude transaction: ${res.statusText}`);
  return res.json();
}

export async function unexcludeTransaction(transactionId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/${transactionId}/unexclude`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to unexclude transaction: ${res.statusText}`);
  return res.json();
}