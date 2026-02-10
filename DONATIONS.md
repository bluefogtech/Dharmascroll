# Donate Button – Stripe (payouts to your bank)

The app shows a **Donate** button on the landing page when a Stripe Payment Link is configured. Donations are collected by Stripe and paid out to your connected bank account.

## 1. Stripe account and bank

1. Sign up at [stripe.com](https://stripe.com) and complete account verification.
2. In Stripe Dashboard go to **Settings → Payouts** and add your **bank account**. Stripe will pay available balance to this account on your payout schedule (e.g. daily/weekly/monthly).

## 2. Create a Payment Link for donations

1. In Stripe Dashboard go to **Product catalog** (or **Payments → Payment links**).
2. Click **+ New** to create a new **Payment link**.
3. Set:
   - **Product or payment:** e.g. “Donation to DharmaScroll” (or “One-time donation”).
   - **Pricing:** One-time, choose amount(s) (e.g. $5, $10, $20) or “Customer chooses amount”.
   - **After payment:** e.g. “Show a thank-you page” or redirect to your site.
4. Create the link and copy the **Payment link URL** (e.g. `https://buy.stripe.com/...`).

## 3. Wire the link in the app

1. In the project root, add to your `.env` (create it if needed):
   ```bash
   VITE_STRIPE_DONATE_LINK=https://buy.stripe.com/your_link_here
   ```
2. Restart the dev server (`npm run dev`). The **Donate** button will appear in the top-right of the landing page (next to Sign in).
3. For **Vercel**, add the same variable in **Project → Settings → Environment variables** and redeploy.

Clicking **Donate** opens the Stripe payment page in a new tab; after payment, funds go to your Stripe balance and then to your bank per your payout settings.

## Optional: multiple amounts or custom amount

You can create one Payment Link with fixed amounts, or one “Customer chooses amount” and reuse the same `VITE_STRIPE_DONATE_LINK` for the Donate button.
