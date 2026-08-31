import { useState } from 'react';
import './ContactForm.css';

function validate(id, value) {
  switch (id) {
    case 'name':    return value.trim().length >= 2;
    case 'email':   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    case 'subject': return value.trim().length >= 3;
    case 'message': return value.trim().length >= 10;
    default: return true;
  }
}

function ContactForm({ onSuccess }) {
  const [fields, setFields] = useState({ name: '', email: '', subject: '', message: '' });
  const [touched, setTouched] = useState({});
  const [validity, setValidity] = useState({});
  const [submitState, setSubmitState] = useState('idle');

  function handleChange(id, value) {
    setFields(f => ({ ...f, [id]: value }));
    if (validity[id] === false) {
      setValidity(v => ({ ...v, [id]: validate(id, value) }));
    }
  }

  function handleBlur(id) {
    const val = fields[id];
    setTouched(t => ({ ...t, [id]: true }));
    if (val.trim()) setValidity(v => ({ ...v, [id]: validate(id, val) }));
  }

  function fieldClass(id) {
    if (!touched[id]) return 'form-field';
    if (validity[id] === undefined) return 'form-field';
    return validity[id] ? 'form-field valid' : 'form-field error';
  }

  function reset() {
    setFields({ name: '', email: '', subject: '', message: '' });
    setTouched({});
    setValidity({});
    setSubmitState('idle');
  }

  async function handleSubmit() {
    const ids = ['name', 'email', 'subject', 'message'];
    const newValidity = {};
    let allValid = true;
    ids.forEach(id => {
      const ok = validate(id, fields[id]);
      newValidity[id] = ok;
      if (!ok) allValid = false;
    });
    setTouched({ name: true, email: true, subject: true, message: true });
    setValidity(newValidity);
    if (!allValid) return;

    setSubmitState('sending');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_KEY,
          name: fields.name,
          email: fields.email,
          subject: fields.subject,
          message: fields.message,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Submission failed');
      setSubmitState('sent');
      setTimeout(() => {
        reset();
        onSuccess?.();
      }, 4000);
    } catch {
      setSubmitState('idle');
      alert('Sorry, your message could not be sent. Please try again.');
    }
  }

  const charLen = fields.message.length;

  return (
    <div className="contact-form">
      <div className="form-header">
        <div className="form-header-title">Send a Message</div>
        <div className="form-header-sub">All fields required · Replies within 2–3 days</div>
      </div>

      <div className="form-row">
        <div className={fieldClass('name')}>
          <input
            type="text"
            className="field-input"
            id="cf-name"
            placeholder=" "
            autoComplete="name"
            value={fields.name}
            onChange={e => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
          />
          <label className="field-label" htmlFor="cf-name">Your Name</label>
          <span className="field-icon">✦</span>
          <div className="error-msg">Please enter your name</div>
        </div>
        <div className={fieldClass('email')}>
          <input
            type="email"
            className="field-input"
            id="cf-email"
            placeholder=" "
            autoComplete="email"
            value={fields.email}
            onChange={e => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
          />
          <label className="field-label" htmlFor="cf-email">Email Address</label>
          <span className="field-icon">@</span>
          <div className="error-msg">Enter a valid email</div>
        </div>
      </div>

      <div className={fieldClass('subject')}>
        <input
          type="text"
          className="field-input"
          id="cf-subject"
          placeholder=" "
          value={fields.subject}
          onChange={e => handleChange('subject', e.target.value)}
          onBlur={() => handleBlur('subject')}
        />
        <label className="field-label" htmlFor="cf-subject">Subject</label>
        <span className="field-icon">◈</span>
        <div className="error-msg">Please add a subject</div>
      </div>

      <div className={fieldClass('message')}>
        <textarea
          className="field-textarea"
          id="cf-message"
          placeholder=" "
          rows="4"
          maxLength="500"
          value={fields.message}
          onChange={e => handleChange('message', e.target.value)}
          onBlur={() => handleBlur('message')}
        />
        <label className="field-label" htmlFor="cf-message">Your Message</label>
        <div className={`char-counter${charLen > 420 ? ' warn' : ''}`}>{charLen} / 500</div>
        <div className="error-msg">Please write a message</div>
      </div>

      <button
        className={`form-submit${submitState === 'sending' ? ' sending' : submitState === 'sent' ? ' sent' : ''}`}
        type="button"
        onClick={handleSubmit}
      >
        {submitState === 'sent' ? 'Message Sent  ✓' : submitState === 'sending' ? 'Sending…' : 'Send Message  →'}
      </button>

      <div className="form-trust">Replies personally from Vinay</div>
    </div>
  );
}

export default ContactForm;
