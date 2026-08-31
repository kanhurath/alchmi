import { useState, useEffect, Fragment } from 'react';
import { useReveal } from '../hooks/useReveal';
import { useBookingModal } from '../context/BookingModalContext';
import InnerPageHero from '../components/Sections/InnerPageHero';
import InnerPageCTA from '../components/Sections/InnerPageCTA';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { PageSeo } from '../components/PageSeo';
import { getBiographyData } from '../services/biographyApi';
import { getBlocks } from '../services/siteBlocksApi';
import { getSeo } from '../services/seoApi';
import { getLayout } from '../services/sectionLayoutApi';

// Static image imports — Vite bundles these at build time
import bioPhoto from '../assets/Images/VK-layout_Trial-01_Bio-Prof-01_27052026_01_v1.jpg';
import logoAlchmi         from '../assets/Images/alchmi_27052026_01_v1.png';
import logoEComElephant   from '../assets/Images/eComElephant_27052026_01_v1.png';
import logoSanathani      from '../assets/Images/sanathani_27052026_01_v1.png';
import logoSanskritishaala from '../assets/Images/sanskritishaala_27052026_01_v1.png';
import logoUpadesha       from '../assets/Images/upadeshaAcademy_27052026_01_v1.png';
import logoShastra        from '../assets/Images/shastraResearchLabs_27052026_01_v1.png';
import './BiographyPage.css';

const STATIC_LOGOS = {
  'ALCHMI':               logoAlchmi,
  'e-Com Elephant':       logoEComElephant,
  'Sanathani':            logoSanathani,
  'Sanskritishaala':      logoSanskritishaala,
  'Upadesha Academy':     logoUpadesha,
  'Shastra Research Labs': logoShastra,
};

const STATIC_HERO = {
  eyebrow: 'Biography', title: 'Vinay P.', title_em: 'Kulkarni',
  subtitle: 'Entrepreneur · Dharmic Innovator · Advocate for Indian Knowledge Systems',
  breadcrumb: 'Biography',
};
const STATIC_PROFILE = {
  name: 'Vinay P. Kulkarni',
  tagline: 'Entrepreneur · Dharmic Innovator · E-commerce Strategist · IKS Advocate',
  quote: 'Education is not merely the transfer of knowledge or acquisition of skills; it is a transformative process that strives to create individuals whose minds and bodies are nourished, nurtured, and elevated by the greatest wisdom known to humanity. True education aligns with one\'s Svabhava (innate nature) and Svadharma (individual duty) and equips the individual to pursue the highest goals of human life as envisioned by his or her civilization!',
  para1: 'Vinay Kulkarni, Founder & CEO of ALCHMI (Management Consulting) and e-Com Elephant (E-commerce Tech), is a seasoned management consultant and CXO with over 25 years of global experience in strategy, marketing, and e-commerce. With a BE in Mechanical Engineering from the University of Mysore, an MS in Systems & Industrial Engineering and an MBA in Strategy & Marketing — both from the University of Arizona — Vinay combines deep technical expertise with rare strategic acumen.',
  para2: 'A "business alchemist," he leads transformative programs that foster clarity, growth, and innovation. His expertise spans business strategy, curriculum design, organizational transformation, and meditative self-discovery, using immersive learning methods. Deeply passionate about research and applications of Indian Knowledge Systems (IKS), Vinay is pioneering innovative pedagogies for IKS-based education and developing Dharmic Management Frameworks. Based in Bengaluru, he bridges tradition and modernity, empowering leaders to design impactful futures.',
  linkedin_url: 'https://www.linkedin.com/in/vinkulkarni/', twitter_handle: '@aatmavalokana',
  twitter_url: 'https://x.com/aatmavalokana', photo_url: null,
};
const STATIC_ENGAGE = {
  intro: { section_label: 'Speaking & Facilitation', title: 'How Vinay', title_em: 'Engages',
    description: 'From keynote stages to intimate retreat settings — Vinay brings depth, precision, and Dharmic grounding to every engagement.' },
  cards: [
    { id: 1, num_label: '01', category: 'Speaking', title: 'Talks & Keynotes', slug: '/speaking/talks', content_label: 'Featured Venues & Events', count_number: '10+', count_label: 'Talks & Keynotes', venues: ["IIT Kanpur — 'Code, Consciousness and Responsibility'", 'NIE ICST 2025 Keynote', 'Indus Business Academy', 'ReTHINK INDIA Integral Education Keynote', 'Cultural Integration Fellowship, San Francisco', 'CESS Talk Series', 'Global Chamber Globinar', 'TMU Moradabad', "Upadesha Keynote — 'The Sacred Symphony'", 'RV College — Swami Vivekananda'] },
    { id: 2, num_label: '02', category: 'Facilitation', title: 'Workshops & Retreats', slug: '/speaking/workshops-retreats', content_label: 'Featured Venues & Programs', count_number: '7+', count_label: 'Workshops & Retreats', venues: ["INDICA Yoga — 'Ritambhara' Retreat", 'Cosmic Medicine / Meditation — Jayadeva Institute', 'Narayana Hrudayalaya', 'Apollo Hospitals', 'BBMP — 100 Doctors Workshop', 'US Advanced Medical Research', 'Hylunia Wellness MD Spa'] },
    { id: 3, num_label: '03', category: 'Panels & Honour', title: 'Panels & Chief Guest', slug: '/speaking/panels', content_label: 'Featured Appearances', count_number: '5+', count_label: 'Panels & Chief Guest', venues: ['PARAM Foundation Panel', 'Zista 3E4I Panel', 'New Horizon College Panel', 'MES Institute — Chief Guest', 'RV College — Chief Guest'] },
  ],
};
const STATIC_VENTURES = [
  { id: 1, name: 'ALCHMI', designation: 'Founder & CEO', type: 'Strategy / Management Consulting', description: 'A management consulting firm specialising in business strategy, brand development, and transformative leadership programs that blend modern methodology with Dharmic principles.', link_url: 'https://www.alchmi.com', link_label: 'Visit alchmi.com' },
  { id: 2, name: 'e-Com Elephant', designation: 'Founder & CEO', type: 'E-commerce · Web Design · Tech Services', description: 'E-commerce business creation and management, web design and development, and technology services for brands seeking digital transformation.', link_url: 'https://www.ecomelephant.com', link_label: 'Visit ecomelephant.com' },
  { id: 3, name: 'Sanathani', designation: 'Founder & CEO', type: 'Indic Merchandise · Online Store', description: 'An online Indic merchandise store curating products rooted in Bhāratīya culture, tradition, and artisanship.', link_url: 'https://sanathani.com', link_label: 'Visit sanathani.com' },
  { id: 4, name: 'Sanskritishaala', designation: 'Founder', type: 'Cultural Education · Workshops', description: 'Cultural education for kids, parents, and adults through workshops that bring alive the richness of Bhāratīya civilisation and the Sanskrit language.', link_url: 'https://www.sanskritishaala.com', link_label: 'Visit sanskritishaala.com' },
  { id: 5, name: 'Upadesha Academy', designation: 'Founder & Director', type: 'Immersive Workshops · Team Retreats', description: 'Hosts immersive, experiential workshops led by top intellectuals in fields like Business, Spirituality, Sanskrit, Wellness, Yoga, Psychology, and more.', link_url: null, link_label: null },
  { id: 6, name: 'Shastra Research Labs', designation: 'Founder & Director', type: 'Research · Indian Knowledge Systems', description: 'A research initiative conducting innovative experiments to explore and validate concepts from the Vedas, Upanishads, Puranas, and Arthashastra.', link_url: null, link_label: null },
];

function resolveLogo(venture) {
  if (venture.logo_url) return venture.logo_url.startsWith('http') ? venture.logo_url : venture.logo_url;
  return STATIC_LOGOS[venture.name] || null;
}

const DEFAULT_KEYS = ['hero', 'profile', 'engage', 'ventures', 'cta'];

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

function BiographyPage() {
  useReveal();
  const { openModal } = useBookingModal();

  const [hero,     setHero]     = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [engage,   setEngage]   = useState(null);
  const [ventures, setVentures] = useState(null);
  const [extraBlocks, setExtra] = useState([]);
  const [seo,      setSeo]      = useState({});
  const [layout,   setLayout]   = useState(null);

  useEffect(() => {
    getBiographyData()
      .then(({ hero: h, profile: p, engage: e, ventures: v }) => {
        setHero(h?.eyebrow ? h : null);
        setProfile(p?.name ? p : null);
        setEngage(e?.intro ? e : null);
        setVentures(Array.isArray(v) && v.length ? v : null);
      })
      .catch(() => {});
    getBlocks('biography').then(setExtra).catch(() => {});
    getSeo('biography').then(setSeo).catch(() => {});
    getLayout('biography').then(setLayout).catch(() => {});
  }, []);

  const photoSrc = profile?.photo_url ? profile.photo_url : bioPhoto;

  const effectiveLayout = buildLayout(layout, extraBlocks);

  const sectionMap = {
    hero: hero ? (
      <InnerPageHero
        eyebrow={hero.eyebrow} title={hero.title} titleEm={hero.title_em}
        subtitle={hero.subtitle} breadcrumb={hero.breadcrumb}
      />
    ) : null,
    profile: profile ? (
      <section className="bio-profile">
        <div className="bio-photo-col reveal">
          <img src={photoSrc} alt="Vinay Kulkarni" className="bio-photo" />
          <div className="bio-photo-frame" />
          <div className="bio-role-badge">वि<small>Vinay Ji</small></div>
        </div>
        <div className="bio-content-col">
          <h2 className="bio-name reveal">{profile.name}</h2>
          <div className="bio-tagline reveal reveal-delay-1">
            {profile.tagline?.split(' · ').map((part, i, arr) => (
              <span key={i}>{part}{i < arr.length - 1 && <span> · </span>}</span>
            ))}
          </div>
          {profile.quote && <blockquote className="bio-quote-block reveal reveal-delay-2">"{profile.quote}"</blockquote>}
          {profile.para1 && <p className="bio-para reveal reveal-delay-2">{profile.para1}</p>}
          {profile.para2 && <p className="bio-para reveal reveal-delay-3">{profile.para2}</p>}
          <div className="bio-socials reveal">
            {profile.linkedin_url && <a href={profile.linkedin_url} className="bio-social-link" target="_blank" rel="noreferrer">in LinkedIn</a>}
            {profile.twitter_url  && <a href={profile.twitter_url}  className="bio-social-link" target="_blank" rel="noreferrer">𝕏 {profile.twitter_handle}</a>}
            <button className="bio-social-link primary" onClick={openModal}>◎ Book a Session</button>
          </div>
        </div>
      </section>
    ) : null,
    engage: engage ? (
      <section className="bio-engage">
        <div className="section-label reveal" style={{ color: '#de7336' }}>{engage.intro?.section_label}</div>
        <div className="engage-intro">
          <div className="engage-intro-text">
            <h2 className="section-title reveal reveal-delay-1" style={{ color: '#8b2e33' }}>
              {engage.intro?.title} <em style={{ color: '#de7336' }}>{engage.intro?.title_em}</em>
            </h2>
            <p className="engage-intro-desc reveal reveal-delay-2">{engage.intro?.description}</p>
          </div>
          <button className="engage-cta-link reveal" onClick={openModal}>Book an Engagement</button>
        </div>
        <div className="engage-cards">
          {engage.cards?.map((card, idx) => (
            <div key={card.id || idx} className={`eng-card reveal${idx > 0 ? ` reveal-delay-${idx}` : ''}`}>
              <div className="eng-accent" data-num={card.num_label}>
                <div className="eng-accent-top">
                  <div className="eng-category">{card.category}</div>
                  <div className="eng-title">{card.title}</div>
                </div>
                <div className="eng-slug">{card.slug}</div>
              </div>
              <div className="eng-content">
                <div className="eng-content-label">{card.content_label}</div>
                <div className="eng-venues">
                  {card.venues?.map((v, vi) => {
                    const text   = typeof v === 'object' ? v.venue_text : v;
                    const rawUrl = typeof v === 'object' ? (v.venue_url || '') : '';
                    const newTab = typeof v === 'object' ? !!v.venue_new_tab : false;
                    const url    = rawUrl && !/^https?:\/\//i.test(rawUrl) && !rawUrl.startsWith('/')
                      ? `https://${rawUrl}` : rawUrl;
                    return url ? (
                      <a key={vi} href={url} className="eng-venue eng-venue-link"
                        target={newTab ? '_blank' : '_self'} rel={newTab ? 'noreferrer' : undefined}>{text}</a>
                    ) : <span key={vi} className="eng-venue">{text}</span>;
                  })}
                </div>
                <div className="eng-content-footer">
                  <span className="eng-count">{card.count_number}</span>
                  <span className="eng-count-label">{card.count_label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null,
    ventures: ventures ? (
      <section className="bio-ventures">
        <div className="section-label reveal" style={{ color: '#de7336' }}>Ventures</div>
        <h2 className="section-title reveal reveal-delay-1" style={{ color: '#8b2e33' }}>
          Organizations and <em style={{ color: '#de7336' }}>Initiatives</em>
        </h2>
        <div className="ventures-grid">
          {ventures.map((v, i) => (
            <div key={v.id || v.name} className={`venture-card reveal${i % 2 !== 0 ? ' reveal-delay-1' : ''}`}>
              <div className="venture-logo-wrap">
                {resolveLogo(v) && <img src={resolveLogo(v)} alt={v.name} className="venture-logo" />}
              </div>
              <div className="venture-body">
                <div className="venture-designation">{v.designation}</div>
                <div className="venture-name">{v.name}</div>
                <div className="venture-type">{v.type}</div>
                <p className="venture-desc">{v.description}</p>
                {v.link_url && <a href={v.link_url} className="venture-link" target="_blank" rel="noreferrer">{v.link_label}</a>}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null,
    cta: <InnerPageCTA />,
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

export default BiographyPage;
