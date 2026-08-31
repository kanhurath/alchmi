import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal';
import { PageSeo } from '../components/PageSeo';
import InnerPageHero from '../components/Sections/InnerPageHero';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { getSeo } from '../services/seoApi';
import { getAllServicesData } from '../services/servicesApi';
import { getLayout } from '../services/sectionLayoutApi';
import { getBlocks } from '../services/siteBlocksApi';
import './ServicesPage.css';

// ── Defaults (match server defaults) ─────────────────────────────────────────

const HERO_DEF = {
  eyebrow: 'Services', title: 'What We', title_em: 'Offer',
  subtitle: 'We are limited only by your imagination, and we can certainly help tune your imagination to higher frequencies that bring more growth.',
  breadcrumb: 'Services',
};

const SECTION_DEF = {
  facilitation: {
    eyebrow: 'Facilitation',
    title: 'Conversations that actually move things forward.',
    description: 'We facilitate the moments that matter, so the room reaches real decisions and shared commitment — not just discussion.',
    pills: 'Corporate Meetings\nStrategic Planning Sessions\nRoundtable Discussions\nTown Halls\nPanel Discussions\nCompany Annual Events\nTeam Building Events',
  },
  workshops: {
    eyebrow: 'Workshops',
    title: 'Hands-on workshops, built for outcomes.',
    description: 'Run as a standalone session or a series. Pick a theme below, or tell us the problem and we will design a workshop around it.',
    pills: 'Creativity\nLeadership\nInnovation\nNew Product Development\nCulture Building\nLeadership Communication\nClarity of Thought\nStrategic Planning\nStrategy Development\nCreative Design\nDharmic Leadership\nDharmic Innovation\nTech Innovation\nGenerating New Ideas\nCustom Workshops for your specific problems',
  },
  retreats: {
    eyebrow: 'Retreats',
    title: 'Immersive retreats for people and organizations.',
    description: 'Deeper, experiential journeys for self-discovery, transformation, and direction — for individuals, leadership teams, and whole organizations.',
    pills: 'Self-Awareness\nSelf-Discovery\nSwabhava & Swadharma\nPersonal Transformation\nOrganizational Transformation\nRoadmap Development\nDharmic Innovation\nDharmic Design\nLife Balancing\nLife and Work Design\nLeadership Transition\nCustom Retreats for your specific needs',
  },
  industries: {
    eyebrow: 'Industries',
    title: 'Industries we serve.',
    description: 'Two and a half decades of experience across sectors in India, the USA, and Europe.',
    pills: 'Manufacturing\nHospitality\nEducation\nProfessional Services\nHealthcare\nBeauty\nWellness\nSpirituality\nPublic Figures\nGovernment\nOthers',
  },
  longform: {
    eyebrow:      'Services',
    h1:           'services',
    lead_quote:   '"We are limited only by your imagination, and we can certainly help tune your imagination to higher frequencies that bring more growth!"',
    h2:           'how can we help you?',
    body1:        'We work primarily with Founders/Owners/Presidents/CEOs of start-up/small and medium-sized companies and their executive teams to develop and implement business growth strategies.',
    body2:        'Perhaps one of the most important aspects of this work is the process of immersing ourselves in the vision, mission, culture and aspirations of an organization and its founders and seeing the world through their eyes and then using the insights gained from such a process to help tell their story to the world or their target audience in a language that seems familiar and easy to digest for them.',
    pull_out:     'Visionaries are often light years ahead of their audience and the society in which they are born. It needs a special immersion in their vision and work to translate it to the rest of the world.',
    body3:        'We develop leaders who think in systems, speak with clarity, and act from self-awareness — whether the work is one individual leader, a team, or an entire leadership bench. The aim is capacity that holds under pressure rather than techniques that fade once the workshop ends.',
    body4:        'For founders, our structured growth programmes move you from where you are to where you intend to be, with the strategy, focus, and daily habits that make growth sustainable rather than a sprint that quietly burns you out.',
    closing_line: 'We also provide 1-on-1 Leadership / Executive Coaching and Advisory.',
  },
  cgrowth: {
    eyebrow:           'Our framework',
    heading:           'C-GROWTH: Customer, Goals, Results, Offerings, Workforce, Technology, Harmony',
    desc:              'Seven elements, one system — the lens we use to diagnose where your growth is leaking and where it\'s ready to compound.',
    def_items:         'C :: Customers :: Prioritizing customer insights and satisfaction.\nG :: Goals (Leadership) :: Defining and driving company objectives.\nR :: Results :: Measuring outcomes and leadership effectiveness.\nO :: Offerings :: Evaluating the quality and market fit of products/services.\nW :: Workforce (Team) :: Optimizing team performance and collaboration.\nT :: Technology :: Leveraging technology for innovation and efficiency.\nH :: Harmony :: Aligning all elements — team, customers, offerings, and processes — for sustainable growth.',
    cta_text:          'Curious where your organization stands across these seven elements?',
    cta_btn:           'Request the C-Growth Analysis™',
    cta_link:          '/connect',
    gluttons_eyebrow:  'Gluttons for problem solving',
    gluttons_title:    'It is not a service. It is an experience. We love chewing on your problems!',
    gluttons_tagline:  'Bring us your growth problems, we are hungry!',
    gluttons_btn:      'Start the conversation',
    gluttons_btn_link: '/connect',
  },
  cta: {
    eyebrow: 'Not sure where to start?',
    heading: 'Tell us the problem. We will design the engagement.',
    btn1_text: 'Book a Discovery Session', btn1_link: '/connect',
    btn2_text: 'Sign up for a 3C Analysis', btn2_link: '/connect',
  },
};

const DEFAULT_CARDS = [
  { id: 1, title: 'Leadership Development', description: 'Develop leaders who think in systems, communicate with clarity, and act with self-awareness. Programs for individuals, teams, and whole leadership benches.', discuss_link: '/connect' },
  { id: 2, title: 'Coaching', description: 'One-on-one coaching for founders and executives — navigating growth, transition, and the harder questions of leadership in a confidential space.', discuss_link: '/connect' },
  { id: 3, title: 'Market Research', description: 'Decisions grounded in evidence, not assumption. We map your market, customers, and competitors — sizing the opportunity, testing real demand, and surfacing the insight that shows you where to play and how to win.', discuss_link: '/connect' },
  { id: 4, title: 'Dharmic Innovation', description: 'Generate and develop ideas, products, and ventures that create genuine value and social good, using our Dharmic Innovation framework.', discuss_link: '/connect' },
  { id: 5, title: 'Dharmic Design', description: 'Design thinking grounded in Indian Knowledge Systems, applied to products, services, organizations, and experiences.', discuss_link: '/connect' },
  { id: 6, title: 'Growth Programs for Founders', description: 'Structured programs that take founders from where they are to where they want to go — strategy, focus, and the habits that sustain growth.', discuss_link: '/connect' },
  { id: 7, title: 'Organizational Design', description: 'Structures, roles, and decision rights that fit your strategy and your people, so the organization can carry the growth you are aiming for.', discuss_link: '/connect' },
  { id: 8, title: 'Culture Design & Transformation', description: 'Shape a culture that lives your values and supports performance — designed deliberately, then embedded through real practice.', discuss_link: '/connect' },
  { id: 9, title: 'Event Design', description: 'Conferences, retreats, workshops, and roundtable discussions, designed end to end for genuine impact rather than spectacle.', discuss_link: '/connect' },
];

// ── Small helpers ─────────────────────────────────────────────────────────────

function pillsArray(str) {
  return (str || '').split('\n').map(s => s.trim()).filter(Boolean);
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" width="15" height="15">
      <path d="M2 6.2L4.6 9L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Renders a CMS-managed graphic: image URL, SVG code, HTML code, or a fallback element
function SectionGraphic({ type, url, svg, html, fallback, className }) {
  if (type === 'image' && url)  return <img src={url} alt="" className={className} style={{ maxWidth: '100%' }} />;
  if (type === 'svg'   && svg)  return <span className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
  if (type === 'html'  && html) return <div  className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  if (type === 'none')          return null;
  return fallback || null;
}

function CardIcon({ card }) {
  if (card.icon_type === 'image' && card.icon_url) {
    return <img src={card.icon_url} alt="" className="svc-card-icon-img" />;
  }
  if (card.icon_type === 'svg' && card.icon_svg) {
    return <span className="svc-card-icon-svg" dangerouslySetInnerHTML={{ __html: card.icon_svg }} />;
  }
  return <span className="svc-card-check"><CheckIcon /></span>;
}

function Eyebrow({ text, center }) {
  return (
    <div className={`svc-eyebrow${center ? ' svc-eyebrow--center' : ''}`}>
      <span className="svc-eyebrow-dash" />
      <span className="svc-eyebrow-text">{text}</span>
    </div>
  );
}

// ── Section: Service Cards Grid ───────────────────────────────────────────────

function CardsSection({ cards }) {
  const list = cards.length ? cards : DEFAULT_CARDS;
  return (
    <section className="svc-cards-section reveal">
      <div className="svc-container">
        <div className="svc-cards-grid">
          {list.map(card => (
            <div key={card.id} className="svc-card">
              <CardIcon card={card} />
              <h3 className="svc-card-title">{card.title}</h3>
              <p className="svc-card-desc">{card.description}</p>
              <Link to={card.discuss_link || '/connect'} className="svc-discuss-link">
                Discuss This →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section: Facilitation (split) ─────────────────────────────────────────────

const FACILITATION_DEFAULT_SVG = (
  <svg viewBox="0 0 100 100" fill="none" width="42%" height="42%">
    <circle cx="50" cy="48" r="30" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <circle cx="50" cy="30" r="4" fill="currentColor" opacity="0.5" />
    <circle cx="35" cy="60" r="4" fill="currentColor" opacity="0.5" />
    <circle cx="65" cy="60" r="4" fill="currentColor" opacity="0.5" />
    <path d="M50 30L35 60L65 60Z" stroke="currentColor" strokeWidth="1" opacity="0.4" />
  </svg>
);

function FacilitationSection({ data }) {
  const pills = pillsArray(data.pills);
  return (
    <section className="svc-split-section svc-bg-parchment reveal">
      <div className="svc-container">
        <div className="svc-split-grid">
          <div>
            <Eyebrow text={data.eyebrow} />
            <h2 className="svc-split-title">{data.title}</h2>
            <p className="svc-split-desc">{data.description}</p>
            <div className="svc-pill-row">
              {pills.map((p, i) => <span key={i} className="svc-pill">{p}</span>)}
            </div>
          </div>
          <div className="svc-split-image" aria-hidden="true">
            <SectionGraphic
              type={data.graphic_type}
              url={data.graphic_url}
              svg={data.graphic_svg}
              html={data.graphic_html}
              fallback={FACILITATION_DEFAULT_SVG}
              className="svc-section-graphic"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section: Workshops ────────────────────────────────────────────────────────

function WorkshopsSection({ data }) {
  const pills = pillsArray(data.pills);
  return (
    <section className="svc-text-section svc-bg-cream reveal">
      <div className="svc-container">
        <Eyebrow text={data.eyebrow} />
        <h2 className="svc-text-title">{data.title}</h2>
        <p className="svc-text-desc">{data.description}</p>
        <div className="svc-pill-row">
          {pills.map((p, i) => <span key={i} className="svc-pill">{p}</span>)}
        </div>
      </div>
    </section>
  );
}

// ── Section: Retreats (dark) ──────────────────────────────────────────────────

function RetreatsSection({ data }) {
  const pills = pillsArray(data.pills);
  return (
    <section className="svc-retreats-section reveal">
      <div className="svc-container">
        <Eyebrow text={data.eyebrow} />
        <h2 className="svc-retreats-title">{data.title}</h2>
        <p className="svc-retreats-desc">{data.description}</p>
        <div className="svc-pill-row">
          {pills.map((p, i) => <span key={i} className="svc-pill-dark">{p}</span>)}
        </div>
      </div>
    </section>
  );
}

// ── Section: Industries ───────────────────────────────────────────────────────

function IndustriesSection({ data }) {
  const pills = pillsArray(data.pills);
  return (
    <section className="svc-text-section svc-bg-parchment reveal">
      <div className="svc-container">
        <Eyebrow text={data.eyebrow} />
        <h2 className="svc-text-title">{data.title}</h2>
        <p className="svc-text-desc">{data.description}</p>
        <div className="svc-pill-row">
          {pills.map((p, i) => <span key={i} className="svc-pill">{p}</span>)}
        </div>
      </div>
    </section>
  );
}

// ── Section: Services Intro (replaces Long-form) ─────────────────────────────

function IntroSection({ data }) {
  return (
    <section className="svc-intro reveal">
      <div className="svc-container">
        {data.eyebrow    && <Eyebrow text={data.eyebrow} />}
        {data.h1         && <h1 className="svc-intro-h1">{data.h1}</h1>}
        {data.lead_quote && (
          <div className="svc-lead-quote"><p>{data.lead_quote}</p></div>
        )}
        {data.h2 && <h2 className="svc-intro-h2">{data.h2}</h2>}
        <div className="svc-intro-body-group">
          {data.body1 && <p className="svc-intro-body svc-intro-body--emphasis">{data.body1}</p>}
          {data.body2 && <p className="svc-intro-body">{data.body2}</p>}
        </div>
        {data.pull_out && (
          <div className="svc-pull-out"><p>{data.pull_out}</p></div>
        )}
        <div className="svc-intro-body-group">
          {data.body3 && <p className="svc-intro-body">{data.body3}</p>}
          {data.body4 && <p className="svc-intro-body">{data.body4}</p>}
        </div>
        {data.closing_line && <p className="svc-closing-line">{data.closing_line}</p>}
      </div>
    </section>
  );
}

// ── Section: C-Growth (redesigned) ───────────────────────────────────────────

function parseDefItems(str) {
  return (str || '').split('\n').map(line => {
    const [letter, title, ...rest] = line.split('::').map(s => s.trim());
    return { letter: letter || '', title: title || '', desc: rest.join('::').trim() };
  }).filter(i => i.letter && i.title);
}

const CGROWTH_DEFAULT_SVG = (
  <svg viewBox="0 0 460 460" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cgRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e8c97a" />
        <stop offset="100%" stopColor="#c8a84b" />
      </linearGradient>
      <filter id="cgNodeShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#1a1208" floodOpacity="0.12" />
      </filter>
    </defs>
    <circle cx="230" cy="230" r="158" fill="none" stroke="url(#cgRingGrad)" strokeWidth="38" />
    <g fontFamily="'Cormorant Garamond', serif" fill="#1a1208">
      <circle cx="230" cy="72"  r="57" fill="#fff" stroke="#1a1208" strokeWidth="1.4" filter="url(#cgNodeShadow)" />
      <text x="230" y="77"  textAnchor="middle" fontSize="13"><tspan fontWeight="700" fill="#d4670a" fontSize="15">C</tspan>ustomer</text>
      <circle cx="368" cy="150" r="57" fill="#fff" stroke="#1a1208" strokeWidth="1.4" filter="url(#cgNodeShadow)" />
      <text x="368" y="155" textAnchor="middle" fontSize="13"><tspan fontWeight="700" fill="#d4670a" fontSize="15">G</tspan>oals</text>
      <circle cx="368" cy="310" r="57" fill="#fff" stroke="#1a1208" strokeWidth="1.4" filter="url(#cgNodeShadow)" />
      <text x="368" y="315" textAnchor="middle" fontSize="13"><tspan fontWeight="700" fill="#d4670a" fontSize="15">R</tspan>esults</text>
      <circle cx="230" cy="388" r="57" fill="#fff" stroke="#1a1208" strokeWidth="1.4" filter="url(#cgNodeShadow)" />
      <text x="230" y="393" textAnchor="middle" fontSize="13"><tspan fontWeight="700" fill="#d4670a" fontSize="15">O</tspan>fferings</text>
      <circle cx="92"  cy="310" r="57" fill="#fff" stroke="#1a1208" strokeWidth="1.4" filter="url(#cgNodeShadow)" />
      <text x="92"  y="315" textAnchor="middle" fontSize="13"><tspan fontWeight="700" fill="#d4670a" fontSize="15">W</tspan>orkforce</text>
      <circle cx="92"  cy="150" r="57" fill="#fff" stroke="#1a1208" strokeWidth="1.4" filter="url(#cgNodeShadow)" />
      <text x="92"  y="155" textAnchor="middle" fontSize="13"><tspan fontWeight="700" fill="#d4670a" fontSize="15">T</tspan>echnology</text>
      <circle cx="230" cy="230" r="68" fill="#1a1208" filter="url(#cgNodeShadow)" />
      <text x="230" y="236" textAnchor="middle" fontSize="14" fill="#fff"><tspan fontWeight="700" fill="#e8c97a" fontSize="16">H</tspan>armony</text>
    </g>
  </svg>
);

function CGrowthSection({ data }) {
  const defItems = parseDefItems(data.def_items);
  return (
    <section className="svc-cgrowth reveal">
      <div className="svc-container">

        <div className="svc-diagram-card">
          <div className="svc-diagram-wrap">
            <SectionGraphic
              type={data.graphic_type}
              url={data.graphic_url}
              svg={data.graphic_svg}
              html={data.graphic_html}
              fallback={CGROWTH_DEFAULT_SVG}
              className="svc-section-graphic"
            />
          </div>
        </div>

        <div className="svc-cgrowth-head">
          {data.eyebrow && <Eyebrow text={data.eyebrow} center />}
          {data.heading  && <h3 className="svc-cgrowth-heading">{data.heading}</h3>}
          {data.desc     && <p  className="svc-cgrowth-desc">{data.desc}</p>}
        </div>

        {defItems.length > 0 && (
          <div className="svc-def-grid">
            {defItems.map((item, i) => {
              const isLast = i === defItems.length - 1;
              return (
                <div key={i} className={`svc-def-card${isLast ? ' svc-def-card--full' : ''}`}>
                  <span className={`svc-def-badge${isLast ? ' svc-def-badge--accent' : ''}`}>{item.letter}</span>
                  <div className="svc-def-text">
                    <h4>{item.title}</h4>
                    {item.desc && <p>{item.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="svc-cgrowth-cta">
          {data.cta_text && <p>{data.cta_text}</p>}
          {data.cta_btn  && (
            <Link to={data.cta_link || '/connect'} className="svc-action-btn">
              {data.cta_btn}
            </Link>
          )}
        </div>

        <div className="svc-gluttons-card">
          {data.gluttons_eyebrow && <p className="svc-gluttons-eyebrow">{data.gluttons_eyebrow}</p>}
          {data.gluttons_title   && <h3 className="svc-gluttons-title">{data.gluttons_title}</h3>}
          {data.gluttons_tagline && <p className="svc-gluttons-tagline">{data.gluttons_tagline}</p>}
          {data.gluttons_btn     && (
            <Link to={data.gluttons_btn_link || '/connect'} className="svc-action-btn">
              {data.gluttons_btn}
            </Link>
          )}
        </div>

      </div>
    </section>
  );
}

// ── Section: CTA Band ─────────────────────────────────────────────────────────

function CtaBand({ data }) {
  return (
    <section className="svc-cta-band reveal">
      <Eyebrow text={data.eyebrow} center />
      <h2 className="svc-cta-heading">{data.heading}</h2>
      <div className="svc-cta-buttons">
        <Link to={data.btn1_link || '/connect'} className="svc-btn svc-btn-primary">
          {data.btn1_text}
        </Link>
        <Link to={data.btn2_link || '/connect'} className="svc-btn svc-btn-outline">
          {data.btn2_text}
        </Link>
      </div>
    </section>
  );
}

// ── Layout helpers ────────────────────────────────────────────────────────────

const DEFAULT_KEYS = ['hero', 'cards', 'facilitation', 'workshops', 'retreats', 'industries', 'longform', 'cgrowth', 'cta'];

function buildLayout(savedLayout, extraBlocks) {
  const base = savedLayout && savedLayout.length > 0
    ? savedLayout.map(i => ({ ...i }))
    : DEFAULT_KEYS.map((key, i) => ({ section_key: key, sort_order: i + 1, enabled: true }));
  const inLayout = new Set(base.map(i => i.section_key));
  extraBlocks.forEach((b, i) => {
    const key = `block:${b.id}`;
    if (!inLayout.has(key)) base.push({ section_key: key, sort_order: base.length + i + 1, enabled: true });
  });
  return base;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function ServicesPage() {
  useReveal();
  const [seo,         setSeo]         = useState({});
  const [hero,        setHero]        = useState(HERO_DEF);
  const [cards,       setCards]       = useState([]);
  const [sec,         setSec]         = useState(SECTION_DEF);
  const [layout,      setLayout]      = useState(null);
  const [extraBlocks, setExtraBlocks] = useState([]);

  useEffect(() => {
    getSeo('services').then(setSeo).catch(() => {});
    getAllServicesData()
      .then(({ hero: h, cards: c, content }) => {
        setHero({ ...HERO_DEF, ...h });
        setCards(c || []);
        setSec({ ...SECTION_DEF, ...content });
      })
      .catch(() => {});
    getLayout('services').then(setLayout).catch(() => {});
    getBlocks('services').then(setExtraBlocks).catch(() => {});
  }, []);

  const effectiveLayout = buildLayout(layout, extraBlocks);

  const sectionMap = {
    hero: (
      <InnerPageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        titleEm={hero.title_em}
        subtitle={hero.subtitle}
        breadcrumb={hero.breadcrumb}
      />
    ),
    cards:         <CardsSection        cards={cards}               />,
    facilitation:  <FacilitationSection data={sec.facilitation}    />,
    workshops:     <WorkshopsSection    data={sec.workshops}        />,
    retreats:      <RetreatsSection     data={sec.retreats}         />,
    industries:    <IndustriesSection   data={sec.industries}       />,
    longform:      <IntroSection        data={sec.longform}         />,
    cgrowth:       <CGrowthSection      data={sec.cgrowth}          />,
    cta:           <CtaBand             data={sec.cta}              />,
  };

  return (
    <main>
      <PageSeo
        title={seo.seo_title}
        description={seo.meta_description}
        keyword={seo.focus_keyword}
        canonical={seo.canonical_url}
        ogImage={seo.og_image_url}
        schema={seo.custom_schema}
      />
      {effectiveLayout.map(item => {
        if (!item.enabled) return null;
        if (item.section_key.startsWith('block:')) {
          const block = extraBlocks.find(b => `block:${b.id}` === item.section_key);
          return block ? <BlockRenderer key={item.section_key} block={block} /> : null;
        }
        const el = sectionMap[item.section_key];
        return el ? <Fragment key={item.section_key}>{el}</Fragment> : null;
      })}
    </main>
  );
}

export default ServicesPage;
