import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
//  DATA
// ─────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Biography",  href: "/bio/" },
  { label: "Articles",   href: "/blog/" },
  { label: "Images",     href: "/gallery-of-images/" },
  { label: "Talks",      href: "/talks-interviews-podcasts/" },
  { label: "Events",     href: "/events/" },
];

const PILLARS = [
  {
    label: "Ventures",
    stat:  "8",
    desc:  "Purpose-led organisations across culture, commerce, and consciousness.",
    detail: "ALCHMI Strategy · e-Com Elephant · Upadesha Academy · Darshana Books · Sanskritishaala · Sanathani.com · Samvada Bistro · IKSHA Sangama",
  },
  {
    label: "Teaching",
    stat:  "FDP · Adjunct",
    small: true,
    desc:  "Faculty development programmes, UGC-linked sessions, and adjunct roles at leading institutions.",
    detail: "RVIM · JAIN University · Savitribai Phule · IIT Kanpur · UGC programmes",
  },
  {
    label: "Speaking",
    stat:  "Keynotes · Panels",
    small: true,
    desc:  "Keynotes, panels, and retreats on civilisational renewal, dharmic enterprise, and Indic epistemology.",
    detail: "Academic conferences · Industry forums · Cultural retreats",
  },
  {
    label: "Writing",
    stat:  "64",
    desc:  "Essays on dharmic ideas, Sanskrit thought, contemplative philosophy, and civilisational renewal.",
    detailLink: { href: "https://alchmi.com/blog/", label: "vinaykulkarni.com/blog" },
  },
];

const ARTICLES = [
  {
    tag:     "Music · Vedānta",
    title:   "The Sacred Symphony: Music as the Gateway to Divine Union",
    excerpt: "On nāda, consciousness, and what classical Indian music theory reveals about the nature of attention.",
    href:    "https://alchmi.com/2025/06/23/the-sacred-symphony-music-as-the-gateway-to-divine-union/",
  },
  {
    tag:     "Philosophy · Epistemology",
    title:   "The Art of Thinking Clearly: Beyond Labels, Concepts and Boxes",
    excerpt: "How categorisation constrains perception — and what viveka offers as a corrective.",
    href:    "https://alchmi.com/2025/03/24/the-art-of-thinking-clearly-beyond-labels-concepts-and-boxes/",
  },
  {
    tag:     "IKS · Education",
    title:   "From Adhyāpaka to Ācārya: The Teacher as Civilisational Anchor",
    excerpt: "What separates a teacher of subjects from a teacher of persons — and why the distinction matters now.",
    href:    "https://alchmi.com/blog/",
  },
];

const FOOTER_LINKS = [
  { label: "LinkedIn",    href: "https://www.linkedin.com/in/vinkulkarni/", external: true },
  { label: "Twitter / X", href: "https://x.com/aatmavalokana",              external: true },
  { label: "Articles",    href: "/blog/" },
  { label: "Biography",   href: "/bio/" },
  { label: "Events",      href: "/events/" },
];

// ─────────────────────────────────────────────────────────────
//  HOOK — scroll-triggered reveal
// ─────────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref     = useRef(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVis(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); observer.unobserve(entry.target); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, vis };
}

// ─────────────────────────────────────────────────────────────
//  COMPONENTS
// ─────────────────────────────────────────────────────────────

/* Yantra SVG ------------------------------------------------ */
function Yantra() {
  return (
    <svg viewBox="0 0 240 240" width="220" height="220"
         xmlns="http://www.w3.org/2000/svg" role="img"
         aria-label="Ṣaṭkoṇa yantra — sacred geometric motif representing structural harmony">
      <title>Ṣaṭkoṇa Yantra</title>
      <g className="yantra-spin">
        <circle cx="120" cy="120" r="108" fill="none" stroke="#F3B33E" strokeWidth="0.6" opacity="0.22" />
        <circle cx="120" cy="120" r="82"  fill="none" stroke="#F3B33E" strokeWidth="0.6" opacity="0.32" />
      </g>
      <circle cx="120" cy="120" r="56" fill="none" stroke="#F3B33E" strokeWidth="0.6" opacity="0.44" />
      <circle cx="120" cy="120" r="30" fill="none" stroke="#F3B33E" strokeWidth="0.6" opacity="0.55" />
      <circle cx="120" cy="120" r="3"  fill="#F3B33E" opacity="0.8" />
      <polygon points="120,38 191,161 49,161"  fill="none" stroke="#F3B33E" strokeWidth="1" opacity="0.5" />
      <polygon points="120,202 49,79 191,79"   fill="none" stroke="#F3B33E" strokeWidth="1" opacity="0.5" />
      <line x1="120" y1="12"  x2="120" y2="228" stroke="#F3B33E" strokeWidth="0.5" opacity="0.1" />
      <line x1="12"  y1="120" x2="228" y2="120" stroke="#F3B33E" strokeWidth="0.5" opacity="0.1" />
      <line x1="49"  y1="49"  x2="191" y2="191" stroke="#F3B33E" strokeWidth="0.5" opacity="0.1" />
      <line x1="191" y1="49"  x2="49"  y2="191" stroke="#F3B33E" strokeWidth="0.5" opacity="0.1" />
    </svg>
  );
}

/* Nav ------------------------------------------------------- */
function Nav() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const close = () => setMobileOpen(false);

  return (
    <header>
      <nav className={`nav${scrolled ? " nav--scrolled" : ""}`} aria-label="Main navigation">

        {/* Logo */}
        <a href="/" className="nav-logo" aria-label="Vinay Kulkarni — Homepage">
          <img
            src="https://alchmi.com/wp-content/uploads/2024/12/Vinay-Ji-Logo-White.png"
            alt="Vinay Kulkarni"
            onError={e => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "inline";
            }}
          />
          <span className="nav-logo-text" style={{ display: "none" }}>Vinay Kulkarni</span>
        </a>

        {/* Links */}
        <ul className={`nav-links${mobileOpen ? " nav-links--open" : ""}`}>
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <a href={href} onClick={close}>{label}</a>
            </li>
          ))}
          <li>
            <a href="https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002"
               className="nav-cta" target="_blank" rel="noopener noreferrer" onClick={close}>
              Book a Session
            </a>
          </li>
        </ul>

        {/* Hamburger */}
        <button className="nav-toggle" aria-label="Toggle navigation"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(v => !v)}>
          <span /><span /><span />
        </button>

      </nav>
    </header>
  );
}

/* Hero ------------------------------------------------------ */
function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-name">
      <div className="hero-om" aria-hidden="true">ॐ</div>
      <div className="hero-inner">
        <p className="hero-eyebrow">Bengaluru, India</p>
        <h1 className="hero-name" id="hero-name">Vinay Kulkarni</h1>
        <div className="hero-rule" aria-hidden="true">
          <div className="hero-rule-line" />
          <div className="hero-rule-diamond" />
          <div className="hero-rule-line" />
        </div>
        <p className="hero-tagline">Dharayati Iti Dharmaha</p>
        <p className="hero-subtitle">
          Scholar of Indian Knowledge Systems&nbsp;·&nbsp;Founder&nbsp;·&nbsp;Educator&nbsp;·&nbsp;Writer
        </p>
        <div className="hero-ctas">
          <a href="/blog/" className="btn-saffron">Read the Writing</a>
          <a href="https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002"
             className="btn-outline-light" target="_blank" rel="noopener noreferrer">
            Work with Me
          </a>
        </div>
      </div>
    </section>
  );
}

/* Pillar card ----------------------------------------------- */
function Pillar({ label, stat, small, desc, detail, detailLink }) {
  const { ref, vis } = useReveal();
  return (
    <div ref={ref} className={`pillar reveal${vis ? " reveal--visible" : ""}`}>
      <p className="pillar-label">{label}</p>
      <p className={`pillar-stat${small ? " pillar-stat--sm" : ""}`}>{stat}</p>
      <p className="pillar-desc">{desc}</p>
      {detailLink
        ? <p className="pillar-detail pillar-detail--link">
            <a href={detailLink.href}>{detailLink.label}</a>
          </p>
        : <p className="pillar-detail">{detail}</p>
      }
    </div>
  );
}

/* Pillars section ------------------------------------------- */
function Pillars() {
  return (
    <section className="section" aria-labelledby="pillars-heading">
      <h2 id="pillars-heading" className="sr-only">Four domains of work</h2>
      <div className="section-header">
        <span className="section-eyebrow">The Work</span>
        <p className="section-sub">Four Domains</p>
      </div>
      <div className="pillars-grid">
        {PILLARS.map(p => <Pillar key={p.label} {...p} />)}
      </div>
    </section>
  );
}

/* Framework ------------------------------------------------- */
function Framework() {
  const { ref, vis } = useReveal();
  return (
    <section className="section section--dark" aria-labelledby="framework-heading">
      <div ref={ref} className={`framework-inner reveal${vis ? " reveal--visible" : ""}`}>
        <span className="section-eyebrow section-eyebrow--gold">Featured Framework</span>
        <h2 className="framework-title" id="framework-heading">
          The Dharmic Enterprise Framework
        </h2>
        <p className="framework-desc">
          Rooted in Saptāṅga theory and Kauṭilyan statecraft, this framework translates the
          structural logic of classical governance into principles for building purpose-aligned
          enterprises.
        </p>
        <div className="framework-award">
          <div className="framework-award-dot" />
          <span className="framework-award-text">Best Paper Award &nbsp;·&nbsp; IIT Bombay</span>
        </div>
        <div className="yantra-wrap">
          <Yantra />
        </div>
        <a href="/frameworks/" className="btn-outline-dark">Explore the Framework</a>
      </div>
    </section>
  );
}

/* Article card ---------------------------------------------- */
function ArticleCard({ tag, title, excerpt, href }) {
  const { ref, vis } = useReveal();
  return (
    <article ref={ref} className={`article reveal${vis ? " reveal--visible" : ""}`}>
      <span className="article-tag">{tag}</span>
      <h3 className="article-title">{title}</h3>
      <p className="article-excerpt">{excerpt}</p>
      <a href={href} className="article-cta">Read Article →</a>
    </article>
  );
}

/* Writing section ------------------------------------------- */
function Writing() {
  return (
    <section className="section" aria-labelledby="writing-heading">
      <div className="writing-header">
        <h2 className="writing-title" id="writing-heading">Latest Writing</h2>
        <a href="https://alchmi.com/blog/" className="writing-all">All 64 Articles →</a>
      </div>
      <div className="articles-grid">
        {ARTICLES.map(a => <ArticleCard key={a.href} {...a} />)}
      </div>
    </section>
  );
}

/* Testimonial ----------------------------------------------- */
function Testimonial() {
  const { ref, vis } = useReveal();
  return (
    <section className="section section--dark" aria-label="Student testimonial">
      <div ref={ref} className={`testimonial-inner reveal${vis ? " reveal--visible" : ""}`}>
        <span className="testimonial-mark" aria-hidden="true">"</span>
        <blockquote className="testimonial-text">
          A wonderful lecture that provoked reflective thinking — it opened new windows into
          the relationship between ancient knowledge and present challenges.
        </blockquote>
        <p className="testimonial-attr">
          — Student &nbsp;·&nbsp; JAIN University Faculty Development Programme
        </p>
      </div>
    </section>
  );
}

/* Footer ---------------------------------------------------- */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <span className="footer-brand">Vinay Kulkarni</span>
          <p className="footer-bio">
            Founder, educator, and scholar of Indian Knowledge Systems based in Bengaluru.
            Creator of the Dharmic Enterprise Framework. Writing at the intersection of
            classical wisdom and contemporary life.
          </p>
          <div className="footer-links">
            {FOOTER_LINKS.map(({ label, href, external }) => (
              <a key={label} href={href} className="footer-link"
                 {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <span className="footer-newsletter-label">Stay in Touch</span>
          <p className="footer-newsletter-desc">Essays and reflections — nothing else.</p>
          <div className="footer-form">
            <label htmlFor="footer-email" className="sr-only">Email address</label>
            <input type="email" id="footer-email" className="footer-input"
                   placeholder="your@email.com" autoComplete="email" />
            <a href="https://zcmp.in/xO0w" className="footer-btn"
               target="_blank" rel="noopener noreferrer">Subscribe</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-copy">© 2026 Vinay Kulkarni. All Rights Reserved.</p>
        <p className="footer-dharma">Dharayati Iti Dharmaha</p>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────
//  ROOT
// ─────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    document.title = "Vinay Kulkarni — Dharayati Iti Dharmaha";
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Nav />
      <main>
        <Hero />
        <Pillars />
        <Framework />
        <Writing />
        <Testimonial />
      </main>
      <Footer />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  GLOBAL CSS
//  Kept in one string so this file is self-contained.
//  In a real project, extract to src/styles/global.css or use
//  a CSS-in-JS solution such as styled-components / emotion.
// ─────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

/* ── BRAND TOKENS ────────────────────────────────────────── */
:root {
  --saffron:       #DE7336;
  --saffron-dark:  #C8622A;
  --indigo:        #1A2543;
  --indigo-deep:   #111B36;
  --birch:         #F4EFEB;
  --birch-dim:     #EDE7E1;
  --gold:          #F3B33E;
  --tulsi:         #4A6B53;
  --madder:        #8B2E33;
  --border-light:  rgba(26,37,67,0.12);
  --border-dark:   rgba(244,239,235,0.10);
  --td1: #F4EFEB;
  --td2: rgba(244,239,235,0.65);
  --td3: rgba(244,239,235,0.38);
  --tl1: #1A2543;
  --tl2: rgba(26,37,67,0.65);
  --tl3: rgba(26,37,67,0.42);
  --font-display: 'Cinzel', serif;
  --font-body:    'EB Garamond', Georgia, serif;
  --font-ui:      'DM Sans', sans-serif;
}

/* ── RESET ───────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--birch);
  color: var(--indigo);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
a { text-decoration: none; color: inherit; }
img { max-width: 100%; display: block; }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0;
  margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}

/* ── KEYFRAMES ───────────────────────────────────────────── */
@keyframes riseIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes yantraRotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ── SCROLL REVEAL ───────────────────────────────────────── */
.reveal {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity 0.65s ease, transform 0.65s ease;
}
.reveal--visible {
  opacity: 1;
  transform: none;
}

/* ── HERO ENTRANCE (CSS-driven, no JS needed) ────────────── */
@media (prefers-reduced-motion: no-preference) {
  .hero-eyebrow  { animation: riseIn 0.7s ease both; animation-delay: 0.15s; }
  .hero-name     { animation: riseIn 0.7s ease both; animation-delay: 0.30s; }
  .hero-rule     { animation: fadeIn 0.9s ease both; animation-delay: 0.55s; }
  .hero-tagline  { animation: riseIn 0.7s ease both; animation-delay: 0.60s; }
  .hero-subtitle { animation: riseIn 0.7s ease both; animation-delay: 0.75s; }
  .hero-ctas     { animation: riseIn 0.7s ease both; animation-delay: 0.90s; }
  .yantra-spin   {
    animation: yantraRotate 120s linear infinite;
    transform-origin: 120px 120px;
  }
}

/* ── NAV ─────────────────────────────────────────────────── */
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 1rem 3rem;
  display: flex; justify-content: space-between; align-items: center;
  background: transparent;
  border-bottom: 1px solid transparent;
  transition: background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease;
}
.nav--scrolled {
  background: rgba(26,37,67,0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom-color: var(--border-dark);
}
.nav-logo {
  display: flex; align-items: center; gap: 0.5rem;
}
.nav-logo img { height: 30px; width: auto; }
.nav-logo-text {
  font-family: var(--font-display);
  font-size: 0.875rem; letter-spacing: 0.14em;
  color: var(--birch); font-weight: 500;
}
.nav-links {
  display: flex; gap: 1.75rem;
  align-items: center; list-style: none;
}
.nav-links a {
  font-family: var(--font-ui);
  font-size: 0.6875rem; letter-spacing: 0.14em;
  text-transform: uppercase; color: rgba(244,239,235,0.55);
  transition: color 0.2s;
}
.nav-links a:hover { color: var(--birch); }
.nav-cta {
  background: var(--saffron) !important;
  color: #fff !important;
  padding: 0.4rem 1rem;
  transition: background 0.2s !important;
}
.nav-cta:hover { background: var(--saffron-dark) !important; }
.nav-toggle {
  display: none; background: none; border: none;
  cursor: pointer; padding: 0.25rem;
}
.nav-toggle span {
  display: block; width: 22px; height: 1px;
  background: rgba(244,239,235,0.7); margin: 5px 0;
  transition: all 0.3s;
}

/* ── HERO ────────────────────────────────────────────────── */
.hero {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  text-align: center; padding: 8rem 2rem 6rem;
  background: var(--indigo);
  position: relative; overflow: hidden;
}
.hero::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 65% 55% at 50% 40%, rgba(243,179,62,0.07) 0%, transparent 70%);
  pointer-events: none;
}
.hero-om {
  font-family: var(--font-body);
  font-size: 22rem; color: var(--gold);
  opacity: 0.035; position: absolute;
  top: 50%; left: 50%; transform: translate(-50%,-52%);
  pointer-events: none; user-select: none; line-height: 1;
}
.hero-inner { position: relative; z-index: 1; max-width: 680px; }
.hero-eyebrow {
  font-family: var(--font-ui);
  font-size: 0.6875rem; letter-spacing: 0.25em;
  text-transform: uppercase; color: var(--td3); margin-bottom: 1.875rem;
}
.hero-name {
  font-family: var(--font-display);
  font-size: clamp(2.75rem, 6vw, 4.25rem);
  font-weight: 400; letter-spacing: 0.07em;
  color: var(--birch); line-height: 1.05; margin-bottom: 1.625rem;
}
.hero-rule {
  display: flex; align-items: center; justify-content: center;
  gap: 0.875rem; margin: 0.25rem 0 1.5rem;
}
.hero-rule-line    { width: 72px; height: 1px; background: var(--gold); opacity: 0.45; }
.hero-rule-diamond { width: 5px; height: 5px; background: var(--saffron); transform: rotate(45deg); flex-shrink: 0; }
.hero-tagline {
  font-size: 1.3125rem; font-style: italic;
  color: var(--td2); letter-spacing: 0.04em; margin-bottom: 0.5rem;
}
.hero-subtitle {
  font-family: var(--font-ui);
  font-size: 0.6875rem; font-weight: 300;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--td3); margin-bottom: 3rem;
}
.hero-ctas { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

/* ── BUTTONS ─────────────────────────────────────────────── */
.btn-saffron {
  font-family: var(--font-ui);
  font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.18em;
  text-transform: uppercase; background: var(--saffron); color: #fff;
  padding: 0.9rem 2.25rem; display: inline-block; transition: background 0.2s;
}
.btn-saffron:hover { background: var(--saffron-dark); }
.btn-outline-light {
  font-family: var(--font-ui);
  font-size: 0.6875rem; letter-spacing: 0.18em; text-transform: uppercase;
  border: 1px solid rgba(244,239,235,0.28); color: var(--td2);
  padding: 0.9rem 2.25rem; display: inline-block;
  transition: border-color 0.2s, color 0.2s;
}
.btn-outline-light:hover { border-color: rgba(244,239,235,0.55); color: var(--birch); }
.btn-outline-dark {
  font-family: var(--font-ui);
  font-size: 0.6875rem; letter-spacing: 0.18em; text-transform: uppercase;
  border: 1px solid rgba(244,239,235,0.22); color: var(--td2);
  padding: 0.875rem 2rem; display: inline-block;
  transition: border-color 0.2s, color 0.2s;
}
.btn-outline-dark:hover { border-color: rgba(244,239,235,0.5); color: var(--birch); }

/* ── SECTION BASE ────────────────────────────────────────── */
.section { padding: 5rem 3rem; border-top: 1px solid var(--border-light); }
.section--dark { background: var(--indigo); border-top-color: var(--border-dark); }
.section-header { text-align: center; margin-bottom: 3.5rem; }
.section-eyebrow {
  font-family: var(--font-ui);
  font-size: 0.6875rem; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--saffron);
  font-weight: 500; display: block; margin-bottom: 0.5rem;
}
.section-eyebrow--gold { color: var(--gold); }
.section-sub {
  font-family: var(--font-display);
  font-size: 0.625rem; letter-spacing: 0.3em;
  text-transform: uppercase; color: var(--tl3); font-weight: 400;
}

/* ── PILLARS ─────────────────────────────────────────────── */
.pillars-grid {
  display: grid; grid-template-columns: repeat(2,1fr);
  border: 1px solid var(--border-light);
  max-width: 900px; margin: 0 auto;
}
.pillar {
  border-right: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  padding: 2.25rem 2rem;
  position: relative; transition: background 0.25s; background: var(--birch);
}
.pillar:nth-child(2), .pillar:nth-child(4) { border-right: none; }
.pillar:nth-child(3), .pillar:nth-child(4) { border-bottom: none; }
.pillar:hover { background: var(--birch-dim); }
.pillar::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2px; background: var(--saffron);
  transform: scaleX(0); transform-origin: left; transition: transform 0.35s ease;
}
.pillar:hover::before { transform: scaleX(1); }
.pillar-label {
  font-family: var(--font-display);
  font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--saffron); margin-bottom: 1.125rem;
}
.pillar-stat {
  font-family: var(--font-display);
  font-size: 2.5rem; font-weight: 400; color: var(--indigo);
  line-height: 1; margin-bottom: 0.375rem;
}
.pillar-stat--sm { font-size: 1rem; letter-spacing: 0.06em; }
.pillar-desc  { font-size: 1rem; line-height: 1.6; color: var(--tl2); margin-bottom: 1rem; }
.pillar-detail {
  font-family: var(--font-ui);
  font-size: 0.6875rem; letter-spacing: 0.04em; color: var(--tl3); line-height: 1.75;
}
.pillar-detail--link a {
  color: var(--saffron);
  border-bottom: 1px solid rgba(222,115,54,0.3);
}

/* ── FRAMEWORK ───────────────────────────────────────────── */
.framework-inner { text-align: center; max-width: 600px; margin: 0 auto; }
.framework-title {
  font-family: var(--font-display);
  font-size: 2.125rem; font-weight: 400;
  letter-spacing: 0.07em; color: var(--birch);
  margin-bottom: 1.25rem; line-height: 1.2;
}
.framework-desc {
  font-size: 1.0625rem; line-height: 1.75;
  color: var(--td2); margin-bottom: 1.75rem;
}
.framework-award {
  display: inline-flex; align-items: center; gap: 0.75rem;
  border: 1px solid rgba(244,239,235,0.14);
  padding: 0.5rem 1.25rem; margin-bottom: 2.5rem;
}
.framework-award-dot  { width: 5px; height: 5px; background: var(--gold); border-radius: 50%; flex-shrink: 0; }
.framework-award-text { font-family: var(--font-ui); font-size: 0.6875rem; letter-spacing: 0.1em; color: rgba(244,239,235,0.45); }
.yantra-wrap { display: flex; justify-content: center; margin: 0 0 2.5rem; }

/* ── WRITING ─────────────────────────────────────────────── */
.writing-header {
  display: flex; align-items: baseline; justify-content: space-between;
  flex-wrap: wrap; gap: 0.875rem;
  max-width: 900px; margin: 0 auto 2.5rem;
}
.writing-title {
  font-family: var(--font-display);
  font-size: 1.625rem; font-weight: 400;
  letter-spacing: 0.08em; color: var(--indigo);
}
.writing-all {
  font-family: var(--font-ui);
  font-size: 0.6875rem; letter-spacing: 0.15em;
  text-transform: uppercase; color: var(--saffron);
  border-bottom: 1px solid rgba(222,115,54,0.35);
  transition: border-color 0.2s;
}
.writing-all:hover { border-color: var(--saffron); }
.articles-grid {
  display: grid; grid-template-columns: repeat(3,1fr);
  border-top: 1px solid var(--border-light);
  max-width: 900px; margin: 0 auto;
}
.article {
  border-right: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  padding: 1.875rem 1.625rem;
  display: flex; flex-direction: column;
  position: relative; transition: background 0.25s; background: var(--birch);
}
.article:last-child { border-right: none; }
.article:hover { background: var(--birch-dim); }
.article::after {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 2px; background: var(--saffron);
  transform: scaleY(0); transform-origin: top; transition: transform 0.3s ease;
}
.article:hover::after { transform: scaleY(1); }
.article-tag {
  font-family: var(--font-ui);
  font-size: 0.625rem; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--tulsi);
  margin-bottom: 0.875rem; display: block;
}
.article-title {
  font-size: 1.0625rem; font-weight: 500; line-height: 1.45;
  color: var(--indigo); margin-bottom: 0.875rem; flex-grow: 1;
}
.article-excerpt {
  font-size: 0.9375rem; line-height: 1.65;
  color: var(--tl2); margin-bottom: 1.375rem;
}
.article-cta {
  font-family: var(--font-ui);
  font-size: 0.625rem; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--saffron);
  display: block; margin-top: auto; transition: letter-spacing 0.2s;
}
.article:hover .article-cta { letter-spacing: 0.26em; }

/* ── TESTIMONIAL ─────────────────────────────────────────── */
.testimonial-inner { max-width: 580px; margin: 0 auto; text-align: center; }
.testimonial-mark {
  display: block; font-size: 5rem; line-height: 0.35;
  color: var(--gold); opacity: 0.28; margin-bottom: 2.5rem;
}
.testimonial-text {
  font-size: 1.4375rem; font-style: italic; line-height: 1.65;
  color: var(--birch); margin-bottom: 1.875rem;
}
.testimonial-attr {
  font-family: var(--font-ui);
  font-size: 0.6875rem; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--td3);
}

/* ── FOOTER ──────────────────────────────────────────────── */
.footer { background: var(--indigo-deep); padding: 4rem 3rem 2.5rem; border-top: 1px solid var(--border-dark); }
.footer-grid {
  display: grid; grid-template-columns: 1.75fr 1fr; gap: 4rem;
  padding-bottom: 2.75rem; border-bottom: 1px solid var(--border-dark);
  margin-bottom: 2rem; max-width: 900px; margin-left: auto; margin-right: auto;
}
.footer-brand {
  font-family: var(--font-display);
  font-size: 0.9375rem; font-weight: 500;
  letter-spacing: 0.12em; color: var(--birch); display: block; margin-bottom: 0.875rem;
}
.footer-bio { font-size: 0.9375rem; line-height: 1.7; color: var(--td2); margin-bottom: 1.375rem; }
.footer-links { display: flex; gap: 1.375rem; flex-wrap: wrap; }
.footer-link {
  font-family: var(--font-ui);
  font-size: 0.6875rem; letter-spacing: 0.15em;
  text-transform: uppercase; color: var(--td3);
  border-bottom: 1px solid rgba(244,239,235,0.12);
  transition: color 0.2s, border-color 0.2s;
}
.footer-link:hover { color: var(--td2); border-color: rgba(244,239,235,0.35); }
.footer-newsletter-label {
  font-family: var(--font-display);
  font-size: 0.625rem; font-weight: 600; letter-spacing: 0.25em;
  text-transform: uppercase; color: var(--td3); margin-bottom: 1rem; display: block;
}
.footer-newsletter-desc { font-size: 0.9375rem; color: var(--td2); line-height: 1.6; margin-bottom: 1.125rem; }
.footer-form { display: flex; }
.footer-input {
  flex: 1; min-width: 0;
  background: rgba(244,239,235,0.06);
  border: 1px solid rgba(244,239,235,0.14); border-right: none;
  padding: 0.625rem 0.875rem;
  font-family: var(--font-ui); font-size: 0.75rem;
  color: var(--birch); outline: none; transition: border-color 0.2s;
  -webkit-appearance: none; appearance: none;
}
.footer-input:focus { border-color: rgba(244,239,235,0.3); }
.footer-input::placeholder { color: rgba(244,239,235,0.25); }
.footer-btn {
  background: var(--saffron); border: none;
  padding: 0.625rem 1.25rem;
  font-family: var(--font-ui); font-size: 0.625rem;
  font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase;
  color: #fff; cursor: pointer; white-space: nowrap; display: inline-flex;
  align-items: center; transition: background 0.2s;
  text-decoration: none;
}
.footer-btn:hover { background: var(--saffron-dark); }
.footer-bottom {
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 0.75rem;
  max-width: 900px; margin: 0 auto;
}
.footer-copy  { font-family: var(--font-ui); font-size: 0.6875rem; color: rgba(244,239,235,0.2); letter-spacing: 0.06em; }
.footer-dharma { font-size: 0.9375rem; font-style: italic; color: rgba(244,239,235,0.2); }

/* ── RESPONSIVE ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .nav { padding: 0.875rem 1.25rem; }
  .nav-links { display: none; }
  .nav-links--open {
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(26,37,67,0.97); backdrop-filter: blur(14px);
    justify-content: center; align-items: center;
    gap: 2rem; z-index: 200;
  }
  .nav-links--open a { font-size: 1rem; letter-spacing: 0.18em; color: rgba(244,239,235,0.8); }
  .nav-toggle { display: block; z-index: 201; }
  .hero { padding: 7rem 1.5rem 5rem; min-height: auto; }
  .hero-om { font-size: 10rem; }
  .section { padding: 3.5rem 1.5rem; }
  .pillars-grid,
  .articles-grid { grid-template-columns: 1fr; }
  .pillar,
  .article { border-right: none !important; border-bottom: 1px solid var(--border-light); }
  .pillar:last-child,
  .article:last-child { border-bottom: none; }
  .footer { padding: 3rem 1.5rem 2rem; }
  .footer-grid { grid-template-columns: 1fr; gap: 2.5rem; }
  .footer-bottom { flex-direction: column; align-items: flex-start; }
  .writing-header { flex-direction: column; gap: 0.625rem; }
  .framework-title { font-size: 1.625rem; }
}
`;
