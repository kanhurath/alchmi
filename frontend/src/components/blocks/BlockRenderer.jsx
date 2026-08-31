import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './BlockRenderer.css';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// All /uploads/* paths are root-relative — the browser resolves them against the current origin.
// In dev, vite.config.js proxies /uploads/ to the Express server.
// In production, Express serves /uploads/ at the same origin as the SPA.
const imgSrc = url => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return url; // root-relative /uploads/...
};

// ── Mandala SVG (shared with InnerPageHero) ───────────────────────────────────
function MandalaIcon() {
  return (
    <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" className="blk-mandala-svg">
      <g fill="none" stroke="rgba(139,46,51,0.22)" strokeWidth="0.8">
        <circle cx="250" cy="250" r="240"/><circle cx="250" cy="250" r="210"/>
        <circle cx="250" cy="250" r="180"/><circle cx="250" cy="250" r="145"/>
        <circle cx="250" cy="250" r="110"/><circle cx="250" cy="250" r="78"/>
        <circle cx="250" cy="250" r="48"/> <circle cx="250" cy="250" r="22"/>
        <line x1="250" y1="10"  x2="250" y2="490"/>
        <line x1="10"  y1="250" x2="490" y2="250"/>
        <line x1="80"  y1="80"  x2="420" y2="420"/>
        <line x1="420" y1="80"  x2="80"  y2="420"/>
        <polygon points="250,52 452,390 48,390"/>
        <polygon points="250,448 48,110 452,110"/>
        {[0,45,90,135,180,225,270,315].map(r => (
          <ellipse key={r} cx="250" cy="22" rx="14" ry="28" transform={`rotate(${r} 250 250)`}/>
        ))}
        {[0,45,90,135,180,225,270,315].map(r => (
          <ellipse key={r} cx="250" cy="115" rx="10" ry="22" transform={`rotate(${r} 250 250)`}/>
        ))}
        {[0,45,90,135,180,225,270,315].map(r => (
          <circle key={r} cx="250" cy="68" r="3" fill="rgba(139,46,51,0.3)" stroke="none" transform={`rotate(${r} 250 250)`}/>
        ))}
        <circle cx="250" cy="250" r="6" fill="rgba(139,46,51,0.35)" stroke="none"/>
      </g>
    </svg>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroBlock({ c }) {
  const gradStart  = c.gradient_start || '#f3b33e';
  const gradEnd    = c.gradient_end   || '#de7336';
  const gradAngle  = c.gradient_angle ?? 175;
  const imageUrl   = c.bg_image_url   ? imgSrc(c.bg_image_url) : null;
  const bgOpacity  = c.bg_opacity     ?? 0.08;
  const textColor  = c.text_color     || '#ffffff';
  const emColor    = c.title_em_color || '#8b2e33';
  const omColor    = c.om_color       || 'rgba(139,46,51,0.08)';
  const showMandala = c.show_mandala !== false;
  const showOm      = c.show_om      !== false;

  return (
    <section
      className="blk-hero"
      style={{
        background: `linear-gradient(${gradAngle}deg, ${gradStart} 0%, ${gradEnd} 100%)`,
        color: textColor,
      }}
    >
      {/* Background image overlay — replaces ::before */}
      {imageUrl && (
        <div
          className="blk-hero-bg"
          style={{
            backgroundImage: `url(${imageUrl})`,
            opacity: bgOpacity,
          }}
        />
      )}

      {/* OM symbol — replaces ::after */}
      {showOm && (
        <div className="blk-hero-om" style={{ color: omColor }}>ॐ</div>
      )}

      {/* Spinning mandala */}
      {showMandala && (
        <div className="blk-hero-mandala" aria-hidden="true">
          <MandalaIcon />
        </div>
      )}

      {/* Content */}
      <div className="blk-hero-inner">
        {c.eyebrow && <div className="blk-hero-eyebrow">{c.eyebrow}</div>}
        {(c.title || c.title_em) && (
          <h1 className="blk-hero-title">
            {c.title}{c.title && c.title_em && ' '}
            {c.title_em && <em style={{ color: emColor }}>{c.title_em}</em>}
          </h1>
        )}
        {c.subtitle && <p className="blk-hero-sub">{c.subtitle}</p>}
        {c.cta_text && (
          c.cta_url?.startsWith('http')
            ? <a href={c.cta_url} className="blk-hero-btn" target="_blank" rel="noreferrer">{c.cta_text}</a>
            : <Link to={c.cta_url || '#'} className="blk-hero-btn">{c.cta_text}</Link>
        )}
      </div>
    </section>
  );
}

// ── Shared inner-div style helper ─────────────────────────────────────────────
// All content sections use max-width: 1400px with 4rem horizontal padding.
// "full" removes the max-width cap so content reaches the section edges.
const innerStyle = isFull => isFull
  ? { maxWidth: '100%', width: '100%',  padding: '0 4rem' }
  : { maxWidth: '1400px', margin: '0 auto', padding: '0 4rem' };

// ── Text Section ──────────────────────────────────────────────────────────────
function TextBlock({ c, isFull }) {
  return (
    <section className="blk-text" style={{ textAlign: c.alignment || 'left' }}>
      <div className="blk-text-inner" style={innerStyle(isFull)}>
        {c.label && <div className="blk-label">{c.label}</div>}
        {(c.title || c.title_em) && (
          <h2 className="blk-heading">{c.title}{c.title && c.title_em && ' '}<em>{c.title_em}</em></h2>
        )}
        {c.body && <div className="blk-body" dangerouslySetInnerHTML={{ __html: c.body.replace(/\n/g, '<br/>') }} />}
      </div>
    </section>
  );
}

// ── Text + Image ──────────────────────────────────────────────────────────────
function TextImageBlock({ c, imageRight, isFull }) {
  return (
    <section className={`blk-text-img${imageRight ? ' img-right' : ''}`}>
      <div className="blk-text-img-inner" style={innerStyle(isFull)}>
        <div className="blk-text-img-text">
          {c.label && <div className="blk-label">{c.label}</div>}
          {c.title && <h2 className="blk-heading">{c.title}</h2>}
          {c.body  && <div className="blk-body" dangerouslySetInnerHTML={{ __html: c.body.replace(/\n/g, '<br/>') }} />}
          {c.cta_text && (
            c.cta_url?.startsWith('http')
              ? <a href={c.cta_url} className="blk-btn blk-btn-outline" target="_blank" rel="noreferrer">{c.cta_text}</a>
              : <Link to={c.cta_url || '#'} className="blk-btn blk-btn-outline">{c.cta_text}</Link>
          )}
        </div>
        {c.image_url && (
          <div className="blk-text-img-img">
            <img src={imgSrc(c.image_url)} alt={c.image_alt || ''} />
          </div>
        )}
      </div>
    </section>
  );
}

// ── Accordion ─────────────────────────────────────────────────────────────────
function AccordionBlock({ c, isFull }) {
  const [open, setOpen] = useState(null);
  return (
    <section className="blk-accordion">
      <div className="blk-inner" style={innerStyle(isFull)}>
        {c.title && <h2 className="blk-heading" style={{ marginBottom: '2rem' }}>{c.title}</h2>}
        {(c.items || []).map((it, i) => (
          <div key={i} className={`blk-acc-item${open === i ? ' open' : ''}`}>
            <button className="blk-acc-q" onClick={() => setOpen(open === i ? null : i)}>
              <span>{it.question}</span>
              <span className="blk-acc-icon">{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <div className="blk-acc-a">{it.answer}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Image Cards ───────────────────────────────────────────────────────────────
function ImageCardsBlock({ c, isFull }) {
  return (
    <section className="blk-cards">
      <div className="blk-inner" style={innerStyle(isFull)}>
        {c.title && <h2 className="blk-heading blk-center" style={{ marginBottom: '2rem' }}>{c.title}</h2>}
        <div className="blk-cards-grid" style={{ '--cols': c.columns || 3 }}>
          {(c.cards || []).map((cd, i) => (
            <div key={i} className="blk-card">
              {cd.image_url && <img src={imgSrc(cd.image_url)} alt={cd.title || ''} className="blk-card-img" />}
              <div className="blk-card-body">
                {cd.title       && <div className="blk-card-title">{cd.title}</div>}
                {cd.subtitle    && <div className="blk-card-sub">{cd.subtitle}</div>}
                {cd.description && <p className="blk-card-desc">{cd.description}</p>}
                {cd.btn_text && (
                  cd.btn_url?.startsWith('http')
                    ? <a href={cd.btn_url} className="blk-card-btn" target="_blank" rel="noreferrer">{cd.btn_text}</a>
                    : <Link to={cd.btn_url || '#'} className="blk-card-btn">{cd.btn_text}</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Data Table ────────────────────────────────────────────────────────────────
function DataTableBlock({ c, isFull }) {
  return (
    <section className="blk-table-sec">
      <div className="blk-inner" style={innerStyle(isFull)}>
        {c.title && <h2 className="blk-heading" style={{ marginBottom: '1.5rem' }}>{c.title}</h2>}
        <div className="blk-table-scroll">
          <table className="blk-table">
            {c.headers?.length > 0 && (
              <thead><tr>{c.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            )}
            <tbody>
              {(c.rows || []).map((row, r) => (
                <tr key={r}>{row.map((cell, col) => <td key={col}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ── Logo Strip ────────────────────────────────────────────────────────────────
function LogoSliderBlock({ c, isFull }) {
  return (
    <section className="blk-logos">
      <div className="blk-inner" style={innerStyle(isFull)}>
        {c.title && <div className="blk-label blk-center" style={{ marginBottom: '1.5rem' }}>{c.title}</div>}
        <div className="blk-logos-row">
          {(c.logos || []).map((l, i) => (
            <div key={i} className="blk-logo-item">
              {l.link_url
                ? <a href={l.link_url} target="_blank" rel="noreferrer"><img src={imgSrc(l.image_url)} alt={l.alt || ''} /></a>
                : <img src={imgSrc(l.image_url)} alt={l.alt || ''} />
              }
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────
function CtaBlock({ c, isFull }) {
  return (
    <section className="blk-cta" style={{ background: c.bg_color || '#1a2543', color: c.text_color || '#ffffff' }}>
      <div className="blk-inner blk-center" style={innerStyle(isFull)}>
        {c.title    && <h2 className="blk-cta-title">{c.title}</h2>}
        {c.subtitle && <p className="blk-cta-sub">{c.subtitle}</p>}
        {c.btn_text && (
          c.btn_url?.startsWith('http')
            ? <a href={c.btn_url} className="blk-cta-btn" target="_blank" rel="noreferrer">{c.btn_text}</a>
            : <Link to={c.btn_url || '#'} className="blk-cta-btn">{c.btn_text}</Link>
        )}
      </div>
    </section>
  );
}

// ── Pull Quote ────────────────────────────────────────────────────────────────
function QuoteBlock({ c, isFull }) {
  return (
    <section className="blk-quote">
      <div className="blk-inner blk-center" style={innerStyle(isFull)}>
        <blockquote className="blk-quote-text">"{c.text}"</blockquote>
        {c.attribution && <cite className="blk-quote-attr">{c.attribution}</cite>}
      </div>
    </section>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function DividerBlock({ c, isFull }) {
  if (c.style === 'space') return <div style={{ height: `${c.height || 60}px` }} />;
  if (c.style === 'ornament') return <div className="blk-divider-ornament">✦</div>;
  return (
    <div style={{ marginTop: `${(c.height || 60) / 2}px`, marginBottom: `${(c.height || 60) / 2}px`, padding: '0 2rem' }}>
      <div className="blk-divider-line" style={isFull ? { maxWidth: '100%' } : {}} />
    </div>
  );
}

// ── Image Section ─────────────────────────────────────────────────────────────
function ImageBlock({ c, isFull }) {
  const src = imgSrc(c.image_url);
  if (!src) return null;

  const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end', full: 'stretch' };
  const isFull2  = c.alignment === 'full';

  const img = (
    <img
      src={src}
      alt={c.image_alt || ''}
      className="blk-image-img"
      style={{ maxWidth: isFull2 ? '100%' : (c.max_width || '100%'), width: '100%' }}
    />
  );

  return (
    <section className="blk-image-sec">
      <div style={innerStyle(isFull)}>
        {(c.label || c.title) && (
          <div className="blk-image-header">
            {c.label && <div className="blk-label">{c.label}</div>}
            {c.title && <h2 className="blk-heading">{c.title}</h2>}
          </div>
        )}
        <div className="blk-image-wrap" style={{ justifyContent: alignMap[c.alignment] || 'center' }}>
          {c.link_url
            ? (c.link_url.startsWith('http')
                ? <a href={c.link_url} target="_blank" rel="noreferrer">{img}</a>
                : <Link to={c.link_url}>{img}</Link>)
            : img
          }
        </div>
        {c.caption && <p className="blk-image-caption">{c.caption}</p>}
      </div>
    </section>
  );
}

// ── YouTube Video ─────────────────────────────────────────────────────────────
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

const RATIO_MAP = { '16:9': '56.25%', '4:3': '75%', '1:1': '100%', '9:16': '177.78%' };

function YouTubeBlock({ c, isFull }) {
  const videoId = extractYouTubeId(c.youtube_url);
  return (
    <section className="blk-youtube">
      <div style={innerStyle(isFull)}>
        {c.label && <div className="blk-label">{c.label}</div>}
        {c.title && <h2 className="blk-heading">{c.title}</h2>}
        {c.description && <p className="blk-body" style={{ marginBottom: '1.5rem' }}>{c.description}</p>}
        {videoId ? (
          <div className="blk-video-container" style={{ paddingBottom: RATIO_MAP[c.aspect_ratio] || '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              title={c.title || 'YouTube video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="blk-video-placeholder">
            {c.youtube_url ? 'Invalid YouTube URL — check the link.' : 'No YouTube URL set yet.'}
          </div>
        )}
      </div>
    </section>
  );
}

// ── PDF Section ───────────────────────────────────────────────────────────────
function PdfViewerModal({ pdfUrl, title, onClose }) {
  const [numPages,    setNumPages]    = useState(null);
  const [pageNumber,  setPageNumber]  = useState(1);
  const [loadError,   setLoadError]   = useState(null);

  return (
    <div className="blk-pdf-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="blk-pdf-modal">
        <div className="blk-pdf-modal-head">
          {title && <h3 className="blk-pdf-modal-title">{title}</h3>}
          <button className="blk-pdf-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="blk-pdf-viewer">
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => { setNumPages(numPages); setPageNumber(1); setLoadError(null); }}
            onLoadError={e => setLoadError(e?.message || 'Failed to load')}
            loading={<div className="blk-pdf-msg">Loading PDF…</div>}
            error={<div className="blk-pdf-msg blk-pdf-err">Failed to load PDF.{loadError && <><br/><small>{loadError}</small></>}</div>}
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={Math.min(window.innerWidth * 0.85, 760)}
            />
          </Document>
        </div>

        {numPages && (
          <div className="blk-pdf-nav">
            <button className="blk-pdf-nav-btn" onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}>&#8592;</button>
            <span className="blk-pdf-page-info">{pageNumber} / {numPages}</span>
            <button className="blk-pdf-nav-btn" onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}>&#8594;</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PdfBlock({ c, isFull }) {
  const [open, setOpen] = useState(false);
  const pdfSrc = c.pdf_url
    ? (c.pdf_url.startsWith('http') ? c.pdf_url
       : c.pdf_url.startsWith('/uploads/pages/') ? `${API_SERVER}${c.pdf_url}`
       : `${SERVER}${c.pdf_url}`)
    : null;
  const imageSrc  = c.image_url ? imgSrc(c.image_url) : null;
  const isBtn     = (c.btn_style    || 'button') === 'button';
  const imgPos    =  c.image_position || 'left';
  const isSide    = imageSrc && (imgPos === 'left' || imgPos === 'right');

  const textContent = (
    <div className="blk-pdf-text">
      {c.label       && <div className="blk-label">{c.label}</div>}
      {c.title       && <h2  className="blk-heading">{c.title}</h2>}
      {c.description && <p   className="blk-body" style={{ marginBottom: '1.5rem' }}>{c.description}</p>}
      {pdfSrc ? (
        isBtn
          ? <button className="blk-pdf-trigger-btn"  onClick={() => setOpen(true)}>{c.btn_text || 'Open PDF'}</button>
          : <button className="blk-pdf-trigger-link" onClick={() => setOpen(true)}>{c.btn_text || 'Open PDF'}</button>
      ) : (
        <p className="blk-pdf-no-file">No PDF file set — configure in the CMS.</p>
      )}
    </div>
  );

  const imageEl = imageSrc && (
    <div className="blk-pdf-img-wrap">
      <img src={imageSrc} alt={c.image_alt || ''} className="blk-pdf-img" />
    </div>
  );

  return (
    <section className="blk-pdf-sec">
      <div style={innerStyle(isFull)}>
        {/* Above */}
        {imageSrc && imgPos === 'above' && imageEl}

        {/* Side-by-side (left / right) */}
        {isSide ? (
          <div className={`blk-pdf-side blk-pdf-side-${imgPos}`}>
            {imgPos === 'left'  && imageEl}
            {textContent}
            {imgPos === 'right' && imageEl}
          </div>
        ) : textContent}

        {/* Below */}
        {imageSrc && imgPos === 'below' && imageEl}
      </div>

      {open && pdfSrc && (
        <PdfViewerModal pdfUrl={pdfSrc} title={c.modal_title || c.title || ''} onClose={() => setOpen(false)} />
      )}
    </section>
  );
}

// ── Custom Tabs ───────────────────────────────────────────────────────────────
function TabsBlock({ c, isFull }) {
  const tabs = c.tabs || [];
  const [active, setActive] = useState(0);
  if (!tabs.length) return null;
  const cur = tabs[Math.min(active, tabs.length - 1)];
  return (
    <section className="blk-tabs">
      {/* Tab nav */}
      <div className="blk-tabs-nav" role="tablist">
        <div style={innerStyle(isFull)} className="blk-tabs-nav-inner">
          {tabs.map((tab, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              className={`blk-tab-btn${i === active ? ' active' : ''}`}
              onClick={() => setActive(i)}
            >
              {tab.title}
            </button>
          ))}
        </div>
      </div>
      {/* Active panel */}
      <div className="blk-tabs-panel">
        <div style={innerStyle(isFull)}>
          {cur.content && (
            <div className="blk-tabs-content blk-body"
              dangerouslySetInnerHTML={{ __html: String(cur.content).replace(/\n/g, '<br/>') }}
            />
          )}
          {cur.image_url && (
            <img src={imgSrc(cur.image_url)} alt={cur.title || ''} className="blk-tabs-img" />
          )}
        </div>
      </div>
    </section>
  );
}

// ── Custom Popup ──────────────────────────────────────────────────────────────
function PopupBlock({ c }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const isBtn  = (c.trigger_style || 'button') === 'button';
  const label  = c.trigger_text || 'Open';

  return (
    <section className="blk-popup-wrap">
      {isBtn
        ? <button className="blk-popup-trigger-btn" onClick={() => setOpen(true)}>{label}</button>
        : <button className="blk-popup-trigger-link" onClick={() => setOpen(true)}>{label}</button>
      }

      {open && (
        <div
          className="blk-popup-backdrop"
          onClick={e => e.target === e.currentTarget && close()}
          role="dialog"
          aria-modal="true"
        >
          <div className="blk-popup-modal" style={{ maxWidth: c.popup_width || '860px' }}>
            {/* Header */}
            <div className="blk-popup-head">
              {c.popup_title && <h3 className="blk-popup-title">{c.popup_title}</h3>}
              <button className="blk-popup-close" onClick={close} aria-label="Close">✕</button>
            </div>
            {/* Body — renders embedded blocks */}
            <div className="blk-popup-body">
              {(c.blocks || []).map((block, i) => (
                <BlockRenderer key={i} block={block} />
              ))}
              {(!c.blocks || !c.blocks.length) && (
                <p style={{ padding: '2rem', textAlign: 'center', color: '#8b7355', fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.8rem' }}>
                  No content yet — add blocks in the CMS editor.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ── HTML Block ────────────────────────────────────────────────────────────────
function HtmlBlock({ c, isFull }) {
  if (!c.html) return null;
  return (
    <section className="blk-html">
      <div style={innerStyle(isFull)} dangerouslySetInnerHTML={{ __html: c.html }} />
    </section>
  );
}

// ── Carousel / Slider ─────────────────────────────────────────────────────────
function CarouselBlock({ c }) {
  const slides   = c.slides || [];
  const total    = slides.length;
  const [cur, setCur] = useState(0);
  const timerRef = useRef(null);

  const go   = i  => setCur(((i % total) + total) % total);
  const prev = () => go(cur - 1);
  const next = () => go(cur + 1);

  // Autoplay
  useEffect(() => {
    if (!c.autoplay || total <= 1) return;
    timerRef.current = setInterval(() => setCur(i => (i + 1) % total), c.autoplay_interval || 4000);
    return () => clearInterval(timerRef.current);
  }, [c.autoplay, c.autoplay_interval, total]);

  // Pause autoplay on hover
  const pause  = () => clearInterval(timerRef.current);
  const resume = () => {
    if (!c.autoplay || total <= 1) return;
    timerRef.current = setInterval(() => setCur(i => (i + 1) % total), c.autoplay_interval || 4000);
  };

  if (!total) return null;

  return (
    <section
      className="blk-carousel"
      style={{ '--carousel-h': c.height || '520px' }}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {/* Slides */}
      {slides.map((sl, i) => {
        const image = sl.image_url ? imgSrc(sl.image_url) : null;
        return (
          <div
            key={i}
            className={`blk-carousel-slide${i === cur ? ' active' : ''}`}
            style={{
              backgroundImage:    image ? `url(${image})` : 'none',
              backgroundColor:    image ? '#1a1208' : (sl.bg_color || '#1a1208'),
              backgroundSize:     'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden={i !== cur}
          >
            {/* Darkening overlay */}
            <div className="blk-carousel-overlay" style={{ opacity: sl.overlay_opacity ?? 0.45 }} />

            {/* Text content */}
            <div className="blk-carousel-content">
              {sl.label    && <div className="blk-carousel-eyebrow">{sl.label}</div>}
              {sl.title    && <h2  className="blk-carousel-title">{sl.title}</h2>}
              {sl.subtitle && <p   className="blk-carousel-sub">{sl.subtitle}</p>}
              {sl.btn_text && (
                sl.btn_url?.startsWith('http')
                  ? <a href={sl.btn_url} className="blk-cta-btn" target="_blank" rel="noreferrer">{sl.btn_text}</a>
                  : <Link to={sl.btn_url || '#'} className="blk-cta-btn">{sl.btn_text}</Link>
              )}
            </div>
          </div>
        );
      })}

      {/* Prev / Next arrows */}
      {c.show_arrows !== false && total > 1 && (
        <>
          <button className="blk-carousel-arrow blk-carousel-prev" onClick={prev} aria-label="Previous slide">&#8249;</button>
          <button className="blk-carousel-arrow blk-carousel-next" onClick={next} aria-label="Next slide">&#8250;</button>
        </>
      )}

      {/* Dot navigation */}
      {c.show_dots !== false && total > 1 && (
        <div className="blk-carousel-dots" role="tablist">
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === cur}
              className={`blk-carousel-dot${i === cur ? ' active' : ''}`}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Main switch ───────────────────────────────────────────────────────────────
export function BlockRenderer({ block }) {
  const c      = block.content || {};
  const isFull = c.wrapper_width === 'full';
  switch (block.block_type) {
    case 'hero':             return <HeroBlock c={c} isFull={isFull} />;
    case 'text_section':     return <TextBlock c={c} isFull={isFull} />;
    case 'text_image_left':  return <TextImageBlock c={c} imageRight={false} isFull={isFull} />;
    case 'text_image_right': return <TextImageBlock c={c} imageRight={true}  isFull={isFull} />;
    case 'accordion':        return <AccordionBlock c={c} isFull={isFull} />;
    case 'image_cards':      return <ImageCardsBlock c={c} isFull={isFull} />;
    case 'data_table':       return <DataTableBlock c={c} isFull={isFull} />;
    case 'logo_slider':      return <LogoSliderBlock c={c} isFull={isFull} />;
    case 'cta':              return <CtaBlock c={c} isFull={isFull} />;
    case 'quote_block':      return <QuoteBlock c={c} isFull={isFull} />;
    case 'divider':          return <DividerBlock c={c} isFull={isFull} />;
    case 'html_block':       return <HtmlBlock c={c} isFull={isFull} />;
    case 'carousel':         return <CarouselBlock c={c} />;
    case 'image_section':    return <ImageBlock c={c} isFull={isFull} />;
    case 'youtube_video':    return <YouTubeBlock c={c} isFull={isFull} />;
    case 'pdf_section':      return <PdfBlock c={c} isFull={isFull} />;
    case 'tabs':             return <TabsBlock c={c} isFull={isFull} />;
    case 'popup':            return <PopupBlock c={c} />;
    default:                 return null;
  }
}
