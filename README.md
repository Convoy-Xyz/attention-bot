# Varela Attention Bot

Scans Solana for early-stage memecoins gaining on-chain momentum and posts alerts
to a Telegram channel, matching the "NEW RUNNER" alert format.

## How it works

1. Every `POLL_INTERVAL_MS`, it pulls recently active Solana tokens from two
   DexScreener discovery endpoints (latest token profiles, latest boosted tokens).
2. For each candidate it fetches full pair stats (market cap, liquidity, volume, age, 1h change).
3. Tokens that pass the filters in `.env` get a Rugcheck safety score and
   (optionally) a holder count, then get posted to Telegram.
4. Already-alerted tokens are remembered for 7 days in `data/seen.json` so you don't
   get spammed with repeats.

## Setup

### 1. Create the Telegram bot
- Message [@BotFather](https://t.me/BotFather) on Telegram, run `/newbot`, follow the prompts.
- Copy the token it gives you.
- Add the bot to your channel/group as an admin.
- Get the chat ID: add [@getidsbot](https://t.me/getidsbot) to the channel, or send a message and check
  `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`.

### 2. Configure
```bash
cp .env.example .env
```
Fill in `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Adjust the filter thresholds
to taste, the defaults are a starting point, not tuned advice.

### 3. Run locally
```bash
npm install
npm start
```

### 4. Deploy to Railway
- Push this folder to a GitHub repo.
- In Railway: New Project → Deploy from GitHub repo.
- Add the same env vars from `.env` in Railway's Variables tab.
- Railway auto-detects Node and runs `npm start`. Set the start command explicitly
  to `npm start` if it doesn't.
- No database needed, `data/seen.json` persists on Railway's ephemeral disk between
  restarts within the same deploy, but resets on redeploy. That's fine for this use case.

## Tuning the filters (`.env`)

| Var | What it does |
|---|---|
| `MAX_AGE_HOURS` | Ignore pairs older than this, keeps it "early stage" |
| `MIN_MC_USD` / `MAX_MC_USD` | Market cap band, filters out dust and already-pumped coins |
| `MIN_LIQUIDITY_USD` / `MAX_LIQUIDITY_USD` | Liquidity band |
| `MIN_VOLUME_1H_USD` | Minimum trading activity in the last hour |
| `MIN_1H_CHANGE_PCT` | Minimum price momentum in the last hour |

Start loose, watch what it sends for a few days, then tighten based on which
alerts turned out to actually run versus which were noise.

## Known limitations, read before relying on this

- **DexScreener's discovery endpoints aren't officially documented.** They're
  publicly used by the community but DexScreener can change or rate-limit them
  without notice. If discovery starts returning errors, that's the first place to check.
- **No holder count without a Helius key.** DexScreener and Rugcheck don't expose
  this. Sign up for a free Helius key at helius.dev and add it to `.env` to enable it.
  Without it, alerts just omit the holder line.
- **Rugcheck score direction is unverified against the live API.** Confirm whether
  a higher score means safer or riskier on your first few real alerts, and adjust
  `format.js` labelling if needed.
- **No social/virality layer.** This is on-chain signals only, per your call. It
  will catch momentum after it starts, not the meme going viral before price moves.
  That's a separate, harder build (Twitter API access or scraping) if you want to
  add it later.
- This is a discovery and alerting tool, not trading advice, and it will produce
  false positives. Treat every alert as a starting point for your own check, not a signal to buy.
