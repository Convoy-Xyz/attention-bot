import { config } from './config.js';

/**
 * Cheap, on-chain-only checks. Runs BEFORE we spend a Rugcheck/Helius call,
 * so tightening these also cuts down on API usage, not just alert volume.
 */
export function passesFilters(pair) {
  const f = config.filters;

  const ageHours = pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60) : Infinity;
  const mc = pair.marketCap ?? pair.fdv ?? 0;
  const liq = pair.liquidity?.usd ?? 0;
  const vol1h = pair.volume?.h1 ?? 0;
  const change1h = pair.priceChange?.h1 ?? 0;

  if (ageHours > f.maxAgeHours) return false;
  if (mc < f.minMcUsd || mc > f.maxMcUsd) return false;
  if (liq < f.minLiquidityUsd || liq > f.maxLiquidityUsd) return false;
  if (vol1h < f.minVolume1hUsd) return false;
  if (change1h < f.min1hChangePct) return false;

  // Volume-to-liquidity ratio: real attention shows up as trading activity
  // that's large relative to the pool, not just a big pool sitting there.
  // A coin with $100K liquidity and $5K volume in the last hour is quiet.
  // A coin with $20K liquidity and $30K volume in the last hour is hot.
  if (liq > 0 && f.minVolLiqRatio > 0) {
    const ratio = vol1h / liq;
    if (ratio < f.minVolLiqRatio) return false;
  }

  return true;
}

/**
 * Runs AFTER Rugcheck/holder data comes back, since it depends on that data.
 * Returns false to reject even if passesFilters() already said yes.
 */
export function passesQualityGate({ rugcheck, holders }) {
  const f = config.filters;

  if (f.minRugcheckScore !== null) {
    // If Rugcheck failed to respond, we have no score to check, reject to
    // be safe rather than let an unverifiable token through.
    if (!rugcheck || rugcheck.score === null || rugcheck.score === undefined) return false;
    if (rugcheck.score < f.minRugcheckScore) return false;
  }

  if (f.maxRugcheckScore !== null) {
    // Same logic in reverse: no score = unverifiable = reject.
    if (!rugcheck || rugcheck.score === null || rugcheck.score === undefined) return false;
    if (rugcheck.score > f.maxRugcheckScore) return false;
  }

  if (f.minHolders !== null && holders !== null && holders !== undefined) {
    if (holders < f.minHolders) return false;
  }

  return true;
}
