import { useState, useEffect } from 'react';
import { useReveal } from '../hooks/useReveal';
import { PageSeo } from '../components/PageSeo';
import InnerPageHero from '../components/Sections/InnerPageHero';
import ArticlesListSection from '../components/Sections/ArticlesListSection';
import InnerPageCTA from '../components/Sections/InnerPageCTA';
import { getSeo } from '../services/seoApi';
import { getArticlesHero } from '../services/articlesApi';

const HERO_DEFAULTS = {
  eyebrow:    'Writing',
  title:      'Recent',
  title_em:   'Articles',
  subtitle:   'Reflections on Dharma, Indian Knowledge Systems, education, and the ancient wisdom of Bhārata applied to modern life.',
  breadcrumb: 'Articles',
};

function ArticlesPage() {
  useReveal();
  const [seo,  setSeo]  = useState({});
  const [hero, setHero] = useState(HERO_DEFAULTS);

  useEffect(() => {
    getSeo('articles').then(setSeo).catch(() => {});
    getArticlesHero().then(d => setHero({ ...HERO_DEFAULTS, ...d })).catch(() => {});
  }, []);

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
      <InnerPageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        titleEm={hero.title_em}
        subtitle={hero.subtitle}
        breadcrumb={hero.breadcrumb}
      />
      <ArticlesListSection />
      <InnerPageCTA />
    </main>
  );
}

export default ArticlesPage;
