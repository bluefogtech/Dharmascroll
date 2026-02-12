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
  let formId = VITE_FORMSPREE_CONTACT_FORM_ID;
  if (!formId) {
    return false;
  }
  
  // Extract form ID from URL if full URL is provided (e.g., "https://formspree.io/f/mojnjzbv" -> "mojnjzbv")
  if (formId.includes('formspree.io')) {
    const match = formId.match(/formspree\.io\/f\/([a-zA-Z0-9]+)/);
    if (match) {
      formId = match[1];
    } else {
      console.error('Invalid Formspree form ID format:', formId);
      return false;
    }
  }
  
  try {
    const res = await fetch(`https://formspree.io/f/${formId}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        subject: payload.subject || 'Contact Form Submission',
        message: payload.message,
      }),
    });
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error('Formspree submission failed:', res.status, errorText);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error submitting to Formspree:', err);
    return false;
  }
}

export function isContactFormConfigured(): boolean {
  return Boolean(VITE_FORMSPREE_CONTACT_FORM_ID);
}
