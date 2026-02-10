#!/usr/bin/env node
/**
 * Writes public/donate-config.json from VITE_STRIPE_DONATE_LINK so the
 * deployed app can load it at runtime (works on Vercel even when build-time
 * injection fails). Run before vite build.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const outPath = path.join(publicDir, 'donate-config.json');

// Load .env so local builds get VITE_STRIPE_DONATE_LINK (Vercel injects process.env at build)
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const m = line.match(/^\s*VITE_STRIPE_DONATE_LINK\s*=\s*(.*)$/);
    if (m) {
      const val = m[1].replace(/^["']|["']$/g, '').trim();
      if (val && !process.env.VITE_STRIPE_DONATE_LINK) process.env.VITE_STRIPE_DONATE_LINK = val;
      break;
    }
  }
}

const link = typeof process.env.VITE_STRIPE_DONATE_LINK === 'string'
  ? process.env.VITE_STRIPE_DONATE_LINK.trim()
  : '';

const config = { donateLink: link.startsWith('https://') ? link : '' };

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(outPath, JSON.stringify(config, null, 0), 'utf8');
console.log('[donate-config] Wrote donate-config.json, donateLink:', config.donateLink ? 'set' : 'empty');
