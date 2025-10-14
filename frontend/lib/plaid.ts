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
