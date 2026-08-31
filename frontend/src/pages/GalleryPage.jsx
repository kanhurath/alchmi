import { useState, useEffect, Fragment } from 'react';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { getBlocks } from '../services/siteBlocksApi';
import { PageSeo } from '../components/PageSeo';
import { getSeo } from '../services/seoApi';
import { getLayout } from '../services/sectionLayoutApi';
import { useReveal } from '../hooks/useReveal';
import InnerPageHero from '../components/Sections/InnerPageHero';
import GallerySection from '../components/Sections/GallerySection';
import InnerPageCTA from '../components/Sections/InnerPageCTA';
import { getGalleryData } from '../services/galleryApi';

const DEFAULT_KEYS = ['hero', 'gallery_section', 'cta'];
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


// ── Static hero fallback ──────────────────────────────────────────────────────

const STATIC_HERO = {
  eyebrow: 'Gallery',
  title: 'Photos &',
  title_em: 'Moments',
  subtitle: 'Images from IKS events, talks, workshops, and academic convenings — a visual record of the work and its community.',
  breadcrumb: 'Gallery',
};

// ── Page ──────────────────────────────────────────────────────────────────────

function GalleryPage() {
  useReveal();

  const [hero,        setHero]   = useState(null);
  const [images,      setImages] = useState(null);
  const [extraBlocks, setExtra]  = useState([]);
  const [seo, setSeo]             = useState({});
  const [layout,      setLayout]= useState(null);

  useEffect(() => {
    getGalleryData()
      .then(d => {
        setHero(d.hero?.eyebrow ? d.hero : null);
        setImages(Array.isArray(d.images) ? d.images : []);
      })
      .catch(() => {});
    getBlocks('gallery').then(setExtra).catch(() => {});
    getSeo('gallery').then(setSeo).catch(() => {});
  }, []);

  const effectiveLayout = buildLayout(layout, extraBlocks);
  const sectionMap = {
    hero:            hero ? <InnerPageHero eyebrow={hero.eyebrow} title={hero.title} titleEm={hero.title_em} subtitle={hero.subtitle} breadcrumb={hero.breadcrumb} /> : null,
    gallery_section: images !== null ? <GallerySection images={images} /> : null,
    cta:             <InnerPageCTA />,
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

export default GalleryPage;
