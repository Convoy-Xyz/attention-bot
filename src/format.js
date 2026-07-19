export function fmtUsd(n) {
  if (n === null || n === undefined) return 'N/A';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function fmtAgeHours(pairCreatedAtMs) {
  const hours = (Date.now() - pairCreatedAtMs) / (1000 * 60 * 60);
  return hours < 1 ? `${(hours * 60).toFixed(0)}m` : `${hours.toFixed(1)}h`;
}

export function buildAlertMessage({ pair, rugcheck, holders }) {
  const name = pair.baseToken?.symbol || pair.baseToken?.name || 'Unknown';
  const mc = pair.marketCap ?? pair.fdv;
  const liq = pair.liquidity?.usd;
  const vol1h = pair.volume?.h1;
  const change1h = pair.priceChange?.h1;
  const age = fmtAgeHours(pair.pairCreatedAt);
  const ca = pair.baseToken?.address;
  const dexUrl = pair.url || `https://dexscreener.com/solana/${pair.pairAddress}`;

  const rugLine = rugcheck?.score !== null && rugcheck?.score !== undefined
    ? `🛡 rugcheck ${rugcheck.riskLevel || 'checked'} (${rugcheck.score}/100)`
    : '🛡 rugcheck: unavailable';
  const holdersLine = holders !== null && holders !== undefined ? ` | ${holders} holders` : '';

  return [
    `🔥 *NEW RUNNER* — *${name}* (solana)`,
    `MC ${fmtUsd(mc)} | Liq ${fmtUsd(liq)} | Vol1h ${fmtUsd(vol1h)} | 1h ${change1h >= 0 ? '+' : ''}${change1h?.toFixed(0)}%`,
    `Age ${age}`,
    `CA: \`${ca}\``,
    dexUrl,
    `${rugLine}${holdersLine}`,
  ].join('\n');
}
