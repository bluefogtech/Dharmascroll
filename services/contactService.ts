import { VITE_FORMSPREE_CONTACT_FORM_ID } from './generated-env';

export interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Submit the contact form to Formspree. Emails are delivered to the address
 * configured for the form at formspree.io (e.g. contact@bluefog.co.uk).
 * Returns true if the submission was accepted.
 */
export async function submitContactForm(payload: ContactFormPayload): Promise<boolean> {
  const formId = VITE_FORMSPREE_CONTACT_FORM_ID;
  if (!formId) {
    return false;
  }
  const res = await fetch(`https://formspree.io/f/${formId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      subject: payload.subject || 'Contact Form Submission',
      message: payload.message,
    }),
  });
  return res.ok;
}

export function isContactFormConfigured(): boolean {
  return Boolean(VITE_FORMSPREE_CONTACT_FORM_ID);
}
