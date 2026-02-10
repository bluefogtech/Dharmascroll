/**
 * Donation flow via Stripe Payment Link.
 * Link is available from (1) build-time generated-env and (2) runtime /donate-config.json
 * (written by scripts/write-donate-config.mjs during build). Runtime config fixes
 * Vercel where build-time env can be missing.
 */
import { VITE_STRIPE_DONATE_LINK as DONATE_LINK } from './generated-env';

export function getDonateLink(): string | null {
  if (typeof DONATE_LINK === 'string' && DONATE_LINK.startsWith('https://')) {
    return DONATE_LINK.trim();
  }
  return null;
}

/** Fetches donate link from deployed donate-config.json (set at build on Vercel). */
export async function getDonateLinkFromConfig(): Promise<string | null> {
  try {
    const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
    const res = await fetch(`${base}/donate-config.json`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { donateLink?: string };
    const link = typeof data.donateLink === 'string' ? data.donateLink.trim() : '';
    return link.startsWith('https://') ? link : null;
  } catch {
    return null;
  }
}

export function openDonatePage(link?: string | null): void {
  const url = link ?? getDonateLink();
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function isDonateConfigured(): boolean {
  return getDonateLink() !== null;
}
