/**
 * Get HTTP Basic Auth headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const username = process.env.NEXT_PUBLIC_AUTH_USERNAME || '';
  const password = process.env.NEXT_PUBLIC_AUTH_PASSWORD || '';

  const credentials = btoa(`${username}:${password}`);

  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
}
