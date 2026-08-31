import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useBookingModal } from '../../context/BookingModalContext';
import { STATIC_THUMB_MAP } from '../../pages/TalksPage';
import { uploadUrl } from '../../services/apiUtils';
import './TalksListSection.css';

// ── Thumbnail resolution ──────────────────────────────────────────────────────
// Priority: uploaded/CMS URL → bundled static image fallback by id
function resolveThumb(video) {
  if (video.thumb_url) return uploadUrl(video.thumb_url);
  return STATIC_THUMB_MAP[video.id] || null;
}

// ── YouTube embed ID extractor ────────────────────────────────────────────────
function getYouTubeId(url) {
  const m = (url || '').match(/youtu\.be\/([^?]+)/) || (url || '').match(/[?&]v=([^&]+)/);
  return m ? m[1] : null;
}

// ── Component ─────────────────────────────────────────────────────────────────

function TalksListSection({ videos = [], sidebar = {} }) {
  const [active,      setActive]      = useState('All');
  const [activeVideo, setActiveVideo] = useState(null);
  const mainRef = useRef(null);
  const { openModal } = useBookingModal();

  // Derive unique filter types from the live video list
  const filterTypes = ['All', ...Array.from(new Set(
    videos.map(v => v.type?.trim()).filter(Boolean)
  ))];

  const filtered = active === 'All'
    ? videos
    : videos.filter(v => v.type?.trim() === active);

  // Re-run intersection observer when filter changes so newly visible cards animate in
  useEffect(() => {
    const container = mainRef.current;
    if (!container) return;
    const els = container.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08 }
    );
    els.forEach(el => { el.classList.remove('visible'); observer.observe(el); });
    return () => observer.disconnect();
  }, [active, videos]);

  // Keyboard / scroll-lock for video modal
  useEffect(() => {
    if (activeVideo === null) return;
    const onKey = (e) => { if (e.key === 'Escape') setActiveVideo(null); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [activeVideo]);

  // Compute type breakdown for sidebar (always from live list, not hardcoded)
  const typeBreakdown = Array.from(
    videos.reduce((map, v) => {
      const t = v.type?.trim();
      if (t) map.set(t, (map.get(t) || 0) + 1);
      return map;
    }, new Map())
  ).map(([type, count]) => ({ type, count }));

  const countText = active === 'All'
    ? `${videos.length} Talks, Interviews &amp; Podcasts`
    : `${filtered.length} ${active}${filtered.length !== 1 ? 's' : ''}`;

  const staggerDelay = (i) => ['', ' reveal-delay-1', ' reveal-delay-2'][i % 3];

  return (
    <>
      {/* ── FILTER STRIP ── */}
      <div className="talks-filter-strip">
        <span className="talks-filter-label">Filter</span>
        {filterTypes.map(f => (
          <button
            key={f}
            className={`talks-filter-btn${active === f ? ' active' : ''}`}
            onClick={() => setActive(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── MAIN ── */}
      <div className="talks-main" ref={mainRef}>
        <div className="talks-list">
          <div className="talks-count" dangerouslySetInnerHTML={{ __html: countText }} />

          {filtered.map((talk, i) => {
            const thumb = resolveThumb(talk);
            return (
              <div
                key={talk.id}
                className={`talk-card-item reveal${staggerDelay(i)}`}
                onClick={() => setActiveVideo(talk)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveVideo(talk); }}
                data-type={talk.type}
              >
                <div className="talk-thumb-wrap">
                  <div className="talk-thumb-placeholder">
                    {thumb
                      ? <img src={thumb} alt={talk.title} className="talk-thumb-img" />
                      : <div className="talk-thumb-empty" />
                    }
                  </div>
                  <span className="talk-type-badge">{talk.type}</span>
                  <div className="play-btn" />
                </div>
                <div className="talk-content">
                  <div className="talk-tags">
                    {(talk.tags || []).map(t => (
                      <span key={t} className="talk-tag">{t.trim()}</span>
                    ))}
                  </div>
                  <div className="talk-title">{talk.title?.trim()}</div>
                  <p className="talk-desc">{talk.description?.trim()}</p>
                  <div className="talk-meta">
                    <span className="talk-date">{talk.date_text?.trim()}</span>
                    <span className="talk-host">{talk.host?.trim()}</span>
                    <span className="talk-watch">{talk.watch_label || 'Watch'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── SIDEBAR ── */}
        <aside className="talks-sidebar">
          {/* By Format */}
          <div className="sidebar-block reveal">
            <div className="sidebar-title">By Format</div>
            <ul className="type-list">
              {typeBreakdown.map(t => (
                <li key={t.type} onClick={() => setActive(t.type)} style={{ cursor: 'pointer' }}>
                  {t.type} <span className="type-count">{t.count}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pull Quote */}
          {sidebar.quote_text && (
            <div className="sidebar-block reveal reveal-delay-1">
              <div className="sidebar-title">In His Words</div>
              <p className="sidebar-quote">
                <em>{sidebar.quote_text}</em>
              </p>
              {sidebar.quote_attr && (
                <p className="sidebar-quote-attr">{sidebar.quote_attr}</p>
              )}
            </div>
          )}

          {/* Invite block */}
          <div className="sidebar-block sidebar-invite reveal reveal-delay-2">
            <div className="sidebar-title">{sidebar.invite_title || 'Invite Vinay'}</div>
            <p>{sidebar.invite_text || 'Vinay speaks on IKS, Dharmic leadership, education, and civilizational futures.'}</p>
            <button className="sidebar-btn" onClick={openModal}>
              {sidebar.invite_btn_label || 'Book a Session'}
            </button>
            <Link to="/connect" className="sidebar-btn outline">Send an Enquiry</Link>
          </div>
        </aside>
      </div>

      {/* ── VIDEO MODAL ── */}
      {activeVideo && (
        <div
          className="tl-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveVideo(null); }}
        >
          <div className="tl-modal-inner">
            <div className="tl-modal-header">
              <div className="tl-modal-meta">
                <span className="tl-modal-type">{activeVideo.type}</span>
                <div className="tl-modal-title">{activeVideo.title?.trim()}</div>
                <div className="tl-modal-info">
                  <span>{activeVideo.date_text}</span>
                  <span className="tl-modal-dot">·</span>
                  <span>{activeVideo.host}</span>
                </div>
              </div>
              <button
                className="tl-modal-close"
                onClick={() => setActiveVideo(null)}
                aria-label="Close video"
              >&#x2715;</button>
            </div>
            <div className="tl-embed-wrap">
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(activeVideo.video_url)}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TalksListSection;
