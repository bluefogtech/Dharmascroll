/**
 * Donation flow via Stripe Payment Link.
 * Set VITE_STRIPE_DONATE_LINK in .env to your Stripe Payment Link URL.
 * Stripe pays out to your connected bank account (Settings → Payouts in Stripe Dashboard).
 */

const DONATE_LINK = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_STRIPE_DONATE_LINK;

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
