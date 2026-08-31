import { useState, useEffect, Fragment } from 'react';
import { useReveal } from '../hooks/useReveal';
import InnerPageHero from '../components/Sections/InnerPageHero';
import InnerPageCTA from '../components/Sections/InnerPageCTA';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { getTeachingData } from '../services/teachingApi';
import { getBlocks } from '../services/siteBlocksApi';
import { PageSeo } from '../components/PageSeo';
import { getSeo } from '../services/seoApi';
import { getLayout } from '../services/sectionLayoutApi';
import './TeachingPage.css';

const DEFAULT_KEYS = ['hero', 'stats', 'history', 'courses', 'feedback', 'themes', 'cta'];
// These section keys render inside .tch-content-wrap for max-width constraint
const WRAP_INNER = new Set(['stats', 'history', 'courses', 'feedback', 'themes']);

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

// ── UI helpers ────────────────────────────────────────────────────────────────

function Stars({ count = 5 }) {
  return (
    <div className="fb-stars">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`star${i >= count ? ' empty' : ''}`} />
      ))}
    </div>
  );
}

function ThCard({ variant = '', featured = false, role, period, location, org, stats, bullets, plain, tags }) {
  return (
    <div className={`th-card${featured ? ' featured' : ''}${variant ? ` ${variant}` : ''} reveal`}>
      <div className="th-card-band" />
      <div className="th-card-inner">
        <div className="th-top">
          <span className="th-role-pill">{role}</span>
          <div className="th-period-loc">
            <div className="th-period">{period}</div>
            {location && <div className="th-location">{location}</div>}
          </div>
        </div>
        <div className="th-org">{org}</div>
        <div className="th-divider" />
        {stats && stats.length > 0 && (
          <div className="th-stats">
            {stats.map((s, i) => (
              <div key={i} className="th-stat">
                <span className="th-stat-val" dangerouslySetInnerHTML={{ __html: s.val }} />
                <span className="th-stat-key">{s.key}</span>
              </div>
            ))}
          </div>
        )}
        {bullets && bullets.length > 0 && (
          <ul className="th-bullets">
            {bullets.map((b, i) => <li key={i} dangerouslySetInnerHTML={{ __html: b }} />)}
          </ul>
        )}
        {plain && <p className="th-plain">{plain}</p>}
        {tags && tags.length > 0 && (
          <div className="th-tags">
            {tags.map(t => <span key={t} className="th-tag">{t}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function FbCard({ stars = 5, text, name, institution, avClass }) {
  return (
    <div className="fb-card reveal">
      <Stars count={stars} />
      <span className="fb-qmark">&ldquo;</span>
      <p className="fb-text">{text}</p>
      <div className="fb-rule" />
      <div className="fb-author">
        <div className={`fb-av ${avClass}`}>{name?.charAt(0)}</div>
        <div>
          <div className="fb-name">{name}</div>
          <div className="fb-inst">{institution}</div>
        </div>
      </div>
    </div>
  );
}

// ── Static fallback data ──────────────────────────────────────────────────────

const STATIC_HERO = {
  eyebrow: 'Academic Teaching',
  title: 'Teaching &',
  title_em: 'Faculty Work',
  subtitle: 'A record of university-level teaching engagements, faculty development programs, and course delivery — spanning Indian Knowledge Systems, leadership pedagogy, and civilizational education.',
  breadcrumb: 'Teaching',
};

const STATIC_STATS = [
  { id: 1, num: '5+',    label: 'Institutions' },
  { id: 2, num: '500+',  label: 'Students Reached' },
  { id: 3, num: '4.6/5', label: 'Avg. Rating' },
];

const STATIC_HISTORY = [
  {
    id: 1, featured: true, variant: '', role: 'Guest Faculty',
    period: 'Jan 2026', location: 'Bengaluru, India',
    org: 'JAIN (Deemed-to-be-University)',
    stats: [
      { val: '162', key: 'Participants' },
      { val: '4.62<small style="font-size:1rem">/5</small>', key: 'Avg. Rating' },
      { val: '6', key: 'Core Topics' },
    ],
    bullets: [
      'Designed and delivered a multi-session course: <em>"Viewing the World Through Indian Knowledge Systems"</em> for 162 participants.',
      'Course covered foundational IKS concepts, epistemological frameworks, the Pañcakoṣa model, antaḥkaraṇa, Mokṣic Design, and contemporary relevance.',
      'Feedback highlights: <em>"thought-provoking," "enriching and deep," "innovative in its pedagogy," "a wonderful lecture that provoked reflective thinking."</em>',
    ],
    plain: '',
    tags: ['IKS', 'Epistemology', 'Pañcakoṣa', 'Mokṣic Design', '162 Participants', 'Avg. 4.62 / 5'],
    sort_order: 0,
  },
  {
    id: 2, featured: false, variant: '', role: 'Guest Faculty',
    period: 'Sep 2025 – Sep 2026', location: 'Pune, India',
    org: 'UGC – Savitri Bai Phule University',
    stats: [], plain: '',
    bullets: [
      'Facilitated faculty development programs reaching educators from <strong>20 universities</strong>.',
      'Conducted two 90-minute workshops on Indian Knowledge Systems.',
    ],
    tags: ['Faculty Development', 'IKS Workshops', '20 Universities'],
    sort_order: 1,
  },
  {
    id: 3, featured: false, variant: 'accent', role: 'Guest Faculty',
    period: '2000', location: 'Bengaluru, India',
    org: 'Nucleus of Learning',
    stats: [], plain: '',
    bullets: [
      'Developed and taught the session <em>"Āchāra Devo Bhava"</em> as part of the IKS Certificate Course.',
      'Produced comprehensive blog articles, e-books, and learning materials from session content.',
    ],
    tags: ['IKS Certificate Course', 'Āchāra Devo Bhava', 'Content Production'],
    sort_order: 2,
  },
  {
    id: 4, featured: false, variant: 'gold', role: 'Researcher / Author',
    period: 'Jan 2024 – Jan 2025', location: 'Bengaluru, India',
    org: 'Siddhanta Knowledge Foundation',
    stats: [], bullets: [],
    plain: 'Contributed to designing IKS-based BBA and MBA curricula as part of a curriculum design committee — integrating Dharmic frameworks into modern business education programs.',
    tags: ['Curriculum Design', 'BBA · MBA', 'IKS Integration'],
    sort_order: 3,
  },
  {
    id: 5, featured: false, variant: '', role: 'MS Student · Presenter',
    period: 'Oct 2000 – Aug 2002', location: 'Tucson, United States',
    org: 'University of Arizona',
    stats: [], plain: '',
    bullets: [
      '<em>Presented to Faculty Panel, Tucson, AZ (2002).</em>',
      'Title: <em>"Systems Thinking, Mental Models, Teaching &amp; Learning."</em>',
      'Explored the intersection of systems engineering methodology with cognitive learning frameworks.',
    ],
    tags: ['Systems Thinking', 'Mental Models', 'Faculty Presentation'],
    sort_order: 4,
  },
  {
    id: 6, featured: false, variant: 'accent', role: 'Workshop Facilitator',
    period: 'Jun 2 – 4, 2022', location: 'India',
    org: 'Rashtram School of Public Leadership, Rishihood University',
    stats: [], plain: '',
    bullets: [
      'Term III elective workshop — <em>Personal Leadership Framework &amp; Roadmap.</em>',
      'Delivered over 3 days (5 hours each) for a total of <strong>15 contact hours</strong>.',
      'Awarded <strong>1 academic credit</strong> upon completion.',
      'Mode: immersive in-person workshop format.',
    ],
    tags: ['Leadership', 'Personal Framework', '1 Credit', '15 Hours', 'Term III'],
    sort_order: 5,
  },
];

const STATIC_COURSES = [
  {
    id: 1,
    tag: 'IKS · Guest Faculty · JAIN University',
    title: 'Viewing the World Through Indian Knowledge Systems',
    subtitle: 'From Ancient Wisdom to Living Ways of Seeing, Being, and Healing',
    date_text: 'January 24, 2026\nBengaluru, India',
    location_text: 'Bengaluru, India',
    rating: '4.62',
    rating_label: 'Average Participant Rating',
    pull_quote: '"What if everything we thought we knew about success, progress, happiness, and even health was built upon borrowed assumptions — mental constructs we never consciously chose? This is not a philosophical exercise. This is the ground beneath our feet."',
    pq_attr: '— Vinay Kulkarni, Opening of the Course',
    specs: [
      { val: '162', key: 'Participants' },
      { val: '4.62', key: 'Avg. Rating / 5' },
      { val: '6', key: 'Core Topics' },
      { val: 'JAIN', key: 'Institution' },
    ],
    paragraphs: [
      { text: 'The Bhāratīya worldview rests upon a sophisticated understanding of reality that cannot be reduced to religious belief or cultural practice. Where modern frameworks separate the secular from the sacred, the material from the spiritual, Dharmic thinking recognizes these as inseparable dimensions of a unified whole.', highlight: false },
      { text: 'Dharma is not religion in the Western sense — it is the cosmic law that governs all existence, from the movement of galaxies to the beating of a human heart. Our current sustainability crisis has a simple diagnosis: the whole world began operating in the Artha-Kāma plane and forgot Dharma — the harmonizing principle — and Mokṣa — the liberating principle.', highlight: false },
      { text: 'The Pañcakoṣa model reveals something breathtaking about our ancestors — every aspect of traditional life, from the food we ate to the temples we built to the cities we designed, was carefully crafted so that even the most ordinary person, going about the most ordinary tasks, was being slowly moved from the Annamaya toward the Ānandamaya koṣa. Day by day. Hour by hour. Task by task.', highlight: true },
      { text: 'The world does not need more solutions generated from the same consciousness that created our current crises. It needs transformed minds — visions clarified, hearts purified. The ancient wisdom awaits. It has always been here.', highlight: false },
    ],
    sort_order: 0,
  },
  {
    id: 2,
    tag: 'IKS · Guest Lecture · Faculty Development Program',
    title: 'From Documentation to Darśana',
    subtitle: 'Digital Tools and the Future of Indian Knowledge Systems',
    date_text: 'May 26, 2026\nOnline / National',
    location_text: 'Online / National',
    rating: '5',
    rating_label: 'Majority Rating',
    pull_quote: '"Preservation is the easy part. The real task is learning to ask the right questions of our own inheritance."',
    pq_attr: '— Vinay Kulkarni, Session Thesis',
    specs: [],
    paragraphs: [
      { text: 'This lecture — delivered to research scholars and assistant professors from universities across India — addressed the intersection of digital documentation tools and the epistemological frameworks of Indian Knowledge Systems. The session moved beyond archival preservation toward the deeper question of Darśana: how do we not merely store knowledge, but learn to see through it?', highlight: false },
      { text: 'The session drew strong participant endorsements from scholars at Central University of Gujarat, University of Mumbai, CHRIST University, Panjab University Chandigarh, Jain University, and many others — with multiple participants requesting follow-up sessions and resource sharing.', highlight: false },
    ],
    sort_order: 1,
  },
];

const STATIC_FEEDBACK = [
  { id: 1, stars: 5, av_class: 'av-a', name: 'Simran', institution: 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University', text: 'For years, I searched for a worldview that would make my work and my life one continuous act of creation. The inner blockages were real — patterns of withdrawal, unprocessed karmas, a tendency to blame the world rather than look inward. What the Leadership Fundamentals Programme gave me was a pathway through that terrain, step by step, in a language I could actually understand. And what my classmates gave me was something I did not expect to find in a classroom: the raw, transformative power of other people\'s stories. I leave with a support system that feels like family.' },
  { id: 2, stars: 5, av_class: 'av-b', name: 'Dhavan Jahagirdar', institution: 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University', text: 'As a year-long programme drew to its close, Shri Vinay Kulkarni ji used these three days to take us somewhere we had not been. The buddy exercise, the shared life stories, the Life Review Dhyāna meditation — each one reached somewhere new. But it was the lunch table session that I will carry longest: the moment an entire cohort turned to one another and named what was good in each person. I was in tears. So were they. These were pure tears — of gratitude, of recognition, of the astonishing discovery that people had been quietly moved by things I had done without even knowing. I leave a lighter person.' },
  { id: 3, stars: 5, av_class: 'av-c', name: 'PrasadRaje Bhopale', institution: 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University', text: 'The sessions began with a question: what is holding you back? My answer was the mismanagement of energy within me. Over three days, Shri Vinay Kulkarni ji gave that answer its full depth. The meditation revealed years of accumulated grief I had not known was there. I wept. And in the clearing that followed, I could see — for the first time — a roadmap for the life I actually want to build. What I also witnessed was a teacher who put his phone away on day one and did not pick it up again. For four full days of teaching, I never saw it in his hand once. That kind of dedication teaches without words.' },
  { id: 4, stars: 5, av_class: 'av-d', name: 'Padamraj Shetty', institution: 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University', text: 'In three days, Shri Vinay Kulkarni ji asked us one question that opened everything: how will you create an impact within a 1-kilometre radius of where you stand? It is the smallest possible canvas — and the right place to begin. The Life Review Jnāna meditation made me feel lighter in a way I had not experienced in years. And a seed planted long ago — the belief that my memory was poor — was finally uprooted. I had programmed that belief without knowing it. I leave with a new understanding of what is possible when the stories we carry about ourselves are examined honestly.' },
  { id: 5, stars: 5, av_class: 'av-a', name: 'Anshuman', institution: 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University', text: 'The Johari Window framework describes four quadrants of the self: what is known to both self and others, what is hidden from others, what others see but the self cannot, and what is unknown to everyone. The three-day immersive experience with Shri Vinay Kulkarni ji was where I watched all four of those quadrants shift. I am, by temperament, deeply reserved — a listener who holds his inner world carefully. In this programme, for the first time, I opened without force. The group held that opening with care. I leave with a clearer sense of what I am working toward: to become an authority in education and jurisprudence, anchored by a daily Dināchāryā of japa, study, and writing.' },
  { id: 6, stars: 5, av_class: 'av-b', name: 'Sushant Chandrashekhar Gangoli', institution: 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University', text: 'The Turiya meditation was where things became clear. Contemplating the present reality of my life across every dimension — professional, familial, spiritual, financial, physical — and then manifesting it as it ought to be, something crystallized. Three words: Education, Policy, Ecology. One idea beneath them all: Dharma. The childhood traumas that had been quietly holding me back were named, examined, and released over three days. What emerged in their place was not a vague aspiration but a life script — the kind a person writes with full intention and returns to as a compass.' },
  { id: 7, stars: 5, av_class: 'av-c', name: 'Nikhil Shirish More', institution: 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University', text: 'I joined Rashtram knowing something was obstructing me, but without a language for what it was. The concept of memory — the way life experiences accumulate and slow a person down, the way unprocessed grief settles into the body and misdirects its energy — had been introduced in earlier sessions. Shri Vinay Kulkarni ji completed that understanding. The Life Reviewdhyāna was one of the most significant experiences of my life. It gave me access to my own life cycle and the clarity to see what I had been missing. I leave with a Dināchāryā built around my goals and the conviction that daily discipline is the only honest answer to the distance between where I am and where I want to be.' },
  { id: 8, stars: 5, av_class: 'av-d', name: 'Someshwar Gurumath', institution: 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University', text: 'After my second internship, I had drifted. The Dināchāryā that had once grounded my mornings — the early rising, the prayer, the unhurried movement into each day — had quietly come apart. The Leadership Fundamentals Programme was, in the most precise sense, a return. Shri Vinay Kulkarni ji\'s sessions reminded me of my script: a life that moves from creative work in media and film, to the intellectual platform of \'Scholar with Somu,\' to a final chapter of philosophical writing and wandering in the spirit of a Jaṅgama Purohita. That script was always there. What I needed was a guide who would remind me it belonged to me.' },
];

const STATIC_THEMES = [
  { id: 1, glyph: 'धर्म', title: 'Dharma as Cosmic Framework', description: 'Presenting Dharma not as religious doctrine but as the underlying principle of cosmic order — applicable to governance, economics, education, and personal life.', sort_order: 0 },
  { id: 2, glyph: 'ज्ञान', title: 'Indian Epistemology & IKS', description: 'The epistemological foundations of Bhāratīya thought — Pramāṇa, Nyāya, the Pañcakoṣa model — and their application in contemporary education and research.', sort_order: 1 },
  { id: 3, glyph: 'दर्शन', title: 'From Documentation to Darśana', description: 'Digital tools for IKS preservation, archival methodology, and the transition from mechanical documentation to genuine Darśana — seeing through the tradition.', sort_order: 2 },
  { id: 4, glyph: 'मन', title: 'Systems Thinking & Mental Models', description: 'Drawing on both Western systems engineering and Bhāratīya cognitive frameworks to design more integrated, consciousness-aware approaches to learning and leadership.', sort_order: 3 },
  { id: 5, glyph: 'शिक्षा', title: 'Svabhāva-Based Education', description: "Curriculum design rooted in the learner's innate nature (Svabhāva) and duty (Svadharma) — a civilizationally grounded alternative to one-size-fits-all pedagogy.", sort_order: 4 },
  { id: 6, glyph: 'संस्कृति', title: 'Civilizational Consciousness', description: 'Examining how Bhāratīya civilizational design — from architecture to food to festival — was a continuous system for elevating human consciousness toward Mokṣa.', sort_order: 5 },
];

// ── Page ──────────────────────────────────────────────────────────────────────

function TeachingPage() {
  useReveal();

  const [hero,     setHero]     = useState(STATIC_HERO);
  const [stats,    setStats]    = useState(STATIC_STATS);
  const [history,  setHistory]  = useState(STATIC_HISTORY);
  const [courses,  setCourses]  = useState(STATIC_COURSES);
  const [feedback, setFeedback] = useState(STATIC_FEEDBACK);
  const [themes,   setThemes]   = useState(STATIC_THEMES);
  const [extraBlocks, setExtra] = useState([]);
  const [seo,         setSeo]   = useState({});
  const [layout,      setLayout]= useState(null);

  useEffect(() => {
    getTeachingData()
      .then(d => {
        if (d.hero     && d.hero.eyebrow) setHero(d.hero);
        if (Array.isArray(d.stats)    && d.stats.length)    setStats(d.stats);
        if (Array.isArray(d.history)  && d.history.length)  setHistory(d.history);
        if (Array.isArray(d.courses)  && d.courses.length)  setCourses(d.courses);
        if (Array.isArray(d.feedback) && d.feedback.length) setFeedback(d.feedback);
        if (Array.isArray(d.themes)   && d.themes.length)   setThemes(d.themes);
      })
      .catch(() => {/* static fallback already set */});
    getBlocks('teaching').then(setExtra).catch(() => {});
    getSeo('teaching').then(setSeo).catch(() => {});
    getLayout('teaching').then(setLayout).catch(() => {});
  }, []);

  const effectiveLayout = buildLayout(layout, extraBlocks);

  const sectionMap = {
    hero: (
      <InnerPageHero eyebrow={hero.eyebrow} title={hero.title} titleEm={hero.title_em} subtitle={hero.subtitle} breadcrumb={hero.breadcrumb} />
    ),
    stats: (
      <div className="page-intro reveal">
        <div className="stats-row">
          {stats.map(s => (
            <div key={s.id} className="stat-item">
              <div className="stat-num">{s.num}</div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    history: (
      <div className="timeline-section">
        <div className="sec-label reveal">Teaching History</div>
        <div className="th-header reveal">
          <div>
            <h2 className="th-title">Academic &amp; <em>Faculty Engagements</em></h2>
            <div className="th-count">{history.length} Engagements · 2000 – 2026</div>
          </div>
        </div>
        <div className="th-grid">
          {history.map(card => (
            <ThCard key={card.id} featured={card.featured} variant={card.variant} role={card.role}
              period={card.period} location={card.location} org={card.org}
              stats={card.stats} bullets={card.bullets} plain={card.plain} tags={card.tags} />
          ))}
        </div>
      </div>
    ),
    courses: (
      <div className="course-section">
        <div className="sec-label reveal">Course Reports</div>
        {courses.map(course => (
          <div key={course.id} className="course-card reveal">
            <div className="course-header">
              <div>
                <div className="ch-tag">{course.tag}</div>
                <div className="ch-title">{course.title}</div>
                {course.subtitle && <div className="ch-subtitle">{course.subtitle}</div>}
              </div>
              <div className="ch-meta">
                <div className="ch-date" style={{ whiteSpace: 'pre-line' }}>{course.date_text}</div>
                <span className="ch-rating">{course.rating}<em style={{ fontSize: '1rem', fontStyle: 'normal' }}>/5</em></span>
                <div className="ch-rating-label">{course.rating_label}</div>
              </div>
            </div>
            <div className="course-body">
              {course.specs && course.specs.length > 0 && (
                <div className="specs-grid">
                  {course.specs.map((s, i) => (
                    <div key={i} className="spec-cell">
                      <div className="spec-val">{s.val}</div>
                      <div className="spec-key">{s.key}</div>
                    </div>
                  ))}
                </div>
              )}
              {course.pull_quote && (
                <div className="pull-quote">
                  <p className="pq-text">{course.pull_quote}</p>
                  {course.pq_attr && <div className="pq-attr">{course.pq_attr}</div>}
                </div>
              )}
              {course.paragraphs && course.paragraphs.map((p, i) => (
                <p key={i} className={p.highlight ? 'highlight' : ''}>{p.text}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
    feedback: (
      <div className="feedback-section">
        <div className="sec-label reveal">Student Feedback</div>
        <p className="feedback-intro reveal reveal-delay-1">
          Selected reflections from research scholars and faculty across Indian universities following the "From Documentation to Darśana" session — May 2026.
        </p>
        <div className="feedback-grid">
          {feedback.map(fb => (
            <FbCard key={fb.id} stars={fb.stars} text={fb.text} name={fb.name}
              institution={fb.institution} avClass={fb.av_class} />
          ))}
        </div>
      </div>
    ),
    themes: (
      <div className="themes-band">
        <div className="sec-label reveal">Core Teaching Themes</div>
        <div className="themes-grid">
          {themes.map((t, i) => (
            <div key={t.id} className={`theme-block reveal${i % 3 === 1 ? ' reveal-delay-1' : i % 3 === 2 ? ' reveal-delay-2' : ''}`}>
              <span className="theme-glyph">{t.glyph}</span>
              <div className="theme-title">{t.title}</div>
              <p className="theme-desc">{t.description}</p>
            </div>
          ))}
        </div>
      </div>
    ),
    cta: <InnerPageCTA />,
  };

  return (
    <main className="tch-page">
      <PageSeo title={seo.seo_title} description={seo.meta_description} keyword={seo.focus_keyword} canonical={seo.canonical_url} ogImage={seo.og_image_url} schema={seo.custom_schema} />
      {effectiveLayout.map(item => {
        if (!item.enabled) return null;
        if (item.section_key.startsWith('block:')) {
          const block = extraBlocks.find(b => `block:${b.id}` === item.section_key);
          return block ? <BlockRenderer key={item.section_key} block={block} /> : null;
        }
        const el = sectionMap[item.section_key];
        if (!el) return null;
        // Inner sections need .tch-content-wrap for max-width constraint
        if (WRAP_INNER.has(item.section_key)) {
          return <div key={item.section_key} className="tch-content-wrap">{el}</div>;
        }
        return <Fragment key={item.section_key}>{el}</Fragment>;
      })}
    </main>
  );
}

export default TeachingPage;
