import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBookingModal } from '../../context/BookingModalContext';
import './WorkshopsSection.css';

const stagger = (i) => ['', ' reveal-delay-1', ' reveal-delay-2'][i % 3];

function WorkshopsSection({
  intro        = {},
  filters      = [],
  cards        = [],
  retreats     = [],
  testimonials = [],
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const { openModal } = useBookingModal();

  const visibleCards = activeFilter === 'all'
    ? cards
    : cards.filter(c => (c.cat_keys || '').includes(activeFilter));

  const featuredVisible = visibleCards.find(c => c.featured);

  // Always prepend the "All Programs" entry
  const allFilters = [
    { key_name: 'all', label: 'All Programs' },
    ...filters,
  ];

  return (
    <>
      {/* ── INTRO BAND ── */}
      <div className="ws-page-intro reveal">
        <div className="ws-page-intro-left">
          <div className="ws-page-eyebrow">{intro.eyebrow}</div>
          <h2 className="ws-page-title">
            {intro.title} <em>{intro.title_em}</em>
          </h2>
          <p className="ws-page-intro-desc">{intro.description}</p>
        </div>
        <button className="ws-enquire-btn" onClick={openModal}>
          {intro.btn_label || 'Book a Session'}
        </button>
      </div>

      {/* ── FILTER STRIP ── */}
      <div className="ws-filter-strip">
        <span className="ws-filter-label">Filter</span>
        {allFilters.map(f => (
          <button
            key={f.key_name}
            className={`ws-filter-btn${activeFilter === f.key_name ? ' active' : ''}`}
            onClick={() => setActiveFilter(f.key_name)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── WORKSHOP CARDS ── */}
      <div className="ws-workshops-grid-wrapper">
        <div className="ws-workshops-grid">
          {visibleCards.map((card, i) => (
            <div
              key={card.id}
              className={`ws-workshop-card${card.featured && featuredVisible ? ' featured' : ''} reveal${stagger(i)}`}
            >
              <div className="ws-card-accent">
                <span className="ws-card-glyph">{card.glyph}</span>
                <span className="ws-card-format">{card.format}</span>
              </div>
              <div className="ws-card-body">
                <div className="ws-card-tag">{card.tag}</div>
                <div className="ws-card-title">{card.title}</div>
                <p className="ws-card-desc">{card.description}</p>
                <div className="ws-card-specs">
                  {(card.specs || []).map((s, si) => (
                    <span key={si} className="ws-spec-item">
                      <span className="ws-spec-icon">{s.icon}</span> {s.text}
                    </span>
                  ))}
                </div>
                <div className="ws-card-cta-row">
                  <span className="ws-card-audience">{card.audience}</span>
                  <button
                    type="button"
                    className="ws-card-link"
                    onClick={openModal}
                  >
                    {card.cta_label}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RETREATS ── */}
      <div className="ws-retreat-section">
        <div className="ws-section-divider-label reveal">Residential Retreats</div>
        <div className="ws-retreats-grid">
          {retreats.map((r, i) => (
            <div key={r.id} className={`ws-retreat-card reveal${stagger(i)}`}>
              <span className="ws-retreat-numeral">{r.numeral}</span>
              <div className="ws-retreat-title">{r.title}</div>
              <div className="ws-retreat-sub">{r.sub}</div>
              <p className="ws-retreat-desc">{r.description}</p>
              <div className="ws-retreat-footer">{r.footer}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div className="ws-testimonial-strip">
        {testimonials.map((t, i) => (
          <div key={t.id} className={`ws-testimonial reveal${stagger(i)}`}>
            <p className="ws-t-quote">{t.quote}</p>
            <div className="ws-t-name">{t.name}</div>
            <div className="ws-t-role">{t.role}</div>
          </div>
        ))}
      </div>

      <div className="ws-testimonials-cta reveal">
        <Link to="/testimonials" className="ws-view-all-btn">
          View All Testimonials
        </Link>
      </div>
    </>
  );
}

export default WorkshopsSection;
