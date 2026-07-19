/**
 * DexScreener has no officially documented "new pairs" firehose endpoint.
 * We use two public discovery endpoints (token-profiles + token-boosts),
 * both of which surface recently-active tokens across chains, then filter
 * to Solana and pull full pair stats from the tokens endpoint.
 *
 * If DexScreener changes these paths, this is the file to fix.
 */

const BASE = 'https://api.dexscreener.com';

async function safeFetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`DexScreener request failed (${res.status}): ${url}`);
  }
  return res.json();
}

/** Recently updated token profiles, filtered to Solana. */
export async function fetchLatestProfiles() {
  const data = await safeFetchJson(`${BASE}/token-profiles/latest/v1`);
  const list = Array.isArray(data) ? data : [];
  return list.filter((t) => t.chainId === 'solana').map((t) => t.tokenAddress);
}

/** Recently boosted (paid-promotion) tokens, filtered to Solana. */
export async function fetchLatestBoosts() {
  const data = await safeFetchJson(`${BASE}/token-boosts/latest/v1`);
  const list = Array.isArray(data) ? data : [];
  return list.filter((t) => t.chainId === 'solana').map((t) => t.tokenAddress);
}

/**
 * Full pair/market data for up to 30 comma-separated token addresses.
 * Returns the single best (highest-liquidity) pair per token.
 */
export async function fetchTokenPairs(addresses) {
  if (!addresses.length) return [];
  const chunks = [];
  for (let i = 0; i < addresses.length; i += 30) {
    chunks.push(addresses.slice(i, i + 30));
  }

  const results = [];
  for (const chunk of chunks) {
    const data = await safeFetchJson(`${BASE}/latest/dex/tokens/${chunk.join(',')}`);
    const pairs = Array.isArray(data?.pairs) ? data.pairs : [];
    const solanaPairs = pairs.filter((p) => p.chainId === 'solana');

    // Group by base token address, keep the highest-liquidity pair per token
    const byToken = new Map();
    for (const p of solanaPairs) {
      const addr = p.baseToken?.address;
      if (!addr) continue;
      const existing = byToken.get(addr);
      const liq = p.liquidity?.usd || 0;
      if (!existing || liq > (existing.liquidity?.usd || 0)) {
        byToken.set(addr, p);
      }
    }
    results.push(...byToken.values());
  }
  return results;
}
