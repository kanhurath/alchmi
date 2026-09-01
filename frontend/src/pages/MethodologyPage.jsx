import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal';
import { PageSeo } from '../components/PageSeo';
import InnerPageHero from '../components/Sections/InnerPageHero';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { getSeo } from '../services/seoApi';
import { getAllMethodologyData } from '../services/methodologyApi';
import { getLayout } from '../services/sectionLayoutApi';
import { getBlocks } from '../services/siteBlocksApi';
import './MethodologyPage.css';

// ── Defaults ──────────────────────────────────────────────────────────────────

const HERO_DEF = {
  eyebrow: 'Methodology', title: 'Our', title_em: 'Frameworks',
  subtitle: 'A set of proprietary frameworks built on Indian Knowledge Systems, systems thinking, and decades of practical experience.',
  breadcrumb: 'Methodology',
};

const FRAMEWORK_DEFAULTS = [
  {
    id: 1, label: 'Framework 01', title: 'The Dharmic Enterprise Framework',
    body: 'A complete model for envisioning, constructing, and running an organization that aligns profit with purpose. It gives you both the theory and the practical design and implementation methods to evolve into a Dharmic enterprise — one that is inherently sustainable because doing good is built into what it makes and how it works.',
    checklist: JSON.stringify([
      { title: 'Profit with purpose', desc: 'A core purpose beyond profit, expressed through the product or service itself.' },
      { title: 'Inherently sustainable', desc: 'Sustainability designed in, not bolted on.' },
    ]),
    image_key: 'dharmic_enterprise', bg: 'white', layout_reverse: 0,
  },
  {
    id: 2, label: 'Framework 02', title: 'Dharmic Innovation Framework',
    body: 'A structured approach to generating and developing ideas, products, and ventures that create real value and social good. It pairs systems thinking and design thinking with the wisdom of Indian Knowledge Systems, so innovation serves people and purpose, not novelty for its own sake.',
    checklist: '[]', image_key: 'dharmic_innovation', bg: 'gray', layout_reverse: 1,
  },
  {
    id: 3, label: 'Framework 03', title: 'Dharmic Design',
    body: 'Design thinking grounded in Indian Knowledge Systems. We apply it to products, services, organizations, spaces, and experiences — beginning with a deep understanding of the people involved, their svabhava and their needs, and ending in solutions that are both beautiful and right.',
    checklist: '[]', image_key: 'dharmic_design', bg: 'white', layout_reverse: 0,
  },
  {
    id: 4, label: 'Framework 04', title: 'Dharmic Leadership',
    body: 'A Dharmic leader is a systems thinker and a self-aware, conscious individual — the steady witness who sees the whole picture before acting. We help leaders cultivate that awareness and apply it to real decisions, so leadership becomes a practice rather than a performance.',
    checklist: JSON.stringify([
      { title: 'Systems thinking', desc: 'Seeing the whole, not just the parts.' },
      { title: 'Self-awareness', desc: 'The conscious leader who acts from clarity.' },
    ]),
    image_key: 'dharmic_leadership', bg: 'dark', layout_reverse: 1,
  },
];

const EXPLAINER_DEF = {
  h1: 'MeTHODOLOGY — what in the world is that?',
  lede: 'Our methodology is based on our practical, "in-the-trenches" business experience of more than 10 years and our strong educational background.',
  h2: 'method? what method?',
  tagline: 'we have as many methods as there are problems in the universe. we do not have a method. we have sharp eyes, curious minds, clever ideas and warm hearts. will that work?',
  bullets: 'We utilize discovery and diagnosis methods that are simple, practical, effective and powerful\nWe immerse ourselves in the customer\'s business environment and extract key insights\nWe understand the nuances of our customer\'s business and derive insights from our understanding\nWe work through a collaborative problem solving partnership with the business owners and executives\nWe listen intently to what the business owners and executives say and help them tap into their inner source to solve problems\nOur ultimate focus is to help our customers identify massive growth opportunities in adjacent segments',
  image_url: 'https://images.unsplash.com/photo-1547347298-4074fc3436a4?w=900&q=80',
  h3_confession: 'Confession time:',
  body_confession: 'our methods are known to be a little crazy, a little zany, and quite a bit out of the box orthodox. But don\'t worry, there is a method to our madness. We are mad. We are mad about finding creative solutions to your problems. We are mad about getting it right down to the tiniest detail. Work with us and you will go mad too! But mad in a good way. What is life without a bit of madness? We are serious about being mad about your business. Do not take us lightly!',
  h3_quote: 'Favorite quote:',
  quote: '"To a man with a hammer, everything looks like a nail!"',
  body_quote: 'After 20 years in business, most ordinary people are like "used solutions salesmen" who are roaming around trying to find buyers for old and worn-out solutions to dead and gone problems. Like Peter Drucker said, most businesspeople are trying to solve yesterday\'s problems. We operate at the cutting edge of here and now. And hereafter. Even the unknown, unseen tomorrow. We are not burdened by our past work. Our past work only helped to build our problem-solving muscles. Come, let us have a coffee and you can check out our muscles! What say?!',
};

const CTA_DEF = {
  heading: 'Learn to be a Dharmic leader.',
  desc: 'Bring these frameworks into your organization through coaching, programs, workshops, and retreats.',
  btn1_text: 'Book a Discovery Session', btn1_link: '/connect',
  btn2_text: 'See the Services',         btn2_link: '/services',
};

// ── Decorative SVGs keyed by image_key ───────────────────────────────────────

function FrameworkSvg({ imageKey, dark }) {
  const stroke1 = dark ? 'rgba(255,255,255,0.25)' : 'rgba(184,146,42,0.35)';
  const stroke2 = dark ? 'rgba(255,255,255,0.45)' : 'rgba(212,103,10,0.5)';
  const fill    = dark ? 'rgba(255,255,255,0.6)'  : 'var(--saffron,#d4670a)';

  if (imageKey === 'dharmic_innovation') return (
    <svg viewBox="0 0 100 100" fill="none" width="46%" height="46%">
      <circle cx="50" cy="50" r="10" stroke={stroke1} strokeWidth="1" />
      <circle cx="50" cy="50" r="24" stroke={stroke1} strokeWidth="1" />
      <circle cx="50" cy="50" r="2.6" fill={fill} />
      <circle cx="50" cy="26" r="2.6" fill={fill} />
      <circle cx="26" cy="50" r="2.6" fill={fill} />
      <circle cx="74" cy="50" r="2.6" fill={fill} />
    </svg>
  );
  if (imageKey === 'dharmic_design') return (
    <svg viewBox="0 0 100 100" fill="none" width="46%" height="46%">
      <rect x="30" y="30" width="40" height="40" stroke={stroke1} strokeWidth="1" />
      <line x1="30" y1="50" x2="70" y2="50" stroke={stroke1} strokeWidth="1" />
      <line x1="50" y1="30" x2="50" y2="70" stroke={stroke1} strokeWidth="1" />
      <circle cx="50" cy="50" r="10" stroke={stroke2} strokeWidth="1.2" />
    </svg>
  );
  if (imageKey === 'dharmic_leadership') return (
    <svg viewBox="0 0 100 100" fill="none" width="46%" height="46%">
      <circle cx="50" cy="38" r="12" stroke={stroke1} strokeWidth="1" />
      <circle cx="50" cy="38" r="4"  fill={fill} />
      <path d="M30 78c0-12 9-20 20-20s20 8 20 20" stroke={stroke1} strokeWidth="1" />
    </svg>
  );
  // default: dharmic_enterprise
  return (
    <svg viewBox="0 0 100 100" fill="none" width="46%" height="46%">
      <circle cx="50" cy="50" r="34" stroke={stroke1} strokeWidth="1" />
      <polygon points="50,26 68,58 32,58" stroke={stroke2} strokeWidth="1.2" />
      <circle cx="50" cy="55" r="7" fill={fill} opacity="0.7" />
    </svg>
  );
}

// ── CMS graphic renderer ─────────────────────────────────────────────────────

function SectionGraphic({ type, url, svg, html, fallback, className }) {
  if (type === 'image' && url)  return <img src={url} alt="" className={className} style={{ maxWidth: '100%' }} />;
  if (type === 'svg'   && svg)  return <span className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
  if (type === 'html'  && html) return <div  className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  if (type === 'none')          return null;
  return fallback || null;
}

// ── Check icon ────────────────────────────────────────────────────────────────

function CheckIcon({ dark }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" width="11" height="11">
      <path d="M2 6.2L4.6 9L10 3"
        stroke={dark ? 'var(--ink,#1a1208)' : '#ffffff'}
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Framework section ─────────────────────────────────────────────────────────

function FrameworkSection({ fw }) {
  const dark    = fw.bg === 'dark';
  const gray    = fw.bg === 'gray';
  const reverse = Number(fw.layout_reverse) === 1;

  let checklist = [];
  try { checklist = JSON.parse(fw.checklist || '[]'); } catch (_) {}

  return (
    <section className={`mth-framework${gray ? ' mth-fw-gray' : dark ? ' mth-fw-dark' : ' mth-fw-white'} reveal`}>
      <div className="mth-container">
        <div className={`mth-fw-grid${reverse ? ' mth-fw-grid--reverse' : ''}`}>

          <div className="mth-fw-text">
            {fw.label && (
              <div className="mth-eyebrow">
                <span className="mth-eyebrow-dash" />
                <span className="mth-eyebrow-text">{fw.label}</span>
              </div>
            )}
            <h3 className="mth-fw-title">{fw.title}</h3>
            {fw.body && <p className="mth-fw-body">{fw.body}</p>}

            {checklist.length > 0 && (
              <div className="mth-checklist">
                {checklist.map((item, i) => (
                  <div key={i} className="mth-check-item">
                    <span className="mth-check-icon"><CheckIcon dark={dark} /></span>
                    <div className="mth-check-text">
                      <h4 className="mth-check-title">{item.title}</h4>
                      {item.desc && <p className="mth-check-desc">{item.desc}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`mth-fw-image${dark ? ' mth-fw-image--dark' : ''}`} aria-hidden="true">
            <SectionGraphic
              type={fw.graphic_type}
              url={fw.graphic_url}
              svg={fw.graphic_svg}
              html={fw.graphic_html}
              fallback={<FrameworkSvg imageKey={fw.image_key} dark={dark} />}
              className="mth-fw-custom-graphic"
            />
          </div>

        </div>
      </div>
    </section>
  );
}

// ── Explainer section ─────────────────────────────────────────────────────────

function ExplainerSection({ data }) {
  const bullets = (data.bullets || '').split('\n').map(s => s.trim()).filter(Boolean);

  return (
    <section className="mth-explainer reveal">
      <div className="mth-container">
        {data.h1    && <h1 className="mth-expl-h1">{data.h1}</h1>}
        {data.lede  && <p className="mth-expl-lede">{data.lede}</p>}
        {data.h2    && <h2 className="mth-expl-h2">{data.h2}</h2>}
        {data.tagline && <p className="mth-expl-tagline">{data.tagline}</p>}

        {bullets.length > 0 && (
          <ul className="mth-expl-list">
            {bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )}

        {/* Graphic — CMS-managed type takes priority; falls back to legacy image_url */}
        {data.graphic_type && data.graphic_type !== '' ? (
          <SectionGraphic
            type={data.graphic_type}
            url={data.graphic_url}
            svg={data.graphic_svg}
            html={data.graphic_html}
            className="mth-expl-image"
          />
        ) : data.image_url ? (
          <img className="mth-expl-image" src={data.image_url} alt="Methodology" loading="lazy" />
        ) : null}

        {data.h3_confession  && <h3 className="mth-expl-h3">{data.h3_confession}</h3>}
        {data.body_confession && <p className="mth-expl-body">{data.body_confession}</p>}
        {data.h3_quote       && <h3 className="mth-expl-h3">{data.h3_quote}</h3>}
        {data.quote          && <p className="mth-expl-quote">{data.quote}</p>}
        {data.body_quote     && <p className="mth-expl-body">{data.body_quote}</p>}
      </div>
    </section>
  );
}

// ── CTA band ─────────────────────────────────────────────────────────────────

function CtaBand({ data }) {
  return (
    <section className="mth-cta-band reveal">
      {data.heading  && <h2 className="mth-cta-heading">{data.heading}</h2>}
      {data.desc     && <p  className="mth-cta-desc">{data.desc}</p>}
      <div className="mth-cta-buttons">
        {data.btn1_text && (
          <Link to={data.btn1_link || '/connect'} className="mth-btn mth-btn-primary">
            {data.btn1_text}
          </Link>
        )}
        {data.btn2_text && (
          <Link to={data.btn2_link || '/services'} className="mth-btn mth-btn-outline">
            {data.btn2_text}
          </Link>
        )}
      </div>
    </section>
  );
}

// ── Layout helpers ────────────────────────────────────────────────────────────

const DEFAULT_KEYS = ['hero', 'frameworks', 'explainer', 'cta'];

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

// ── Main page ─────────────────────────────────────────────────────────────────

function MethodologyPage() {
  useReveal();
  const [seo,         setSeo]         = useState({});
  const [hero,        setHero]        = useState(HERO_DEF);
  const [frameworks,  setFrameworks]  = useState(FRAMEWORK_DEFAULTS);
  const [explainer,   setExplainer]   = useState(EXPLAINER_DEF);
  const [cta,         setCta]         = useState(CTA_DEF);
  const [layout,      setLayout]      = useState(null);
  const [extraBlocks, setExtraBlocks] = useState([]);

  useEffect(() => {
    getSeo('methodology').then(setSeo).catch(() => {});
    getAllMethodologyData()
      .then(({ hero: h, frameworks: f, content }) => {
        setHero({ ...HERO_DEF, ...h });
        if (f?.length) setFrameworks(f);
        if (content?.explainer) setExplainer({ ...EXPLAINER_DEF, ...content.explainer });
        if (content?.cta)       setCta({ ...CTA_DEF, ...content.cta });
      })
      .catch(() => {});
    getLayout('methodology').then(setLayout).catch(() => {});
    getBlocks('methodology').then(setExtraBlocks).catch(() => {});
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
    frameworks: (
      <Fragment>
        {frameworks.map(fw => <FrameworkSection key={fw.id} fw={fw} />)}
      </Fragment>
    ),
    explainer: <ExplainerSection data={explainer} />,
    cta:       <CtaBand          data={cta}        />,
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

export default MethodologyPage;
