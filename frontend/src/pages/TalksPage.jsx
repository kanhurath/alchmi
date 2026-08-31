import { useState, useEffect, Fragment } from 'react';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { getBlocks } from '../services/siteBlocksApi';
import { PageSeo } from '../components/PageSeo';
import { getSeo } from '../services/seoApi';
import { getLayout } from '../services/sectionLayoutApi';
import { useReveal } from '../hooks/useReveal';
import InnerPageHero from '../components/Sections/InnerPageHero';
import TalksListSection from '../components/Sections/TalksListSection';
import InnerPageCTA from '../components/Sections/InnerPageCTA';
import { getVideosData } from '../services/videosApi';

// Static thumbnail imports — Vite bundles these at build time.
// Used as fallback when a video has no thumb_url in the DB.
import thumb01 from '../assets/videos-thumb/VK_Podcast_Thumbnail-01_27052026_01_v1.jpg';
import thumb02 from '../assets/videos-thumb/VK_Podcast_Thumbnail-02_27052026_01_v1.jpg';
import thumb03 from '../assets/videos-thumb/VK_Podcast_Thumbnail-03_27052026_01_v1.jpg';
import thumb04 from '../assets/videos-thumb/VK_Podcast_Thumbnail-04_27052026_01_v1.jpg';
import thumb05 from '../assets/videos-thumb/VK_Podcast_Thumbnail-05_27052026_01_v1.jpg';
import thumb06 from '../assets/videos-thumb/VK_Podcast_Thumbnail-06_27052026_01_v1.jpg';
import thumb07 from '../assets/videos-thumb/VK_Podcast_Thumbnail-07_27052026_01_v1.jpg';
import thumb08 from '../assets/videos-thumb/VK_Podcast_Thumbnail-08_27052026_01_v1.jpg';
import thumb09 from '../assets/videos-thumb/VK_Podcast_Thumbnail-09_27052026_01_v1.jpg';
import thumb10 from '../assets/videos-thumb/VK_Podcast_Thumbnail-10_27052026_01_v1.jpg';
import thumb11 from '../assets/videos-thumb/VK_Podcast_Thumbnail-11_27052026_01_v1.jpg';
import thumb12 from '../assets/videos-thumb/VK_Podcast_Thumbnail-12_27052026_01_v1.jpg';
import thumb13 from '../assets/videos-thumb/VK_Podcast_Thumbnail-13_27052026_01_v1.jpg';
import thumb14 from '../assets/videos-thumb/VK_Podcast_Thumbnail-14_27052026_01_v1.jpg';
import thumb15 from '../assets/videos-thumb/VK_Podcast_Thumbnail-15_27052026_01_v1.jpg';
import thumb16 from '../assets/videos-thumb/VK_Podcast_Thumbnail-16_27052026_01_v1.png';
import thumb17 from '../assets/videos-thumb/VK_Podcast_Thumbnail-17_27052026_01_v1.png';

// Map DB video id → bundled thumbnail. Used when a DB row has no thumb_url.
export const STATIC_THUMB_MAP = {
  1: thumb16, 2: thumb17, 3: thumb01, 4: thumb02, 5: thumb03,
  6: thumb04, 7: thumb05, 8: thumb06, 9: thumb07, 10: thumb08,
  11: thumb09, 12: thumb10, 13: thumb11, 14: thumb12, 15: thumb14,
  16: thumb15,
};

// ── Static fallback data (mirrors seed content) ───────────────────────────────

const DEFAULT_KEYS = ['hero', 'videos_list', 'cta'];
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
  eyebrow: 'Media',
  title: 'Talks &',
  title_em: 'Podcasts',
  subtitle: 'Conversations, lectures, and keynotes on Indian Knowledge Systems, Dharmic leadership, and civilisational thinking.',
  breadcrumb: 'Talks',
};

const STATIC_VIDEOS = [
  { id: 1,  type: 'Lecture',          tags: ['IKS', 'Education'],                                                 title: 'Re-Imagining The World Through Indian Knowledge Systems',                                                                            description: 'The lens through which we Bharatiya view the world, our world, our own culture and civilization, our history and our spiritual processes - just about everything is not really ours. It was the lens we accepted and internalized during our colonial experience. What if we could see the world afresh with our own lenses and frameworks?',          date_text: 'Jun 11, 2026',  host: 'Vinay Kulkarni Online',                          watch_label: 'Listen', thumb_url: '', video_url: 'https://youtu.be/twrPcG9Zmjk?si=nOh4RcOIQXJeYe_B', sort_order: 0  },
  { id: 2,  type: 'Lecture',          tags: ['IKS', 'DigitalTools', 'Education'],                                 title: 'Digital Tools for Documentation, Preservation and Dissemination of IKS',                                                                 description: 'When I prepared my session for the JAIN University Faculty Development Programme on Digital Tools for the Documentation, Preservation, and Dissemination of Indian Knowledge Systems, I thought it would be a routine survey of portals, apps, and government missions. It turned out to be something else.',                                         date_text: 'Jun 11, 2026',  host: 'Vinay Kulkarni Online',                          watch_label: 'Listen', thumb_url: '', video_url: 'https://youtu.be/twrPcG9Zmjk?si=nOh4RcOIQXJeYe_B', sort_order: 1  },
  { id: 3,  type: 'Lecture',          tags: ['IKS', 'AIandIKS', 'AIethics', 'Consciousness', 'Education'],        title: 'Code, Consciousness and Responsibility: Mind, AI & Dharmic Design | AI & IKS | Shri Vinay Kulkarni',                                        description: 'In this session, Vinay Kulkarni explores the relationship between AI, human cognition, and the concept of consciousness through the lens of Indian Knowledge Systems.',                                                                                                                                                                              date_text: 'Apr 22, 2026',  host: 'IKS IIT Kanpur',                                 watch_label: 'Watch',  thumb_url: '', video_url: 'https://youtu.be/G3rH4FztvYQ?si=OyEgOL8wKY3nAm0N', sort_order: 2  },
  { id: 4,  type: 'Podcast',          tags: ['IKS', 'Upanishads', 'Education'],                                   title: 'In Search Of The Real India | Vinay Kulkarni',                                                                                         description: 'Vinay Kulkarni is an experienced management advisor (strategy, marketing, e-commerce) and Founder & CEO of Alchmi and E-com Elephant. He has a BE (Mech) from the Univ. of Mysore, an MBA (Strategy & Marketing) and a MS degree (Systems & Industrial Engg) both from the University of Arizona, USA.',                                         date_text: 'Sep 11, 2024', host: 'INDICA',                                          watch_label: 'Watch',  thumb_url: '', video_url: 'https://youtu.be/lijINSuDl2Q?si=t_8JNNH8oy5bUxpn', sort_order: 3  },
  { id: 5,  type: 'Panel Discussion', tags: ['IKS', 'Nation Building'],                                           title: 'Indian Knowledge Systems (IKS) as a Framework for Modern Education and Research',                                                        description: 'Mr. Vinay Kulkarni – Founder & CEO, ALCHMI • Dr. Prathosh A. P – Assistant Professor, IISc • Prof. Shailaja D Sharma – Professor of Mathematics, Azim Premji University & NIAS. UVS–7 examined IKS as a living and functional framework for modern education, research, and innovation.',                                                    date_text: 'May 8, 2026',   host: 'Param Foundation',                               watch_label: 'Watch',  thumb_url: '', video_url: 'https://youtu.be/WABc88ZRQpU?si=mAm96HJg-Jpl_-CW', sort_order: 4  },
  { id: 6,  type: 'Panel Discussion', tags: ['Psychology', 'IKS', 'Dharma'],                                      title: 'GOF 2026 | Panel Discussion On Vedanta and Education',                                                                                 description: 'A wide-ranging conversation on the relevance of Vedantic principles to modern education, exploring how concepts like Dharma, Svabhāva, and the pursuit of knowledge can inform a more holistic and meaningful educational experience.',                                                                                                            date_text: 'May 17, 2026',  host: 'Advaita Academy',                                watch_label: 'Watch',  thumb_url: '', video_url: 'https://youtu.be/2pqUo6j2HK8?si=f89FFzjqhXnCewEH', sort_order: 5  },
  { id: 7,  type: 'Panel Discussion', tags: ['Education', 'IKS'],                                                 title: 'Purvaranga to adopting the Indic Knowledge Systems (IKS) — Episode 1: Colonisation of Cognition',                                        description: 'How has modern education shaped and perhaps limited the way we think, perceive, and know? This webinar opens a vital conversation on the Colonization of Cognition.',                                                                                                                                                                             date_text: 'Apr 4, 2026',   host: 'Zista 3E4I',                                     watch_label: 'Watch',  thumb_url: '', video_url: 'https://youtu.be/NuKMqG8X4JQ?si=Tt_QjNYbQKaecEQY', sort_order: 6  },
  { id: 8,  type: 'Panel Discussion', tags: ['Dharmic Innovation', 'Entrepreneurship'],                           title: 'Session 31: Spirituo-Scientific Domain: From the Shadows to the Spotlight — Episode 2',                                                  description: 'The session explores the transformative potential of the spirituo-scientific domain and its emerging significance in contemporary discourse, examining how this domain fosters holistic understanding and innovation.',                                                                                                                              date_text: 'Aug 1, 2025',   host: 'Quantum Consciousness',                          watch_label: 'Watch',  thumb_url: '', video_url: 'https://youtu.be/Eo3nSg8vADI?si=ccBf8THVwmrTsWW5', sort_order: 7  },
  { id: 9,  type: 'Panel Discussion', tags: ['Dharma', 'Spiritual', 'Psychology'],                                title: 'Session 20: GI4QC Forum — That One Change in my Formative Years',                                                                     description: 'A quiet revolution of remembering. On the difference between conceptual happiness and phenomenal happiness — and what it truly means to inhabit life fully rather than merely manage it.',                                                                                                                                                        date_text: 'Sep 5, 2024',   host: 'Quantum Consciousness',                          watch_label: 'Listen', thumb_url: '', video_url: 'https://youtu.be/8ffpq1CsewU?si=WUinWrSOBNHLVI9e', sort_order: 8  },
  { id: 10, type: 'Talk',             tags: ['CESS', 'Leadership', 'Bharatiya Wisdom', 'Management', 'Education'], title: "CESS Talk Series: Ratan Tata's Leadership — A Modern Reflection of Bharatiya Wisdom in Management",                                   description: 'Resource Persons: Shri. Kasi Srinivasan (Former HR Leader, Tata Companies) and Mr. Vinay Kulkarni (Founder & CEO, Alchmi and E-com Elephant).',                                                                                                                                                                                                date_text: 'Jul 11, 2025',  host: 'Centre for Educational and Social Studies (CESS)', watch_label: 'Listen', thumb_url: '', video_url: 'https://youtu.be/GbCtZXkOvg0?si=5uopn7iGUJ1Ml3CL', sort_order: 9  },
  { id: 11, type: 'Panel Discussion', tags: ['Manusmriti', 'Dharma', 'HinduLaw', 'IKS', 'SanatanDharma'],        title: 'Rediscovering Dharma Through Manusmriti | Panel Discussion with Vinay Kulkarni',                                                        description: 'This comprehensive exploration of the Manusmriti dismantles centuries of colonial distortion to uncover the authentic principles of Dharmashastra.',                                                                                                                                                                                              date_text: 'Dec 6, 2025',   host: 'Sangam Talks',                                   watch_label: 'Listen', thumb_url: '', video_url: 'https://youtu.be/twm-_Dy9dtI?si=wt76beBmgBPDfptd', sort_order: 10 },
  { id: 12, type: 'Keynote',          tags: ['Raga Yoga', 'Keynote', 'IKS', 'Education', 'Nation Building'],      title: 'Raga Yoga Festival Keynote Speech by Vinay Kulkarni',                                                                                 description: "We are all legally Indian, geographically Indian, but are we truly culturally Indian? The anecdote: 25 children could name every Disney character but couldn't identify a single Pāṇḍava.",                                                                                                                                                     date_text: 'Feb 9, 2026',   host: 'Upadesha Academy',                               watch_label: 'Listen', thumb_url: '', video_url: 'https://youtu.be/tSv09rVx4tc?si=h5xWJtvay50iBBiE', sort_order: 11 },
  { id: 13, type: 'Lecture',          tags: ['Keynote', 'IKS', 'Education', 'Nation Building'],                   title: '3rd IKS Certificate Course | NEP 2020 | S3 | Acharya Devo Bhava | NLD',                                                                  description: 'Acharya Devo Bhava: The Sacred Role of the Teacher in Rebuilding Bharat. The aim of this certificate course is to introduce foundational IKS concepts and explore their contemporary relevance.',                                                                                                                                                  date_text: 'Nov 26, 2025',  host: 'Nucleus of Learning and Development',             watch_label: 'Listen', thumb_url: '', video_url: 'https://youtu.be/HZIIuoTyR2w?si=m9bYgnWcly2U4zo4', sort_order: 12 },
  { id: 14, type: 'Panel Discussion', tags: ['Education', 'IKS', 'Dharma'],                                       title: 'Integral Education Conclave 2024 — Remembering Sri Aurobindo on his MahaSamadhi Diwas',                                                   description: 'In this panel conversation, the panelists return to a question modern schooling has stopped asking: what does it actually mean to educate a human being?',                                                                                                                                                                                        date_text: 'Dec 5, 2024',   host: 'ReTHINK India Institute',                        watch_label: 'Listen', thumb_url: '', video_url: 'https://www.youtube.com/live/KDGjoq9fxWo?si=ubRBsh4yjVchKtEu', sort_order: 13 },
  { id: 15, type: 'Panel Discussion', tags: ['Education', 'IKS', 'Dharma'],                                       title: 'Navaratri e-Lecture Series 2024: Envisioning a Dharmic Enterprise',                                                                    description: 'A panel conversation exploring the intersection of dharmic principles and modern enterprise, examining how Bhāratīya frameworks can guide purposeful organizational design.',                                                                                                                                                                     date_text: 'Dec 30, 2024',  host: 'Centre for Educational and Social Studies (CESS)', watch_label: 'Listen', thumb_url: '', video_url: 'https://youtu.be/CU1ngV_uxis?si=KRN9p-OuDEe3ON5y', sort_order: 14 },
  { id: 16, type: 'Podcast',          tags: ['Spirituality', 'Podcast', 'IKS'],                                   title: 'Share With Shamantha | Vinay Kulkarni | Spiritual Trainer | ಆಧ್ಯಾತ್ಮ ಅನ್ನೋದು ಇವತ್ತು ಫ್ಯಾಷನ್ ಆಗಿದೆಯೇ?',                               description: "A conversation on spirituality, dharma, and the distinction between genuine seekers and fashionable spirituality — with Vinay Kulkarni in Kannada.",                                                                                                                                                                                              date_text: 'Jan 25, 2025',  host: 'Sarathi Communication Development',               watch_label: 'Listen', thumb_url: '', video_url: 'https://youtu.be/j-529PhyiIA?si=P_RCMNeQC91fPK8P', sort_order: 15 },
];

const STATIC_SIDEBAR = {
  quote_text: 'The teacher who does not know the student\'s Svabhāva is not teaching — they are broadcasting.',
  quote_attr: '— Vinay Kulkarni',
  invite_title: 'Invite Vinay',
  invite_text: 'Vinay speaks on IKS, Dharmic leadership, education, and civilizational futures. Available for keynotes, panels, and academic engagements.',
  invite_btn_label: 'Book a Session',
};

// ── Page ──────────────────────────────────────────────────────────────────────

function TalksPage() {
  useReveal();

  const [hero,    setHero]    = useState(null);
  const [videos,  setVideos]  = useState(null);
  const [sidebar, setSidebar] = useState(null);
  const [extraBlocks, setExtra] = useState([]);
  const [seo, setSeo]           = useState({});
  const [layout, setLayout]     = useState(null);

  useEffect(() => {
    getVideosData()
      .then(d => {
        setHero(d.hero?.eyebrow ? d.hero : null);
        setVideos(Array.isArray(d.videos) ? d.videos : []);
        setSidebar(d.sidebar?.quote_text ? d.sidebar : null);
      })
      .catch(() => {});
    getBlocks('videos').then(setExtra).catch(() => {});
    getSeo('videos').then(setSeo).catch(() => {});
  }, []);

  const effectiveLayout = buildLayout(layout, extraBlocks);
  const sectionMap = {
    hero:        hero ? <InnerPageHero eyebrow={hero.eyebrow} title={hero.title} titleEm={hero.title_em} subtitle={hero.subtitle} breadcrumb={hero.breadcrumb} /> : null,
    videos_list: videos !== null ? <TalksListSection videos={videos} sidebar={sidebar} /> : null,
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

export default TalksPage;
