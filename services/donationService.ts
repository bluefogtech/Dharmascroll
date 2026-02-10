/**
 * Donation flow via Stripe Payment Link.
 * Set VITE_STRIPE_DONATE_LINK in .env (local) or Vercel env vars (production).
 * Build writes it into generated-env.ts so the link is in the bundle on Vercel.
 */
import { VITE_STRIPE_DONATE_LINK as DONATE_LINK } from './generated-env';

export function getDonateLink(): string | null {
  if (typeof DONATE_LINK === 'string' && DONATE_LINK.startsWith('https://')) {
    return DONATE_LINK.trim();
  }
  return null;
}

export function openDonatePage(): void {
  const link = getDonateLink();
  if (link) {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
}

export function isDonateConfigured(): boolean {
  return getDonateLink() !== null;
}
