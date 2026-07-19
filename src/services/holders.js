import { config } from '../config.js';

/**
 * Optional. DexScreener and Rugcheck don't expose holder counts, so this
 * pulls token-account count via Helius's RPC. Requires a free Helius API
 * key in .env (HELIUS_API_KEY). Returns null if no key is set or the
 * lookup fails, alerts still send without a holder count in that case.
 */
export async function fetchHolderCount(mint) {
  if (!config.helius.apiKey) return null;

  try {
    const url = `https://mainnet.helius-rpc.com/?api-key=${config.helius.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'holder-count',
        method: 'getTokenAccounts',
        params: { mint, limit: 1 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // getTokenAccounts returns a `total` field in Helius's DAS-style response.
    return typeof data?.result?.total === 'number' ? data.result.total : null;
  } catch {
    return null;
  }
}
