import { useState, useEffect, Fragment } from 'react';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { getBlocks } from '../services/siteBlocksApi';
import { PageSeo } from '../components/PageSeo';
import { getSeo } from '../services/seoApi';
import { getLayout } from '../services/sectionLayoutApi';
import { useReveal } from '../hooks/useReveal';
import InnerPageHero from '../components/Sections/InnerPageHero';
import WorkshopsSection from '../components/Sections/WorkshopsSection';
import InnerPageCTA from '../components/Sections/InnerPageCTA';
import { getWorkshopsData } from '../services/workshopsApi';

const DEFAULT_KEYS = ['hero', 'workshops_list', 'cta'];
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

// ── Static fallback data ──────────────────────────────────────────────────────

const STATIC_HERO = {
  eyebrow: 'Workshops & Retreats',
  title: 'Immersive Learning &',
  title_em: 'Dharmic Retreats',
  subtitle: 'Deep-dive workshops and residential retreats in Indian Knowledge Systems, Vedānta, and contemplative practice — designed for transformation, not just information.',
  breadcrumb: 'Workshops & Retreats',
};

const STATIC_INTRO = {
  eyebrow: 'Learning by Doing',
  title: 'Workshops &',
  title_em: 'Retreats',
  description: 'Immersive, experiential learning programs that bring ancient wisdom into living practice — from one-day corporate workshops to five-day residential retreats. Every program is built on the principle of Anubhava — direct experience as the only true teacher.',
  btn_label: 'Book a Session',
};

const STATIC_FILTERS = [
  { id: 1, key_name: 'corporate',  label: 'Corporate',       sort_order: 0 },
  { id: 2, key_name: 'iks',        label: 'IKS Education',   sort_order: 1 },
  { id: 3, key_name: 'wellness',   label: 'Wellness',        sort_order: 2 },
  { id: 4, key_name: 'leadership', label: 'Leadership',      sort_order: 3 },
  { id: 5, key_name: 'open',       label: 'Open Enrolment',  sort_order: 4 },
];

const STATIC_CARDS = [
  {
    id: 1, featured: true, cat_keys: 'iks open',
    glyph: 'ज्ञान', format: 'Certificate Course',
    tag: 'IKS Education · Open Enrolment',
    title: '36-Hour Certificate Course on Indian Knowledge Systems',
    description: "A structured, faculty-led journey through the foundational frameworks of Indian Knowledge Systems — covering Vedānta, Yoga, Nyāya, Mīmāṃsā, Āyurveda, and Arthaśāstra. Designed for educators, professionals, and learners seeking substantive engagement with India's intellectual heritage.",
    specs: [
      { icon: '◎', text: 'Online · Zoom' },
      { icon: '◈', text: '36 Hours · 12 Sessions' },
      { icon: '✦', text: 'Cohort-based' },
      { icon: '△', text: 'Certificate on Completion' },
    ],
    audience: 'For Educators · Professionals · Researchers',
    cta_label: 'Register Now',
    url: 'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
    sort_order: 0,
  },
  {
    id: 2, featured: false, cat_keys: 'corporate leadership',
    glyph: 'धर्म', format: 'Corporate',
    tag: 'Leadership · Strategy',
    title: 'Dharmic Creative Leadership Framework',
    description: 'A one-day intensive for senior leaders exploring Dharmic principles of creativity, decision-making, and organizational design. Using an elephant gun to shoot a sparrow is not just wasteful — it is a failure of Dharma.',
    specs: [
      { icon: '◎', text: 'On-site' },
      { icon: '◈', text: '1 Day' },
      { icon: '✦', text: 'Max 25 Participants' },
    ],
    audience: 'For CXOs · Senior Leadership',
    cta_label: 'Enquire',
    url: 'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
    sort_order: 1,
  },
  {
    id: 3, featured: false, cat_keys: 'corporate leadership',
    glyph: 'मन', format: 'Workshop',
    tag: 'Strategy · Culture',
    title: 'Organizational Culture Redesign Workshop',
    description: 'Redesigning organizational culture and HR systems through mental model evaluation, alignment workshops, and learning system design — for lasting, values-driven transformation.',
    specs: [
      { icon: '◎', text: 'On-site · Bengaluru' },
      { icon: '◈', text: '2–3 Days' },
      { icon: '✦', text: 'Custom-designed' },
    ],
    audience: 'For Leadership Teams · HR',
    cta_label: 'Enquire',
    url: 'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
    sort_order: 2,
  },
  {
    id: 4, featured: false, cat_keys: 'iks open',
    glyph: 'शिक्षा', format: 'Faculty Dev.',
    tag: 'IKS · Universities',
    title: 'Faculty Development Program — Integrating IKS in Academia',
    description: "Intensive workshops for university faculty on integrating IKS frameworks into pedagogy, research methodology, and curriculum design. Custom-designed per institution's needs and discipline focus.",
    specs: [
      { icon: '◎', text: 'On-site or Online' },
      { icon: '◈', text: '2–5 Days' },
      { icon: '✦', text: 'University-specific' },
    ],
    audience: 'For University Faculty · Deans',
    cta_label: 'Enquire',
    url: 'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
    sort_order: 3,
  },
  {
    id: 5, featured: false, cat_keys: 'wellness open',
    glyph: 'ॐ', format: 'Wellness',
    tag: 'Creativity · Wellbeing',
    title: 'Creativity Building & Corporate Wellness Program',
    description: 'Creativity enhancement programs for CXOs and key leadership — grounded in Bhāratīya knowledge traditions — alongside the design and implementation of corporate wellness programs.',
    specs: [
      { icon: '◎', text: 'On-site · Customisable' },
      { icon: '◈', text: '1–2 Days' },
      { icon: '✦', text: 'Max 20 Participants' },
    ],
    audience: 'For CXOs · Leadership Teams',
    cta_label: 'Enquire',
    url: 'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
    sort_order: 4,
  },
  {
    id: 6, featured: false, cat_keys: 'open iks wellness',
    glyph: 'संवाद', format: 'Upadesha',
    tag: 'Open Enrolment · Multi-topic',
    title: 'Upadesha Academy Immersive Workshops',
    description: 'Experiential workshops led by top intellectuals in Business, Spirituality, Sanskrit, Wellness, Yoga, and Psychology — open to all. Each workshop offers deep, unhurried engagement with a specific field or idea.',
    specs: [
      { icon: '◎', text: 'Bengaluru · Online' },
      { icon: '◈', text: '1–3 Days' },
      { icon: '✦', text: 'Open to All' },
    ],
    audience: 'Open to All',
    cta_label: 'View Programs',
    url: 'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
    sort_order: 5,
  },
];

const STATIC_RETREATS = [
  {
    id: 1, numeral: 'i.', sort_order: 0,
    title: 'Dharmic Leadership Retreat',
    sub: 'For CXOs & Boards · 2–5 Days',
    description: 'An immersive residential retreat blending strategy, organizational design, mental-model evaluation, and Dharmic enterprise principles. Held in carefully chosen natural settings — away from the noise of daily operations.',
    footer: '2-to-5-day formats · Custom design per group',
  },
  {
    id: 2, numeral: 'ii.', sort_order: 1,
    title: 'IKS Deep-Dive Retreat',
    sub: 'Open Enrolment · 3 Days',
    description: 'A three-day residential immersion into the foundational texts and frameworks of Indian Knowledge Systems — Vedānta, Yoga, and Dharmaśāstra — structured as an uninterrupted sādhanā of inquiry.',
    footer: 'Annual offering · Limited to 18 participants',
  },
  {
    id: 3, numeral: 'iii.', sort_order: 2,
    title: 'Team Vision & Strategy Retreat',
    sub: 'For Leadership Teams · 2–3 Days',
    description: 'Combining vision alignment, strategy development, and Dharmic organizational design for leadership teams seeking both clarity of direction and depth of purpose. Small groups only — maximum intimacy and impact.',
    footer: 'Custom location · Max 12 participants',
  },
];

const STATIC_TESTIMONIALS = [
  {
    id: 1, sort_order: 0,
    quote: 'One of the best sessions till date. The dimensions it opened up. The mindset shift that happened today which made me take the road of going deeper into what sort of research are we doing. Today\'s session made me question and also, to dig deeper into becoming someone who asks the right kind of questions. Thank you to the organizing team. Gratitude.',
    name: 'Pragya',
    role: 'Research Scholar, Central University of Gujarat',
  },
  {
    id: 2, sort_order: 1,
    quote: 'The case studies provided by Kulkarni sir gave an in-depth understanding of the need to preserve. I request Avnish sir if possible to conduct such lecture by Kulkarni sir once again. His insights are truly knowledgeable.',
    name: 'Hardi',
    role: 'Master Research Scholar, University of Mumbai',
  },
  {
    id: 3, sort_order: 2,
    quote: 'Vinay Kulkarni Ji\'s lecture was highly practical. He explained very simply why and how digital documentation should be done in the context of IKS.',
    name: 'Karuna Kumari Ram',
    role: 'Research Scholar, Sido Kanhu Murmu University',
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

function WorkshopsPage() {
  useReveal();

  const [hero,         setHero]         = useState(null);
  const [intro,        setIntro]        = useState(null);
  const [filters,      setFilters]      = useState(null);
  const [cards,        setCards]        = useState(null);
  const [retreats,     setRetreats]     = useState(null);
  const [testimonials, setTestimonials] = useState(null);
  const [extraBlocks, setExtra]         = useState([]);
  const [seo, setSeo]                   = useState({});
  const [layout, setLayout]             = useState(null);

  useEffect(() => {
    getWorkshopsData()
      .then(d => {
        setHero(d.hero?.eyebrow ? d.hero : null);
        setIntro(d.intro?.eyebrow ? d.intro : null);
        setFilters(Array.isArray(d.filters)      ? d.filters      : []);
        setCards(Array.isArray(d.cards)          ? d.cards        : []);
        setRetreats(Array.isArray(d.retreats)    ? d.retreats     : []);
        setTestimonials(Array.isArray(d.testimonials) ? d.testimonials : []);
      })
      .catch(() => {});
    getBlocks('workshops').then(setExtra).catch(() => {});
    getSeo('workshops').then(setSeo).catch(() => {});
  }, []);

  const effectiveLayout = buildLayout(layout, extraBlocks);
  const workshopsReady  = cards !== null;
  const sectionMap = {
    hero:           hero ? <InnerPageHero eyebrow={hero.eyebrow} title={hero.title} titleEm={hero.title_em} subtitle={hero.subtitle} breadcrumb={hero.breadcrumb} /> : null,
    workshops_list: workshopsReady ? <WorkshopsSection intro={intro} filters={filters ?? []} cards={cards} retreats={retreats ?? []} testimonials={testimonials ?? []} /> : null,
    cta:            <InnerPageCTA />,
  };
  return (
    <main>
      <PageSeo title={seo.seo_title} description={seo.meta_description} keyword={seo.focus_keyword} canonical={seo.canonical_url} ogImage={seo.og_image_url} schema={seo.custom_schema} />
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

export default WorkshopsPage;
