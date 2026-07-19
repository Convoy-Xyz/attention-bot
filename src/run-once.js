import { validateConfig } from './config.js';
import { scanOnce } from './scan.js';

// Run-once mode: for GitHub Actions or any cron-style scheduler that
// invokes the script, waits for it to exit, and runs it again later.
// This does ONE scan pass and exits, it does not loop or poll on its own.

validateConfig();

scanOnce()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
