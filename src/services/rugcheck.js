const BASE = 'https://api.rugcheck.xyz/v1';

/**
 * Fetches the summary risk report for a mint. Returns null on failure so a
 * Rugcheck outage never blocks the alert pipeline, just omits the badge.
 * NOTE: verify the score direction against the live API before trusting it,
 * rugcheck's own docs have flip-flopped between "higher is safer" and
 * "higher is riskier" across versions.
 */
export async function fetchRugcheckSummary(mint) {
  try {
    const res = await fetch(`${BASE}/tokens/${mint}/report/summary`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      score: data?.score ?? null,
      riskLevel: data?.risks?.length ? data.risks[0].level : null,
    };
  } catch {
    return null;
  }
}
