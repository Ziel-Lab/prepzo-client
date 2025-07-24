/* eslint-disable */
// Deprecated: client-side LinkedIn import now handles upload & polling.
export async function POST() {
  return new Response(JSON.stringify({ error: 'Endpoint deprecated. Use client-side implementation.' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  });
}