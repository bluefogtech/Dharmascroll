# Contact form (Get in Touch) – email delivery

The "Get in Touch" form can deliver messages to **contact@bluefog.co.uk** using [Formspree](https://formspree.io).

## One-time setup

1. Go to [formspree.io](https://formspree.io) and sign up (free tier is enough).
2. Create a new form and set the **email address** to **contact@bluefog.co.uk**.
3. After saving, copy the **form ID** from the form endpoint, e.g. from  
   `https://formspree.io/f/abc123xy` → the form ID is **abc123xy**.
4. In your project, set the env variable (in `.env` and, for production, in Vercel/your host):
   ```bash
   VITE_FORMSPREE_CONTACT_FORM_ID=abc123xy
   ```
5. Restart the dev server or redeploy so the new env is picked up.

Once this is set, submitting the form sends the message via Formspree and the email is delivered to contact@bluefog.co.uk. The success message "Message sent! We'll get back to you soon." is shown only when the submission succeeds.

If `VITE_FORMSPREE_CONTACT_FORM_ID` is not set, the form falls back to opening the user’s email client (mailto) with pre-filled content; in that case the user must send the email manually.
