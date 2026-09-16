import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageSeo } from '../components/PageSeo';
import {
  getBookingSettings,
  getActiveDurations,
  getPaymentPublic,
  getAvailability,
  getDateAvailability,
  createOrder,
  verifyPayment,
  submitManualBooking,
} from '../services/bookingApi';
import './BookingPage.css';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('rzp-script')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id  = 'rzp-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const STEPS = ['Duration', 'Details', 'Review & Pay'];

// ── Step 1: Duration selection ────────────────────────────────────────────────
function StepDuration({ durations, selectedId, onSelect, onNext }) {
  return (
    <div>
      <div className="bk-section-heading">
        <p className="bk-section-label">Step 1 of 3</p>
        <h2 className="bk-section-title">Choose Session Duration</h2>
      </div>
      <div className="bk-durations">
        {durations.map(d => (
          <button
            key={d.id}
            className={`bk-dur-card${selectedId === d.id ? ' selected' : ''}`}
            onClick={() => onSelect(d)}
          >
            <div className="bk-dur-check">
              <svg viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" /></svg>
            </div>
            <div className="bk-dur-label">{d.label}</div>
            <div className="bk-dur-price">{formatINR(d.price)}</div>
            {d.description && <div className="bk-dur-desc">{d.description}</div>}
          </button>
        ))}
      </div>
      <div className="bk-nav">
        <span />
        <button className="bk-btn bk-btn-primary" onClick={onNext} disabled={!selectedId}>
          Continue →
        </button>
      </div>
    </div>
  );
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ── Step 2: Customer details ───────────────────────────────────────────────────
function StepDetails({ form, onChange, selectedDuration, onBack, onNext, availability }) {
  const [errors,        setErrors]        = useState({});
  const [dateSlots,     setDateSlots]     = useState([]);
  const [bookedSlots,   setBookedSlots]   = useState([]);
  const [isCustomSched, setIsCustomSched] = useState(false);
  const [slotsLoading,  setSlotsLoading]  = useState(false);
  const [dateError,     setDateError]     = useState('');

  const availableDays  = availability?.available_days || [1,2,3,4,5];
  const blockedDates   = availability?.blocked_dates  || [];

  // Validate the chosen date against day-of-week rules and blocked dates
  const validateDate = (dateStr) => {
    if (!dateStr) return '';
    const dow = new Date(dateStr + 'T12:00:00').getDay();
    if (!availableDays.includes(dow))
      return `${DAY_NAMES[dow]}s are not available for booking. Please choose another day.`;
    if (blockedDates.includes(dateStr))
      return 'This date is unavailable. Please choose another date.';
    return '';
  };

  const handleDateChange = (dateStr) => {
    const err = validateDate(dateStr);
    setDateError(err);
    onChange('booking_date', dateStr);
    onChange('booking_time', '');
  };

  // Fetch date-specific slots + booked slots in one request
  useEffect(() => {
    if (!form.booking_date || dateError) {
      setDateSlots([]); setBookedSlots([]); setIsCustomSched(false); return;
    }
    setSlotsLoading(true);
    getDateAvailability(form.booking_date)
      .then(({ slots, booked, is_custom }) => {
        setDateSlots(slots || []);
        setBookedSlots(booked || []);
        setIsCustomSched(!!is_custom);
        if (form.booking_time && (booked || []).includes(form.booking_time)) onChange('booking_time', '');
      })
      .catch(() => { setDateSlots([]); setBookedSlots([]); setIsCustomSched(false); })
      .finally(() => setSlotsLoading(false));
  }, [form.booking_date, dateError]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = () => {
    const e = {};
    if (!form.customer_name.trim())  e.customer_name  = 'Name is required';
    if (!form.customer_email.trim()) e.customer_email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.customer_email)) e.customer_email = 'Enter a valid email address';
    if (!form.customer_phone.trim()) e.customer_phone = 'Phone number is required';
    else if (!/^[+\d][\d\s\-().]{6,19}$/.test(form.customer_phone.trim())) e.customer_phone = 'Enter a valid phone number';
    if (!form.booking_date || dateError) e.booking_date = dateError || 'Please select a date';
    if (!form.booking_time) e.booking_time = 'Please select a time slot';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const today        = new Date().toISOString().split('T')[0];
  const freeSlots    = dateSlots.filter(s => !bookedSlots.includes(s.label));
  const allBooked    = form.booking_date && !dateError && !slotsLoading && dateSlots.length > 0 && freeSlots.length === 0;

  // Build hint showing which days are open
  const openDayNames = availableDays.map(d => DAY_NAMES[d]).join(', ');

  return (
    <div>
      <div className="bk-section-heading">
        <p className="bk-section-label">Step 2 of 3</p>
        <h2 className="bk-section-title">Your Details</h2>
      </div>

      <div className="bk-form">
        <div className="bk-form-row">
          <div className="bk-field">
            <label>Full Name <span className="req">*</span></label>
            <input type="text" value={form.customer_name}
              onChange={e => onChange('customer_name', e.target.value)} placeholder="Your full name" />
            {errors.customer_name && <span className="bk-field-error">{errors.customer_name}</span>}
          </div>
          <div className="bk-field">
            <label>Email Address <span className="req">*</span></label>
            <input type="email" value={form.customer_email}
              onChange={e => onChange('customer_email', e.target.value)} placeholder="you@example.com" />
            {errors.customer_email && <span className="bk-field-error">{errors.customer_email}</span>}
          </div>
        </div>

        <div className="bk-form-row">
          <div className="bk-field">
            <label>Phone Number <span className="req">*</span></label>
            <input type="tel" value={form.customer_phone}
              onChange={e => onChange('customer_phone', e.target.value)} placeholder="+91 98765 43210" />
            {errors.customer_phone && <span className="bk-field-error">{errors.customer_phone}</span>}
          </div>
          <div className="bk-field" />
        </div>

        <div className="bk-datetime-row">
          <div className="bk-field">
            <label>
              Preferred Date <span className="req">*</span>
            </label>
            <input type="date" value={form.booking_date} min={today}
              onChange={e => handleDateChange(e.target.value)} />
            {openDayNames && (
              <span className="bk-slots-avail" style={{ marginLeft: 0 }}>Available: {openDayNames}</span>
            )}
            {(dateError || errors.booking_date) && (
              <span className="bk-field-error">{dateError || errors.booking_date}</span>
            )}
          </div>

          <div className="bk-field">
            <label>
              Preferred Time <span className="req">*</span>
              {form.booking_date && !dateError && !slotsLoading && dateSlots.length > 0 && (
                <span className="bk-slots-avail">{freeSlots.length} of {dateSlots.length} available{isCustomSched ? ' (custom schedule)' : ''}</span>
              )}
              {slotsLoading && <span className="bk-slots-loading">Checking availability…</span>}
            </label>
            <select value={form.booking_time}
              onChange={e => onChange('booking_time', e.target.value)}
              disabled={slotsLoading || !form.booking_date || !!dateError || dateSlots.length === 0}>
              <option value="">
                {!form.booking_date ? 'Select a date first'
                  : dateError ? 'Date unavailable'
                  : slotsLoading ? 'Checking availability…'
                  : dateSlots.length === 0 ? 'No time slots configured'
                  : 'Select a time slot'}
              </option>
              {dateSlots.map(slot => {
                const booked = bookedSlots.includes(slot.label);
                return (
                  <option key={slot.id} value={slot.label} disabled={booked}>
                    {slot.label}{booked ? ' — Booked' : ''}
                  </option>
                );
              })}
            </select>
            {errors.booking_time && <span className="bk-field-error">{errors.booking_time}</span>}
            {allBooked && (
              <span className="bk-field-error">All slots are booked for this date. Please choose another date.</span>
            )}
          </div>
        </div>

        <div className="bk-field">
          <label>Session Requirements</label>
          <textarea value={form.session_requirements}
            onChange={e => onChange('session_requirements', e.target.value)}
            placeholder="Briefly describe what you'd like to explore or achieve in this session…" rows={4} />
        </div>
      </div>

      {selectedDuration && (
        <div className="bk-price-summary">
          <div>
            <div className="bk-price-label">Session Total</div>
            <div className="bk-price-duration">{selectedDuration.label}</div>
          </div>
          <div className="bk-price-amount">{formatINR(selectedDuration.price)}</div>
        </div>
      )}

      <div className="bk-nav">
        <button className="bk-btn bk-btn-secondary" onClick={onBack}>← Back</button>
        <button className="bk-btn bk-btn-primary" onClick={() => { if (validate()) onNext(); }}
          disabled={slotsLoading || allBooked}>
          Review Booking →
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Review & pay ───────────────────────────────────────────────────────
function StepReview({ form, selectedDuration, onBack, onPay, paying, payError, gatewayEnabled }) {
  return (
    <div>
      <div className="bk-section-heading">
        <p className="bk-section-label">Step 3 of 3</p>
        <h2 className="bk-section-title">Review &amp; Confirm</h2>
      </div>

      <div className="bk-review-grid">
        <div className="bk-review-block">
          <h4>Session Details</h4>
          <div className="bk-review-item">
            <span className="bk-review-item-label">Duration</span>
            <span className="bk-review-item-value">{selectedDuration?.label}</span>
          </div>
          <div className="bk-review-item">
            <span className="bk-review-item-label">Date</span>
            <span className="bk-review-item-value">{form.booking_date}</span>
          </div>
          <div className="bk-review-item">
            <span className="bk-review-item-label">Time</span>
            <span className="bk-review-item-value">{form.booking_time}</span>
          </div>
          {form.session_requirements && (
            <div className="bk-review-item" style={{ flexDirection: 'column', gap: '0.2rem' }}>
              <span className="bk-review-item-label">Requirements</span>
              <span className="bk-review-item-value" style={{ fontSize: '0.95rem' }}>{form.session_requirements}</span>
            </div>
          )}
        </div>

        <div className="bk-review-block">
          <h4>Your Information</h4>
          <div className="bk-review-item">
            <span className="bk-review-item-label">Name</span>
            <span className="bk-review-item-value">{form.customer_name}</span>
          </div>
          <div className="bk-review-item">
            <span className="bk-review-item-label">Email</span>
            <span className="bk-review-item-value">{form.customer_email}</span>
          </div>
          {form.customer_phone && (
            <div className="bk-review-item">
              <span className="bk-review-item-label">Phone</span>
              <span className="bk-review-item-value">{form.customer_phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bk-review-total">
        <span className="bk-review-total-label">Total Amount</span>
        <span className="bk-review-total-amount">{selectedDuration ? formatINR(selectedDuration.price) : '—'}</span>
      </div>

      {payError && <div className="bk-error">{payError}</div>}

      <div className="bk-nav" style={{ marginTop: '1.5rem' }}>
        <button className="bk-btn bk-btn-secondary" onClick={onBack} disabled={paying}>← Back</button>
        {gatewayEnabled ? (
          <button className="bk-btn bk-btn-pay" onClick={onPay} disabled={paying}>
            {paying ? 'Processing…' : `Pay ${selectedDuration ? formatINR(selectedDuration.price) : ''} →`}
          </button>
        ) : (
          <button className="bk-btn bk-btn-pay" onClick={onPay} disabled={paying}>
            {paying ? 'Submitting…' : 'Submit Booking Request →'}
          </button>
        )}
      </div>

      {gatewayEnabled && (
        <div className="bk-rzp-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Secured by Razorpay. Your payment details are encrypted and never stored on our servers.
        </div>
      )}
    </div>
  );
}

// ── Confirmation screen ────────────────────────────────────────────────────────
function Confirmation({ bookingRef, form, selectedDuration, confirmationTitle, confirmationMessage }) {
  const dateFormatted = form.booking_date
    ? new Date(form.booking_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="bk-confirm">

      {/* ── Dark banner ── */}
      <div className="bk-confirm-banner">
        <div className="bk-confirm-check">
          <svg viewBox="0 0 24 24"><polyline points="4,12 9,17 20,7" /></svg>
        </div>
        <p className="bk-confirm-banner-label">Booking Confirmed</p>
        <h2 className="bk-confirm-banner-title">
          {confirmationTitle
            ? confirmationTitle
            : <>Your <em>Discovery Session</em> is Booked</>}
        </h2>
        <p className="bk-confirm-banner-msg">
          {confirmationMessage || 'A confirmation email has been sent to you with all session details. Vinay looks forward to connecting with you.'}
        </p>
      </div>

      {/* ── Reference pill ── */}
      <div style={{ textAlign: 'center' }}>
        <div className="bk-confirm-ref-pill">
          <span className="bk-confirm-ref-pill-label">Booking Ref</span>
          <span className="bk-confirm-ref-pill-value">{bookingRef}</span>
        </div>
      </div>

      {/* ── Receipt card ── */}
      <div className="bk-confirm-receipt">
        <div className="bk-confirm-receipt-header">
          <span className="bk-confirm-receipt-heading">Session Receipt</span>
          <span className="bk-confirm-receipt-heading" style={{ color: '#2e7d32' }}>✓ Payment Received</span>
        </div>

        <div className="bk-confirm-receipt-body">
          <div className="bk-confirm-receipt-cell">
            <div className="bk-confirm-receipt-cell-label">Customer Name</div>
            <div className="bk-confirm-receipt-cell-value">{form.customer_name}</div>
          </div>
          <div className="bk-confirm-receipt-cell">
            <div className="bk-confirm-receipt-cell-label">Email Address</div>
            <div className="bk-confirm-receipt-cell-value">{form.customer_email}</div>
          </div>
          <div className="bk-confirm-receipt-cell">
            <div className="bk-confirm-receipt-cell-label">Session Duration</div>
            <div className="bk-confirm-receipt-cell-value accent">{selectedDuration?.label}</div>
          </div>
          <div className="bk-confirm-receipt-cell">
            <div className="bk-confirm-receipt-cell-label">Preferred Date</div>
            <div className="bk-confirm-receipt-cell-value">{dateFormatted}</div>
          </div>
          <div className="bk-confirm-receipt-cell">
            <div className="bk-confirm-receipt-cell-label">Preferred Time</div>
            <div className="bk-confirm-receipt-cell-value">{form.booking_time || '—'}</div>
          </div>
          {form.customer_phone && (
            <div className="bk-confirm-receipt-cell">
              <div className="bk-confirm-receipt-cell-label">Phone Number</div>
              <div className="bk-confirm-receipt-cell-value">{form.customer_phone}</div>
            </div>
          )}
        </div>

        <div className="bk-confirm-total">
          <span className="bk-confirm-total-label">Total Paid</span>
          <span className="bk-confirm-total-amount">{selectedDuration ? formatINR(selectedDuration.price) : '—'}</span>
        </div>
      </div>

      {/* ── What happens next ── */}
      <div className="bk-confirm-steps">
        <p className="bk-confirm-steps-heading">What Happens Next</p>
        <div className="bk-confirm-steps-list">
          <div className="bk-confirm-step-item">
            <div className="bk-confirm-step-num">1</div>
            <p className="bk-confirm-step-text">Check your inbox — a confirmation email with your booking details has been sent to <strong>{form.customer_email}</strong>.</p>
          </div>
          <div className="bk-confirm-step-item">
            <div className="bk-confirm-step-num">2</div>
            <p className="bk-confirm-step-text">You will receive a calendar invite and the session link closer to your scheduled date.</p>
          </div>
          <div className="bk-confirm-step-item">
            <div className="bk-confirm-step-num">3</div>
            <p className="bk-confirm-step-text">If you need to reschedule or have any questions, simply reply to the confirmation email.</p>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="bk-confirm-actions">
        <Link to="/" className="bk-btn bk-btn-secondary" style={{ textDecoration: 'none' }}>
          ← Return to Home
        </Link>
        <Link to="/connect" className="bk-btn bk-btn-primary" style={{ textDecoration: 'none' }}>
          Contact Us
        </Link>
      </div>

    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const [settings,     setSettings]     = useState(null);
  const [durations,    setDurations]    = useState([]);
  const [gateway,      setGateway]      = useState({ is_enabled: false, key_id: null });
  const [availability, setAvailability] = useState({ time_slots: [], available_days: [1,2,3,4,5], blocked_dates: [] });
  const [loading,      setLoading]      = useState(true);

  const [step,     setStep]     = useState(0);
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    session_requirements: '', booking_date: '', booking_time: '',
  });

  const [paying,    setPaying]    = useState(false);
  const [payError,  setPayError]  = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  useEffect(() => {
    Promise.all([
      getBookingSettings().catch(() => ({})),
      getActiveDurations().catch(() => []),
      getPaymentPublic().catch(() => ({ is_enabled: false })),
      getAvailability().catch(() => ({ time_slots: [], available_days: [1,2,3,4,5], blocked_dates: [] })),
    ]).then(([s, d, g, av]) => {
      setSettings(s);
      setDurations(d);
      setGateway(g);
      setAvailability(av);
      setLoading(false);
    });
  }, []);

  const handleFormChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePay = async () => {
    setPayError('');
    setPaying(true);
    try {
      if (gateway.is_enabled) {
        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error('Razorpay failed to load. Please check your connection.');

        const orderData = await createOrder({
          duration_id: selected.id,
          ...form,
        });

        await new Promise((resolve, reject) => {
          const options = {
            key:         gateway.key_id,
            amount:      orderData.amount,
            currency:    orderData.currency,
            name:        settings?.page_title || 'Discovery Session',
            description: selected.label,
            order_id:    orderData.order_id,
            prefill: {
              name:    form.customer_name,
              email:   form.customer_email,
              contact: form.customer_phone,
            },
            theme: { color: '#b8922a' },
            handler: async (response) => {
              try {
                const result = await verifyPayment({
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                });
                setBookingRef(result.booking_ref || orderData.booking_ref);
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            modal: {
              ondismiss: () => reject(new Error('Payment cancelled. Please try again.')),
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        });
      } else {
        // Payment gateway not configured — submit as offline/pending booking
        const result = await submitManualBooking({
          duration_id:          selected.id,
          customer_name:        form.customer_name,
          customer_email:       form.customer_email,
          customer_phone:       form.customer_phone,
          session_requirements: form.session_requirements,
          booking_date:         form.booking_date,
          booking_time:         form.booking_time,
          payment_status:       'pending',
        });
        setBookingRef(result?.booking_ref || 'REQ-' + Date.now());
      }

      setConfirmed(true);
    } catch (err) {
      setPayError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="bk-loading">Loading session options…</div>;

  if (settings?.form_enabled === 0 || settings?.form_enabled === false) {
    return (
      <div className="bk-page">
        <div className="bk-form-disabled">
          <p>Booking is currently unavailable. Please check back soon.</p>
          <Link to="/">← Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bk-page">
      <PageSeo slug="booking" fallback={{ title: settings?.page_title || 'Book a Discovery Session' }} />

      {/* Hero */}
      <div className="bk-hero">
        <p className="bk-hero-eyebrow">{settings?.hero_eyebrow || 'One-on-One Session'}</p>
        <h1 className="bk-hero-title">
          {settings?.hero_title && settings?.hero_title_em
            ? settings.hero_title.replace(settings.hero_title_em, `<em>${settings.hero_title_em}</em>`)
              .split(/<em>|<\/em>/).map((part, i) =>
                i % 2 === 1 ? <em key={i}>{part}</em> : part
              )
            : (settings?.hero_title || 'Book a Discovery Session')}
        </h1>
        {settings?.hero_description && (
          <p className="bk-hero-desc">{settings.hero_description}</p>
        )}
      </div>

      <div className="bk-body">
        {confirmed ? (
          <Confirmation
            bookingRef={bookingRef}
            form={form}
            selectedDuration={selected}
            confirmationTitle={settings?.confirmation_title}
            confirmationMessage={settings?.confirmation_message}
          />
        ) : (
          <>
            {/* Step indicators */}
            <div className="bk-steps">
              {STEPS.map((label, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div className={`bk-step${step === i ? ' active' : step > i ? ' done' : ''}`}>
                    <div className="bk-step-num">
                      {step > i ? '✓' : i + 1}
                    </div>
                    <span className="bk-step-label">{label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className="bk-step-connector" />}
                </div>
              ))}
            </div>

            {step === 0 && (
              <StepDuration
                durations={durations}
                selectedId={selected?.id}
                onSelect={setSelected}
                onNext={() => setStep(1)}
              />
            )}
            {step === 1 && (
              <StepDetails
                form={form}
                onChange={handleFormChange}
                selectedDuration={selected}
                availability={availability}
                onBack={() => setStep(0)}
                onNext={() => { setPayError(''); setStep(2); }}
              />
            )}
            {step === 2 && (
              <StepReview
                form={form}
                selectedDuration={selected}
                onBack={() => setStep(1)}
                onPay={handlePay}
                paying={paying}
                payError={payError}
                gatewayEnabled={gateway.is_enabled}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
