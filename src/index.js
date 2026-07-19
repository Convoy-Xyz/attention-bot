import { config, validateConfig } from './config.js';
import { fetchLatestProfiles, fetchLatestBoosts, fetchTokenPairs } from './services/dexscreener.js';
import { fetchRugcheckSummary } from './services/rugcheck.js';
import { fetchHolderCount } from './services/holders.js';
import { sendTelegramAlert } from './services/telegram.js';
import { hasSeen, markSeen } from './store/seen.js';
import { passesFilters, passesQualityGate } from './filters.js';
import { buildAlertMessage } from './format.js';

validateConfig();

async function scanOnce() {
  console.log(`[${new Date().toISOString()}] scanning...`);

  let candidateAddresses = [];
  try {
    const [profiles, boosts] = await Promise.all([
      fetchLatestProfiles(),
      fetchLatestBoosts(),
    ]);
    candidateAddresses = [...new Set([...profiles, ...boosts])];
  } catch (err) {
    console.error('Discovery fetch failed:', err.message);
    return;
  }

  if (!candidateAddresses.length) {
    console.log('No candidates this pass.');
    return;
  }

  let pairs = [];
  try {
    pairs = await fetchTokenPairs(candidateAddresses);
  } catch (err) {
    console.error('Pair data fetch failed:', err.message);
    return;
  }

  for (const pair of pairs) {
    const address = pair.baseToken?.address;
    if (!address) continue;

    if (await hasSeen(address)) continue;
    if (!passesFilters(pair)) continue;

    const [rugcheck, holders] = await Promise.all([
      fetchRugcheckSummary(address),
      fetchHolderCount(address),
    ]);

    if (!passesQualityGate({ rugcheck, holders })) {
      await markSeen(address); // don't re-check this one every pass
      continue;
    }

    const message = buildAlertMessage({ pair, rugcheck, holders });

    try {
      await sendTelegramAlert(message);
      console.log(`Alert sent: ${pair.baseToken?.symbol} (${address})`);
    } catch (err) {
      console.error('Telegram send failed:', err.message);
      continue; // don't mark as seen if the send failed, retry next pass
    }

    await markSeen(address);
  }
}

async function main() {
  await scanOnce();
  setInterval(scanOnce, config.pollIntervalMs);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
