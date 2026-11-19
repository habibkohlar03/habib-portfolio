import { useRef, useState } from 'react';
import SocialLinks from '../components/ui/SocialLinks';
import { Github, Linkedin, Loader2, Mail, MapPin, MessageCircle, Send, Store } from 'lucide-react';
import Section from '../components/ui/Section';
import PlaceholderBadge from '../components/ui/Badge';
import { contact, contactForm } from '../data/contact';
import { services } from '../data/services';
import { getContactMethods } from '../lib/contactMethods';

const ICONS = { email: Mail, whatsapp: MessageCircle, linkedin: Linkedin, github: Github, upwork: Store, fiverr: Store };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ContactMethods() {
  const methods = getContactMethods();

  return (
    <ul className="space-y-3">
      {methods.map((method) => {
        const Icon = ICONS[method.id] ?? Mail;
        const inner = (
          <>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-signal">
              <Icon size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">{method.label}</span>
              {method.href ? (
                <span className="block truncate font-display text-sm text-white">{method.value}</span>
              ) : (
                <span className="mt-0.5 block">
                  <PlaceholderBadge>Not added yet</PlaceholderBadge>
                </span>
              )}
            </span>
          </>
        );

        return (
          <li key={method.id}>
            {method.href ? (
              <a
                href={method.href}
                target={method.id === 'email' ? undefined : '_blank'}
                rel={method.id === 'email' ? undefined : 'noopener noreferrer'}
                className="hud-card flex items-center gap-4 p-4 transition-colors hover:bg-brand-soft/50"
              >
                {inner}
              </a>
            ) : (
              <div className="hud-card flex items-center gap-4 p-4">{inner}</div>
            )}
          </li>
        );
      })}
      <li>
        <div className="flex items-center gap-4 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 text-slate-400">
            <MapPin size={18} aria-hidden="true" />
          </span>
          <span>
            <span className="block font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Location</span>
            <span className="block font-display text-sm text-white">{contact.location}</span>
          </span>
        </div>
      </li>
    </ul>
  );
}

const fieldClass =
  'mt-2 w-full rounded-xl border border-white/20 bg-ink-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40';

function ContactForm() {
  const connected = Boolean(contactForm.endpoint);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errors, setErrors] = useState({});
  const [errorText, setErrorText] = useState('');
  const startedAt = useRef(Date.now());

  if (!connected) {
    return (
      <div className="hud-card p-8">
        <PlaceholderBadge>Form not connected</PlaceholderBadge>
        <p className="mt-4 font-display text-lg font-semibold text-white">The contact form is not active yet.</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Please use one of the contact methods listed here in the meantime.
        </p>
      </div>
    );
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    // Honeypot: real visitors never fill this hidden field.
    if (data.website) return;

    const nextErrors = {};
    if (!data.name || !data.name.trim()) nextErrors.name = 'Please enter your name.';
    if (!EMAIL_PATTERN.test(data.email || '')) nextErrors.email = 'Please enter a valid email address.';
    if (!data.subject || data.subject.trim().length < 3) nextErrors.subject = 'Please enter a subject.';
    if (!data.message || data.message.trim().length < 10) nextErrors.message = 'Please write at least a short message.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus('sending');
    try {
      const response = await fetch(contactForm.endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          subject: `${data.subject.trim()} (${data.projectType})`,
          message: data.message.trim(),
          website: data.website,
          startedAt: startedAt.current,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.ok) throw new Error(json.error || 'Failed');
      form.reset();
      startedAt.current = Date.now();
      setErrorText('');
      setStatus('sent');
    } catch (err) {
      setErrorText(err && err.message && err.message !== 'Failed' ? err.message : '');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="hud-card space-y-5 p-6 sm:p-8" aria-label="Contact form">
      <div>
        <label htmlFor="cf-name" className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">
          Name
        </label>
        <input
          id="cf-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className={fieldClass}
          aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={errors.name ? 'cf-name-err' : undefined}
        />
        {errors.name ? (
          <p id="cf-name-err" className="mt-1.5 text-xs text-amber-glow">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="cf-email" className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">
          Email
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldClass}
          aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={errors.email ? 'cf-email-err' : undefined}
        />
        {errors.email ? (
          <p id="cf-email-err" className="mt-1.5 text-xs text-amber-glow">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="cf-subject" className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">
          Subject
        </label>
        <input
          id="cf-subject"
          name="subject"
          type="text"
          required
          className={fieldClass}
          aria-invalid={errors.subject ? 'true' : undefined}
          aria-describedby={errors.subject ? 'cf-subject-err' : undefined}
        />
        {errors.subject ? (
          <p id="cf-subject-err" className="mt-1.5 text-xs text-amber-glow">
            {errors.subject}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="cf-type" className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">
          Project type
        </label>
        <select id="cf-type" name="projectType" className={fieldClass} defaultValue={services[0].title}>
          {services.map((s) => (
            <option key={s.id} value={s.title}>
              {s.title}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="cf-message" className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">
          Message
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          required
          className={fieldClass}
          aria-invalid={errors.message ? 'true' : undefined}
          aria-describedby={errors.message ? 'cf-message-err' : undefined}
        />
        {errors.message ? (
          <p id="cf-message-err" className="mt-1.5 text-xs text-amber-glow">
            {errors.message}
          </p>
        ) : null}
      </div>

      {/* honeypot */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="cf-website">Leave this field empty</label>
        <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={status === 'sending'}>
        {status === 'sending' ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>

      <div role="status" aria-live="polite" className="min-h-[1.5rem] text-sm">
        {status === 'sent' ? (
          <p className="text-signal-soft">
            Thank you. Your message has been sent and I will reply by email soon.
          </p>
        ) : null}
        {status === 'error' ? (
          <p className="text-amber-glow">{errorText || 'Something went wrong and your message was not sent. Please try again or use a direct contact method.'}</p>
        ) : null}
      </div>
    </form>
  );
}

export default function Contact() {
  return (
    <Section
      id="contact"
      index={9}
      label="Contact Me"
      title="Let's talk about your website."
      intro="Tell me about your project and what you need it to achieve."
    >
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div data-reveal>
          <ContactMethods />
          <div className="mt-6">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Find me on</p>
            <SocialLinks />
          </div>
        </div>
        <div data-reveal data-reveal-delay="0.1">
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}
