import { config, validateConfig } from './config.js';
import { scanOnce } from './scan.js';

// Continuous mode: for running locally with `npm start`, or on any host
// that keeps a long-lived process alive (Railway, Render background worker, a VPS).
// If you're using GitHub Actions instead, that uses src/run-once.js, not this file.

validateConfig();

async function main() {
  await scanOnce();
  setInterval(scanOnce, config.pollIntervalMs);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
