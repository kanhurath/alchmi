import { useBookingModal } from '../../context/BookingModalContext';
import './EventsSection.css';

// Stagger delay cycles: 0 → '', 1 → ' reveal-delay-1', 2 → ' reveal-delay-2'
const stagger = (i) => ['', ' reveal-delay-1', ' reveal-delay-2'][i % 3];

function EventsSection({ upcoming = [], completed = [] }) {
  const { openModal } = useBookingModal();
  return (
    <>
      <div className="events-content-wrap">

        {/* ── UPCOMING EVENTS ── */}
        <div className="upcoming-section">
          <div className="events-section-header reveal">
            <div className="events-section-header-left">
              <span className="section-numeral">i.</span>
              <h2>Upcoming <em>Events</em></h2>
            </div>
            <span className="events-count-badge">{upcoming.length} Scheduled</span>
          </div>

          <div className="upcoming-grid">
            {upcoming.map((ev, i) => (
              <div
                key={ev.id}
                className={`upcoming-card${ev.featured ? ' featured' : ''} reveal${stagger(i)}`}
                onClick={openModal}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') openModal(); }}
                role="button"
                tabIndex={0}
              >
                <div className="event-date-block">
                  <span className="event-day">{ev.day}</span>
                  <span className="event-month">{ev.month}</span>
                  <span className="event-year">{ev.year}</span>
                </div>
                <div className="upcoming-content">
                  <div className="event-type-tag">{ev.type}</div>
                  <div className="event-title">{ev.title}</div>
                  <p className="event-desc">{ev.description}</p>
                  <div className="event-meta-row">
                    {(ev.meta || []).map((m, mi) => (
                      <span key={mi} className="event-meta-item">
                        <span className="meta-icon">{m.icon}</span> {m.text}
                      </span>
                    ))}
                    <span className="event-register-btn">{ev.register_label}</span>
                  </div>
                  {ev.spots_percent != null && (
                    <>
                      <div className="spots-bar">
                        <div className="spots-fill" style={{ width: `${ev.spots_percent}%` }} />
                      </div>
                      <div className="spots-label">{ev.spots_label}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COMPLETED EVENTS ── */}
        <div className="completed-section">
          <div className="events-section-header reveal">
            <div className="events-section-header-left">
              <span className="section-numeral">ii.</span>
              <h2>Completed <em>Events</em></h2>
            </div>
            <span className="events-count-badge muted">{completed.length} Past</span>
          </div>

          <div className="completed-list">
            {completed.map((ev, i) => (
              <a
                key={ev.id}
                className={`completed-item reveal${stagger(i)}`}
                href={ev.url}
                target="_blank"
                rel="noreferrer"
              >
                <div className="completed-date">
                  <div className="comp-day">{ev.day}</div>
                  <div className="comp-month">{ev.month}</div>
                </div>
                <div className="completed-content">
                  <div className="completed-type">{ev.type}</div>
                  <div className="completed-title">{ev.title}</div>
                  <div className="completed-meta">
                    {(ev.meta || []).map((m, mi) => <span key={mi}>{m}</span>)}
                  </div>
                </div>
                <div className="completed-status">
                  <span className="dot" /> Completed
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

export default EventsSection;
