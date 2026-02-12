import React, { useState } from 'react';
import { submitContactForm, isContactFormConfigured } from '../services/contactService';

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({ isOpen, onClose, recipientEmail }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const useFormspree = isContactFormConfigured();
      if (useFormspree) {
        const ok = await submitContactForm({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim() || 'Contact Form Submission',
          message: formData.message.trim(),
        });
        if (!ok) {
          setError('Failed to send message. Please try again or email us directly.');
          return;
        }
        setSuccess(true);
        setTimeout(() => {
          setFormData({ name: '', email: '', subject: '', message: '' });
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        // Fallback: open email client with pre-filled mailto
        const subject = encodeURIComponent(formData.subject || 'Contact Form Submission');
        const body = encodeURIComponent(
          `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
        );
        window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
        setSuccess(true);
        setTimeout(() => {
          setFormData({ name: '', email: '', subject: '', message: '' });
          setSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError('Failed to send message. Please try again or email us directly.');
      console.error('Contact form error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-dark)',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-slate)',
            fontSize: '1.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '0.25rem',
            lineHeight: 1,
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}
          aria-label="Close"
        >
          ×
        </button>

        {/* Header */}
        <h2
          style={{
            color: 'var(--accent-gold)',
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            fontFamily: 'Playfair Display, serif',
          }}
        >
          Contact Us
        </h2>
        <p
          style={{
            color: 'var(--text-slate)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            opacity: 0.8,
          }}
        >
          We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>

        {/* Success message */}
        {success && (
          <div
            style={{
              backgroundColor: 'rgba(46, 125, 50, 0.2)',
              border: '1px solid rgba(46, 125, 50, 0.5)',
              color: '#4ade80',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {isContactFormConfigured()
              ? "✓ Message sent! We'll get back to you soon."
              : "✓ Your email client should open—please send the message from there."}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.2)',
              border: '1px solid rgba(220, 38, 38, 0.5)',
              color: '#f87171',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                color: 'var(--text-slate)',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
              }}
            >
              Name <span style={{ color: 'var(--accent-gold)' }}>*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text-slate)',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-gold)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                color: 'var(--text-slate)',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
              }}
            >
              Email <span style={{ color: 'var(--accent-gold)' }}>*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text-slate)',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-gold)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="subject"
              style={{
                display: 'block',
                color: 'var(--text-slate)',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
              }}
            >
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              disabled={loading}
              placeholder="Optional"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text-slate)',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-gold)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="message"
              style={{
                display: 'block',
                color: 'var(--text-slate)',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
              }}
            >
              Message <span style={{ color: 'var(--accent-gold)' }}>*</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              disabled={loading}
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text-slate)',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-gold)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'var(--text-slate)',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--accent-gold)',
                border: 'none',
                borderRadius: '8px',
                color: '#0b0f19',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 0 12px rgba(250, 204, 21, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                  e.currentTarget.style.boxShadow = '0 0 18px rgba(250, 204, 21, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(250, 204, 21, 0.3)';
              }}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
