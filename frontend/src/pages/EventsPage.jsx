import { useState, useEffect, Fragment } from 'react';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { getBlocks } from '../services/siteBlocksApi';
import { PageSeo } from '../components/PageSeo';
import { getSeo } from '../services/seoApi';
import { getLayout } from '../services/sectionLayoutApi';
import { useReveal } from '../hooks/useReveal';
import InnerPageHero from '../components/Sections/InnerPageHero';
import EventsSection from '../components/Sections/EventsSection';
import InnerPageCTA from '../components/Sections/InnerPageCTA';
import { getEventsData } from '../services/eventsApi';

// ── Static fallback data ──────────────────────────────────────────────────────

const DEFAULT_KEYS = ['hero', 'events_list', 'cta'];
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

const STATIC_HERO = {
  eyebrow: 'Events',
  title: 'Upcoming &',
  title_em: 'Past Events',
  subtitle: 'Certificate courses, corporate retreats, public lectures, and academic convenings — rooted in Indian Knowledge Systems and Dharmic leadership.',
  breadcrumb: 'Events',
};

const STATIC_UPCOMING = [
  {
    id: 1, featured: true,
    day: '18', month: 'Jul', year: '2026',
    type: 'Certificate Course · Open Enrolment',
    title: '36-Hour Certificate Course on Indian Knowledge Systems — Cohort 4',
    description: 'A structured, faculty-led journey through the foundational frameworks of Indian Knowledge Systems — for educators, professionals, and learners seeking a substantive engagement with the field. Drawing on Vedānta, Yoga, Nyāya, Arthaśāstra, and Āyurveda.',
    meta: [
      { icon: '◎', text: 'Online · Zoom' },
      { icon: '◈', text: '36 Hours over 12 Sessions' },
      { icon: '✦', text: 'Vinay Kulkarni' },
    ],
    register_label: 'Register',
    spots_percent: 65,
    spots_label: 'Limited seats · 35% remaining',
    url: 'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
    sort_order: 0,
  },
  {
    id: 2, featured: false,
    day: '05', month: 'Aug', year: '2026',
    type: 'Corporate Workshop',
    title: 'Dharmic Leadership Retreat — Leadership Team Immersive',
    description: 'A two-day immersive for senior leadership teams blending strategy, mental-model evaluation, and dharmic enterprise principles. Custom-designed for boards and founders.',
    meta: [
      { icon: '◎', text: 'Bengaluru' },
      { icon: '◈', text: '2 Days' },
    ],
    register_label: 'Enquire',
    spots_percent: null, spots_label: '',
    url: 'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
    sort_order: 1,
  },
  {
    id: 3, featured: false,
    day: '20', month: 'Sep', year: '2026',
    type: 'Public Lecture · Upadesha Academy',
    title: 'The Pañcakoṣa Model and the Architecture of Human Flourishing',
    description: 'An open public lecture on what the Taittirīya Upaniṣad tells us about consciousness, education, and the design of a fully human life. For general audiences — no prior background required.',
    meta: [
      { icon: '◎', text: 'Online · Free Entry' },
      { icon: '◈', text: '2 Hours' },
    ],
    register_label: 'Register',
    spots_percent: null, spots_label: '',
    url: 'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
    sort_order: 2,
  },
];

const STATIC_COMPLETED = [
  { id: 1, day: '31', month: 'Jan 2026', type: 'Panel Discussion',              title: 'Vedanta in Education — Param · Unified Vision Panel',                          meta: ['Chanakya University · Bengaluru', 'Tripura Vasini, Palace Grounds'],  url: 'http://localhost:3001/blog/talks-interviews-podcasts/', sort_order: 0 },
  { id: 2, day: '20', month: 'Apr 2026', type: 'Academic Conclave',             title: 'IKS APEX Meet 2026 — An Experiment in Saṃvāda',                               meta: ['IKS APEX 2026', 'Panel of 15 scholar-practitioners'],                url: 'http://localhost:3001/blog/talks-interviews-podcasts/', sort_order: 1 },
  { id: 3, day: '08', month: 'Mar 2026', type: 'Lecture — IKS Certificate Course', title: 'Acharya Devo Bhava — Session 3, IKS Certificate Course',                   meta: ['Śrī Guru Teg Bahadur Khalsa College · Punjab', 'NLD Platform'],      url: 'http://localhost:3001/blog/2026/03/08/acharya-devo-bhava/', sort_order: 2 },
  { id: 4, day: '05', month: 'Mar 2026', type: 'Certificate Course — Cohort 3', title: '36-Hour Certificate Course on Indian Knowledge Systems — Cohort 3',            meta: ['Online', '36 Hours · 12 Sessions'],                                  url: 'http://localhost:3001/blog/2026/03/05/3378/', sort_order: 3 },
  { id: 5, day: '15', month: 'Dec 2025', type: 'Corporate Workshop',            title: 'Dharmic Creative Leadership Framework — Leadership Immersive',                  meta: ['Bengaluru', 'ALCHMI · Corporate Program'],                           url: 'http://localhost:3001/blog/talks-interviews-podcasts/', sort_order: 4 },
  { id: 6, day: '10', month: 'Sep 2025', type: 'Public Lecture · Upadesha Academy', title: 'Viewing the World Through Indian Knowledge Systems',                       meta: ['Online', 'Upadesha Academy Open Lecture'],                           url: 'http://localhost:3001/blog/talks-interviews-podcasts/', sort_order: 5 },
  { id: 7, day: '20', month: 'Jun 2025', type: 'Certificate Course — Cohort 2', title: '36-Hour Certificate Course on Indian Knowledge Systems — Cohort 2',            meta: ['Online', '36 Hours · 12 Sessions'],                                  url: 'http://localhost:3001/blog/talks-interviews-podcasts/', sort_order: 6 },
  { id: 8, day: '14', month: 'Jan 2025', type: 'Certificate Course — Cohort 1', title: '36-Hour Certificate Course on Indian Knowledge Systems — Cohort 1',            meta: ['Online', 'Inaugural Cohort'],                                        url: 'http://localhost:3001/blog/talks-interviews-podcasts/', sort_order: 7 },
];

// ── Page ──────────────────────────────────────────────────────────────────────

function EventsPage() {
  useReveal();

  const [hero,      setHero]      = useState(null);
  const [upcoming,  setUpcoming]  = useState(null);
  const [completed, setCompleted] = useState(null);
  const [extraBlocks, setExtra]   = useState([]);
  const [seo, setSeo]             = useState({});
  const [layout,      setLayout]  = useState(null);

  useEffect(() => {
    getEventsData()
      .then(d => {
        setHero(d.hero?.eyebrow ? d.hero : null);
        setUpcoming(Array.isArray(d.upcoming)  ? d.upcoming  : []);
        setCompleted(Array.isArray(d.completed) ? d.completed : []);
      })
      .catch(() => {});
    getBlocks('events').then(setExtra).catch(() => {});
    getSeo('events').then(setSeo).catch(() => {});
  }, []);

  const effectiveLayout = buildLayout(layout, extraBlocks);
  const sectionMap = {
    hero:        hero ? <InnerPageHero eyebrow={hero.eyebrow} title={hero.title} titleEm={hero.title_em} subtitle={hero.subtitle} breadcrumb={hero.breadcrumb} /> : null,
    events_list: (upcoming !== null || completed !== null) ? <EventsSection upcoming={upcoming ?? []} completed={completed ?? []} /> : null,
    cta:         <InnerPageCTA />,
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

export default EventsPage;
