import { useState, useEffect, useMemo } from 'react';
import { useReveal } from '../hooks/useReveal';
import { PageSeo } from '../components/PageSeo';
import { getSeo } from '../services/seoApi';
import { getNewsData, resolveUploadUrl } from '../services/newsApi';
import InnerPageHero from '../components/Sections/InnerPageHero';
import InnerPageCTA  from '../components/Sections/InnerPageCTA';
import './NewsPage.css';

// ── Static fallback data ──────────────────────────────────────────────────────

const STATIC_HERO = {
  eyebrow:       'Updates & Reflections',
  title:         'News &',
  title_em:      'Insights',
  description:   'A running record of talks, panels, and reflections shared on Dharma, Indian Knowledge Systems, and conscious enterprise — drawn from recent activity and writing.',
  linkedin_url:  'https://www.linkedin.com/in/vinkulkarni/recent-activity/all/',
  linkedin_label:'Follow on LinkedIn',
  footer_note:   'Updated regularly · 2026',
};

const STATIC_FILTERS = [
  { id: 1, label: 'IKS',              slug: 'iks',       sort_order: 1 },
  { id: 2, label: 'Dharma',           slug: 'dharma',    sort_order: 2 },
  { id: 3, label: 'Education',        slug: 'education', sort_order: 3 },
  { id: 4, label: 'Events & Panels',  slug: 'events',    sort_order: 4 },
  { id: 5, label: 'Dharmic Innovation', slug: 'innovation', sort_order: 5 },
];

const STATIC_ARTICLES = [
  {
    id: 1, is_featured: 1, source_name: 'LinkedIn · Post', source_icon: 'in',
    source_icon_color: '#0a66c2', pub_date: 'April 14, 2026',
    tags: 'Dharma,IKS,Dharmic Innovation,Entrepreneurship',
    categories: 'iks events',
    title: 'An Experiment in Saṃvāda: Notes from the IKS APEX Meet 2026',
    body: '<p>A panel of fifteen scholar-practitioners, a roomful of students, parents, teachers, and administrators — and what happens when representatives of every IKS stakeholder group in India share one structured conversation.</p><p>The IKS APEX Meet 2026, held at Jeppiaar University, Chennai on 10 April, was the second kind. Days later, I am still working through what it surfaced. I had the honor and the distinct privilege of moderating a panel of fifteen scholar-practitioners working across the field.</p>',
    pull_quote: 'Some gatherings inform you. A rare few rearrange the perspectives of how you see the field.',
    meta_text: 'Jeppiaar University, Chennai',
    read_more_label: 'Read Full Post',
    read_more_url: 'https://www.linkedin.com/in/vinkulkarni/recent-activity/all/',
    image_svg: '',
  },
  {
    id: 2, is_featured: 0, source_name: 'LinkedIn · Post', source_icon: 'in',
    source_icon_color: '#0a66c2', pub_date: 'April 2026',
    tags: 'Dharma,Mental Model,Psychology',
    categories: 'dharma innovation',
    title: 'On Why Creativity Is Really About Receptivity — Not Transmission',
    body: '<p><em>"Using an elephant gun to shoot a fly!"</em> — this, I have come to see, is the condition of the Buddhi almost everywhere. We mistake force of intellect for depth of insight, and in doing so, miss the quieter discipline that creative work actually demands: the capacity to receive, not just to produce.</p>',
    pull_quote: '',
    meta_text: 'Reflection',
    read_more_label: 'Read Full Post',
    read_more_url: 'https://www.linkedin.com/in/vinkulkarni/recent-activity/all/',
    image_svg: '',
  },
  {
    id: 3, is_featured: 0, source_name: 'LinkedIn · Article', source_icon: 'in',
    source_icon_color: '#0a66c2', pub_date: '2026',
    tags: 'Dharma,Dharmic Economics,IKS',
    categories: 'dharma iks',
    title: 'What If Everything We Knew Was Built on Borrowed Assumptions?',
    body: '<p>What if everything we thought we knew about success, progress, happiness, and even health was built upon borrowed assumptions — mental constructs we never consciously chose? This is not a philosophical exercise. This is the ground beneath our feet.</p><p>The Bhāratīya worldview rests upon a sophisticated understanding of reality that cannot be reduced to religious belief or cultural practice. Dharma is not religion in the Western sense — it is the cosmic law that governs all existence, from the movement of galaxies to the beating of a human heart.</p>',
    pull_quote: '',
    meta_text: 'Essay',
    read_more_label: 'Read Full Post',
    read_more_url: 'https://www.linkedin.com/in/vinkulkarni/recent-activity/all/',
    image_svg: '',
  },
];

const STATIC_SIDEBAR = [
  {
    block_key: 'profile',
    title:     'Follow Along',
    name_text: 'Vinay Kulkarni',
    role_text: 'Founder, ALCHMI · Dharmic Enterprise',
    cta_label: 'View LinkedIn Activity',
    cta_url:   'https://www.linkedin.com/in/vinkulkarni/recent-activity/all/',
    body_text: '',
  },
  {
    block_key: 'newsletter',
    title:     'Dharmic Ideas & Insights',
    name_text: '',
    role_text: '',
    cta_label: 'Subscribe on LinkedIn',
    cta_url:   'https://www.linkedin.com/in/vinkulkarni/recent-activity/all/',
    body_text: "Vinay's LinkedIn newsletter — reflections on Dharma, IKS, and conscious enterprise, delivered as they're written.",
  },
];

// ── Default SVG card images by index ─────────────────────────────────────────

const DEFAULT_SVGS = [
  // 0 — featured: concentric circles + chakra nodes
  `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dnbg0" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1a2543"/><stop offset="100%" stop-color="#2e1515"/>
      </linearGradient>
      <radialGradient id="dng0" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#f3b33e" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#f3b33e" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="640" height="360" fill="url(#dnbg0)"/>
    <rect width="640" height="360" fill="url(#dng0)"/>
    <g stroke="#de7336" stroke-width="1.1" fill="none" opacity="0.5">
      <circle cx="320" cy="180" r="125"/><circle cx="320" cy="180" r="92"/><circle cx="320" cy="180" r="58"/>
    </g>
    <circle cx="320" cy="180" r="9" fill="#8b2e33"/>
    <circle cx="320" cy="180" r="3.5" fill="#ffffff" fill-opacity="0.9"/>
    <text x="320" y="195" font-family="serif" font-size="50" fill="#ffffff" fill-opacity="0.05" text-anchor="middle">ॐ</text>
  </svg>`,
  // 1 — lotus petal arcs on saffron
  `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dnbg1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f3b33e"/><stop offset="100%" stop-color="#de7336"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#dnbg1)"/>
    <g fill="none" stroke="#1a2543" stroke-width="2" opacity="0.55">
      <path d="M 320 250 Q 200 230 170 140 Q 250 160 320 250 Z"/>
      <path d="M 320 250 Q 440 230 470 140 Q 390 160 320 250 Z"/>
      <path d="M 320 250 Q 280 150 320 70 Q 360 150 320 250 Z"/>
    </g>
    <circle cx="320" cy="252" r="9" fill="#8b2e33"/>
  </svg>`,
  // 2 — dharma wheel spokes on cream
  `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dnbg2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fdf9f3"/><stop offset="100%" stop-color="#f4efeb"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#dnbg2)"/>
    <g transform="translate(320,180)">
      <circle r="118" fill="none" stroke="#8b2e33" stroke-width="2" opacity="0.7"/>
      <circle r="84"  fill="none" stroke="#de7336" stroke-width="1.2" opacity="0.45"/>
      <circle r="14"  fill="#8b2e33"/>
      <circle r="5"   fill="#f3b33e"/>
      <line x1="14" y1="0" x2="118" y2="0" stroke="#8b2e33" stroke-width="1.4" opacity="0.55"/>
      <line x1="-14" y1="0" x2="-118" y2="0" stroke="#8b2e33" stroke-width="1.4" opacity="0.55"/>
      <line x1="0" y1="14" x2="0" y2="118" stroke="#8b2e33" stroke-width="1.4" opacity="0.55"/>
      <line x1="0" y1="-14" x2="0" y2="-118" stroke="#8b2e33" stroke-width="1.4" opacity="0.55"/>
      <line x1="9.9" y1="9.9" x2="83.4" y2="83.4" stroke="#8b2e33" stroke-width="1.4" opacity="0.55"/>
      <line x1="-9.9" y1="-9.9" x2="-83.4" y2="-83.4" stroke="#8b2e33" stroke-width="1.4" opacity="0.55"/>
      <line x1="-9.9" y1="9.9" x2="-83.4" y2="83.4" stroke="#8b2e33" stroke-width="1.4" opacity="0.55"/>
      <line x1="9.9" y1="-9.9" x2="83.4" y2="-83.4" stroke="#8b2e33" stroke-width="1.4" opacity="0.55"/>
    </g>
  </svg>`,
  // 3 — panchakosha concentric rings on dark
  `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dnbg3" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1a2543"/><stop offset="100%" stop-color="#3a1f1f"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#dnbg3)"/>
    <g transform="translate(320,180)">
      <circle r="135" fill="none" stroke="#8b2e33" stroke-width="1.4" opacity="0.55"/>
      <circle r="105" fill="none" stroke="#de7336" stroke-width="1.4" opacity="0.6"/>
      <circle r="75"  fill="none" stroke="#f3b33e" stroke-width="1.4" opacity="0.65"/>
      <circle r="45"  fill="none" stroke="#e8c96d" stroke-width="1.4" opacity="0.7"/>
      <circle r="18"  fill="#f3b33e" opacity="0.9"/>
      <circle r="6" fill="#ffffff" opacity="0.9"/>
    </g>
  </svg>`,
  // 4 — speaker panel silhouettes on saffron
  `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dnbg4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#de7336"/><stop offset="100%" stop-color="#c45e22"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#dnbg4)"/>
    <g fill="#1a2543" opacity="0.85">
      <circle cx="270" cy="170" r="16"/><rect x="254" y="186" width="32" height="46" rx="10"/>
      <circle cx="320" cy="155" r="18"/><rect x="302" y="173" width="36" height="52" rx="11"/>
      <circle cx="372" cy="170" r="16"/><rect x="356" y="186" width="32" height="46" rx="10"/>
    </g>
  </svg>`,
  // 5 — book + diya on cream
  `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dnbg5" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f4efeb"/><stop offset="100%" stop-color="#fdf9f3"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#dnbg5)"/>
    <g transform="translate(320,210)">
      <path d="M -130 -10 Q -65 -45 0 -10 L 0 60 Q -65 25 -130 60 Z" fill="#1a2543" opacity="0.92"/>
      <path d="M 130 -10 Q 65 -45 0 -10 L 0 60 Q 65 25 130 60 Z" fill="#1a2543" opacity="0.92"/>
    </g>
    <g transform="translate(320,110)">
      <ellipse cx="0" cy="18" rx="20" ry="8" fill="#8b2e33"/>
      <path d="M 0 -28 C 10 -10 12 4 0 14 C -12 4 -10 -10 0 -28 Z" fill="#f3b33e"/>
    </g>
  </svg>`,
  // 6 — darshana eye on deep red
  `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dnbg6" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#8b2e33"/><stop offset="100%" stop-color="#541501"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#dnbg6)"/>
    <g transform="translate(320,180)">
      <path d="M -150 0 Q 0 -90 150 0 Q 0 90 -150 0 Z" fill="none" stroke="#f3b33e" stroke-width="2.2" opacity="0.8"/>
      <circle r="46" fill="#1a2543"/>
      <circle r="18" fill="#f3b33e"/>
      <circle r="7" fill="#1a2543"/>
      <circle cx="-6" cy="-6" r="4" fill="#ffffff" opacity="0.85"/>
    </g>
  </svg>`,
];

// ── News card ─────────────────────────────────────────────────────────────────
function NewsCard({ article, index }) {
  const isFeatured = !!article.is_featured;
  const tags       = (article.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const svgContent = article.image_svg || DEFAULT_SVGS[index % DEFAULT_SVGS.length];
  const bodyParagraphs = article.body || '';
  const hasPull = !!(article.pull_quote || '').trim();
  const linkUrl = article.read_more_url || null;

  const revealClass = `news-card${isFeatured ? ' featured' : ''} reveal${index % 3 === 1 ? ' rd1' : index % 3 === 2 ? ' rd2' : ''}`;

  const cardImage = article.image_url
    ? <img className="news-card-image" src={resolveUploadUrl(article.image_url)} alt={article.title} />
    : <div className="news-card-image" dangerouslySetInnerHTML={{ __html: svgContent }} />;

  return (
    <article className={revealClass}>
      {linkUrl
        ? <a href={linkUrl} target="_blank" rel="noreferrer" className="news-card-image-link">{cardImage}</a>
        : cardImage
      }
      <div className="news-card-content">
        <div className="news-card-top">
          <div className="news-source">
            <div
              className="news-source-icon"
              style={{ background: article.source_icon_color || '#0a66c2' }}
            >
              {article.source_icon || 'in'}
            </div>
            <span className="news-source-name">{article.source_name}</span>
          </div>
          <span className="news-date">{article.pub_date}</span>
        </div>

        {tags.length > 0 && (
          <div className="news-tags">
            {tags.map(t => <span key={t} className="news-tag">{t}</span>)}
          </div>
        )}

        {linkUrl
          ? <a href={linkUrl} target="_blank" rel="noreferrer" className="news-card-title-link">
              <h2 className="news-card-title">{article.title}</h2>
            </a>
          : <h2 className="news-card-title">{article.title}</h2>
        }

        <div className="news-card-body">
          {hasPull ? (
            <>
              <div dangerouslySetInnerHTML={{ __html: bodyParagraphs.split('</p>')[0] + '</p>' }} />
              <div className="news-pull">"{article.pull_quote}"</div>
              <div dangerouslySetInnerHTML={{ __html: bodyParagraphs.split('</p>').slice(1).join('</p>') }} />
            </>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: bodyParagraphs }} />
          )}
        </div>

        <div className="news-card-footer">
          <div className="news-meta-stats">
            {article.meta_text && <span>{article.meta_text}</span>}
          </div>
          {article.read_more_url && (
            <a
              className="news-readmore"
              href={article.read_more_url}
              target="_blank"
              rel="noreferrer"
            >
              {article.read_more_label || 'Read Full Post'}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function NewsPage() {
  useReveal();

  const [hero,     setHero]     = useState(STATIC_HERO);
  const [articles, setArticles] = useState(STATIC_ARTICLES);
  const [filters,  setFilters]  = useState(STATIC_FILTERS);
  const [sidebar,  setSidebar]  = useState(STATIC_SIDEBAR);
  const [seo,      setSeo]      = useState({});
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    getNewsData()
      .then(d => {
        if (d.hero?.eyebrow)                      setHero(d.hero);
        if (Array.isArray(d.articles) && d.articles.length) setArticles(d.articles);
        if (Array.isArray(d.filters)  && d.filters.length)  setFilters(d.filters);
        if (Array.isArray(d.sidebar)  && d.sidebar.length)  setSidebar(d.sidebar);
      })
      .catch(() => {});
    getSeo('news').then(setSeo).catch(() => {});
  }, []);

  const filtered = useMemo(() => (
    activeFilter === 'all'
      ? articles
      : articles.filter(a => (a.categories || '').split(' ').includes(activeFilter))
  ), [articles, activeFilter]);

  // Compute per-topic counts for sidebar
  const topicCounts = useMemo(() => {
    const counts = {};
    filters.forEach(f => {
      counts[f.slug] = articles.filter(a =>
        (a.categories || '').split(' ').includes(f.slug)
      ).length;
    });
    return counts;
  }, [articles, filters]);

  const profile    = sidebar.find(s => s.block_key === 'profile')    || STATIC_SIDEBAR[0];
  const newsletter = sidebar.find(s => s.block_key === 'newsletter') || STATIC_SIDEBAR[1];

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

      {/* ── Inner Hero ── */}
      <InnerPageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        titleEm={hero.title_em}
        subtitle={hero.description}
        breadcrumb="News"
      />

      {/* ── Filter Bar ── */}
      <div className="filter-bar">
        <span className="filter-label">Filter</span>
        <button
          className={`filter-btn${activeFilter === 'all' ? ' active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All
        </button>
        {filters.map(f => (
          <button
            key={f.id}
            className={`filter-btn${activeFilter === f.slug ? ' active' : ''}`}
            onClick={() => setActiveFilter(f.slug)}
          >
            {f.label}
          </button>
        ))}
        <span className="filter-count">
          {filtered.length} Update{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Main: Feed + Sidebar ── */}
      <div className="news-main">

        {/* Feed */}
        <div className="news-feed">
          {filtered.length === 0 && (
            <p className="news-empty">No updates in this category yet.</p>
          )}
          {filtered.map((article, i) => (
            <NewsCard key={article.id} article={article} index={i} />
          ))}
        </div>

        {/* Sidebar */}
        <aside className="news-sidebar reveal rd1">

          {/* Profile */}
          <div className="sidebar-block profile-card">
            <div className="sidebar-title">{profile.title}</div>
            <div className="profile-name">{profile.name_text}</div>
            <div className="profile-role">{profile.role_text}</div>
            <a
              className="profile-cta"
              href={profile.cta_url}
              target="_blank"
              rel="noreferrer"
            >
              {profile.cta_label}
            </a>
          </div>

          {/* Topics */}
          {filters.length > 0 && (
            <div className="sidebar-block">
              <div className="sidebar-title">Topics</div>
              {filters.map(f => (
                <div
                  key={f.id}
                  className="topic-row"
                  onClick={() => setActiveFilter(f.slug)}
                >
                  <span>{f.label}</span>
                  <span className="topic-count">{topicCounts[f.slug] || 0}</span>
                </div>
              ))}
            </div>
          )}

          {/* Newsletter */}
          <div className="sidebar-block newsletter-block">
            <div className="sidebar-title">{newsletter.title}</div>
            <p>{newsletter.body_text}</p>
            <a
              className="newsletter-btn"
              href={newsletter.cta_url}
              target="_blank"
              rel="noreferrer"
            >
              {newsletter.cta_label}
            </a>
          </div>

        </aside>
      </div>

      {/* ── CTA Strip ── */}
      <InnerPageCTA />
    </main>
  );
}

export default NewsPage;
