import { Link } from 'react-router-dom';
import './InnerPageHero.css';

function InnerPageHero({ eyebrow, title, titleEm, subtitle, breadcrumb }) {
  return (
    <section className="inner-hero">
      <div className="hero-mandala" aria-hidden="true">
        <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" className="mandala-svg">
          <g fill="none" stroke="rgba(139,46,51,0.22)" strokeWidth="0.8">
            <circle cx="250" cy="250" r="240"/>
            <circle cx="250" cy="250" r="210"/>
            <circle cx="250" cy="250" r="180"/>
            <circle cx="250" cy="250" r="145"/>
            <circle cx="250" cy="250" r="110"/>
            <circle cx="250" cy="250" r="78"/>
            <circle cx="250" cy="250" r="48"/>
            <circle cx="250" cy="250" r="22"/>
            <line x1="250" y1="10" x2="250" y2="490"/>
            <line x1="10" y1="250" x2="490" y2="250"/>
            <line x1="80" y1="80" x2="420" y2="420"/>
            <line x1="420" y1="80" x2="80" y2="420"/>
            <polygon points="250,52 452,390 48,390"/>
            <polygon points="250,448 48,110 452,110"/>
            <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(0 250 250)"/>
            <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(45 250 250)"/>
            <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(90 250 250)"/>
            <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(135 250 250)"/>
            <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(180 250 250)"/>
            <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(225 250 250)"/>
            <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(270 250 250)"/>
            <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(315 250 250)"/>
            <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(0 250 250)"/>
            <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(45 250 250)"/>
            <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(90 250 250)"/>
            <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(135 250 250)"/>
            <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(180 250 250)"/>
            <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(225 250 250)"/>
            <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(270 250 250)"/>
            <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(315 250 250)"/>
            <circle cx="250" cy="68" r="3" fill="rgba(139,46,51,0.3)" stroke="none" transform="rotate(0 250 250)"/>
            <circle cx="250" cy="68" r="3" fill="rgba(139,46,51,0.3)" stroke="none" transform="rotate(45 250 250)"/>
            <circle cx="250" cy="68" r="3" fill="rgba(139,46,51,0.3)" stroke="none" transform="rotate(90 250 250)"/>
            <circle cx="250" cy="68" r="3" fill="rgba(139,46,51,0.3)" stroke="none" transform="rotate(135 250 250)"/>
            <circle cx="250" cy="68" r="3" fill="rgba(139,46,51,0.3)" stroke="none" transform="rotate(180 250 250)"/>
            <circle cx="250" cy="68" r="3" fill="rgba(139,46,51,0.3)" stroke="none" transform="rotate(225 250 250)"/>
            <circle cx="250" cy="68" r="3" fill="rgba(139,46,51,0.3)" stroke="none" transform="rotate(270 250 250)"/>
            <circle cx="250" cy="68" r="3" fill="rgba(139,46,51,0.3)" stroke="none" transform="rotate(315 250 250)"/>
            <circle cx="250" cy="250" r="6" fill="rgba(139,46,51,0.35)" stroke="none"/>
          </g>
        </svg>
      </div>

      <div className="inner-hero-eyebrow">{eyebrow}</div>
      <h1>{title} {titleEm && <em>{titleEm}</em>}</h1>
      {subtitle && <p className="inner-hero-sub">{subtitle}</p>}
      <div className="inner-hero-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        {breadcrumb}
      </div>
    </section>
  );
}

export default InnerPageHero;
