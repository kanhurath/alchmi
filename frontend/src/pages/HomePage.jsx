import { useState, useEffect, Fragment } from 'react';
import HeroSection          from '../components/Sections/HeroSection';
import MarqueeStrip         from '../components/Sections/MarqueeStrip';
import AboutSection         from '../components/Sections/AboutSection';
import TestimonialsSection  from '../components/Sections/TestimonialsSection';
import ArticlesSection      from '../components/Sections/ArticlesSection';
import ThemesSection        from '../components/Sections/ThemesSection';
import QuoteSection         from '../components/Sections/QuoteSection';
import TalksSection         from '../components/Sections/TalksSection';
import ConnectSection       from '../components/Sections/ConnectSection';
import WhatWeDoSection      from '../components/Sections/WhatWeDoSection';
import { BlockRenderer }    from '../components/blocks/BlockRenderer';
import { PageSeo }          from '../components/PageSeo';
import { useReveal }        from '../hooks/useReveal';
import { getAllHome }        from '../services/homeApi';
import { getBlocks }        from '../services/siteBlocksApi';
import { getSeo }           from '../services/seoApi';
import { getLayout }        from '../services/sectionLayoutApi';
import './HomePage.css';

const DEFAULT_KEYS = ['hero','marquee','about','whatwedo','testimonials','articles','themes','quote','talks','connect'];

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

function HomePage() {
  useReveal();

  const [cms,         setCms]   = useState(null);
  const [extraBlocks, setExtra] = useState([]);
  const [seo,         setSeo]   = useState({});
  const [layout,      setLayout]= useState(null);

  useEffect(() => {
    getAllHome().then(data => setCms(data)).catch(() => {});
    getBlocks('home').then(setExtra).catch(() => {});
    getSeo('home').then(setSeo).catch(() => {});
    getLayout('home').then(setLayout).catch(() => {});
  }, []);

  const effectiveLayout = buildLayout(layout, extraBlocks);

  const sectionMap = {
    hero:         <HeroSection         hero={cms?.hero} />,
    marquee:      <MarqueeStrip        items={cms?.marquee} marqueeStyle={cms?.marqueeStyle} />,
    about:        <AboutSection        about={cms?.about} />,
    whatwedo:     <WhatWeDoSection     whatwedo={cms?.whatwedo} />,
    testimonials: <TestimonialsSection />,
    articles:     <ArticlesSection     articles={cms?.articles} />,
    themes:       <ThemesSection       themes={cms?.themes} />,
    quote:        <QuoteSection        quote={cms?.quote} />,
    talks:        <TalksSection        talks={cms?.talks} />,
    connect:      <ConnectSection      connect={cms?.connect} />,
  };

  return (
    <main className="home-page">
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

export default HomePage;
