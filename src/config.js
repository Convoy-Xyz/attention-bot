import 'dotenv/config';

function num(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : Number(v);
}

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  helius: {
    apiKey: process.env.HELIUS_API_KEY || null,
  },
  pollIntervalMs: num('POLL_INTERVAL_MS', 60000),
  filters: {
    maxAgeHours: num('MAX_AGE_HOURS', 2),
    minMcUsd: num('MIN_MC_USD', 20000),
    maxMcUsd: num('MAX_MC_USD', 300000),
    minLiquidityUsd: num('MIN_LIQUIDITY_USD', 10000),
    maxLiquidityUsd: num('MAX_LIQUIDITY_USD', 150000),
    minVolume1hUsd: num('MIN_VOLUME_1H_USD', 15000),
    min1hChangePct: num('MIN_1H_CHANGE_PCT', 100),
    // Volume in the last hour relative to liquidity. 1 means volume must at
    // least match liquidity. Set to 0 in .env to disable this check.
    minVolLiqRatio: num('MIN_VOL_LIQ_RATIO', 1),
    // Leave blank in .env to disable. If set, tokens Rugcheck can't score
    // get rejected outright rather than let through unverified.
    minRugcheckScore: process.env.MIN_RUGCHECK_SCORE ? Number(process.env.MIN_RUGCHECK_SCORE) : null,
    // Leave blank in .env to disable. If set, rejects anything ABOVE this
    // score, and rejects anything Rugcheck can't score at all.
    maxRugcheckScore: process.env.MAX_RUGCHECK_SCORE ? Number(process.env.MAX_RUGCHECK_SCORE) : null,
    // Leave blank in .env to disable, and it's ignored anyway unless
    // HELIUS_API_KEY is set since that's what supplies holder counts.
    minHolders: process.env.MIN_HOLDERS ? Number(process.env.MIN_HOLDERS) : null,
  },
};

export function validateConfig() {
  const missing = [];
  if (!config.telegram.botToken) missing.push('TELEGRAM_BOT_TOKEN');
  if (!config.telegram.chatId) missing.push('TELEGRAM_CHAT_ID');
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}. Copy .env.example to .env and fill it in.`);
  }
}
