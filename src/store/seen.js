import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const FILE = new URL('../../data/seen.json', import.meta.url);
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // forget after 7 days

async function load() {
  if (!existsSync(FILE)) return {};
  try {
    const raw = await readFile(FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function save(map) {
  await writeFile(FILE, JSON.stringify(map, null, 2));
}

export async function hasSeen(address) {
  const map = await load();
  return Boolean(map[address]);
}

export async function markSeen(address) {
  const map = await load();
  map[address] = Date.now();
  // prune old entries so the file doesn't grow forever
  for (const [addr, ts] of Object.entries(map)) {
    if (Date.now() - ts > RETENTION_MS) delete map[addr];
  }
  await save(map);
}
