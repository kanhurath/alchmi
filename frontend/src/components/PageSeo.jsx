import { Helmet } from 'react-helmet-async';

const SERVER = import.meta.env.VITE_SERVER_URL
  || (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');

const SITE_URL = SERVER;

function resolveImage(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}

export function PageSeo({
  title,
  description,
  keyword,
  canonical,
  ogImage,
  schema,
  type = 'website',       // 'article' for individual article pages
  publishedTime,          // ISO date string for articles
  author,                 // author name for articles
}) {
  const fullTitle   = title    || 'Vinay Kulkarni — Dharayati Iti Dharmaha';
  const resolvedImg = resolveImage(ogImage);
  const ogType      = type;

  const metaTags   = [];
  const linkTags   = [];
  const scriptTags = [];

  if (description) {
    metaTags.push({ name: 'description',          content: description });
    metaTags.push({ property: 'og:description',   content: description });
    metaTags.push({ name: 'twitter:description',  content: description });
  }
  if (keyword)     metaTags.push({ name: 'keywords', content: keyword });

  if (resolvedImg) {
    metaTags.push({ property: 'og:image',         content: resolvedImg });
    metaTags.push({ property: 'og:image:width',   content: '1200' });
    metaTags.push({ property: 'og:image:height',  content: '630' });
    metaTags.push({ name: 'twitter:image',        content: resolvedImg });
  }

  if (canonical) {
    linkTags.push({ rel: 'canonical', href: canonical });
    metaTags.push({ property: 'og:url', content: canonical });
  }

  metaTags.push({ property: 'og:title',     content: fullTitle });
  metaTags.push({ property: 'og:type',      content: ogType });
  metaTags.push({ property: 'og:site_name', content: 'Vinay Kulkarni' });
  metaTags.push({ property: 'og:locale',    content: 'en_IN' });
  metaTags.push({ name: 'twitter:card',     content: resolvedImg ? 'summary_large_image' : 'summary' });
  metaTags.push({ name: 'twitter:title',    content: fullTitle });

  // Article-specific Open Graph tags
  if (ogType === 'article') {
    if (publishedTime) {
      const iso = new Date(publishedTime).toISOString();
      metaTags.push({ property: 'article:published_time', content: iso });
    }
    if (author) {
      metaTags.push({ property: 'article:author', content: author });
    }
  }

  // JSON-LD structured data
  if (schema) {
    scriptTags.push({ type: 'application/ld+json', innerHTML: schema });
  } else if (ogType === 'article' && canonical) {
    const ld = {
      '@context':    'https://schema.org',
      '@type':       'Article',
      headline:      fullTitle,
      url:           canonical,
      publisher:     { '@type': 'Organization', name: 'Vinay Kulkarni', url: SITE_URL },
    };
    if (description) ld.description = description;
    if (resolvedImg) ld.image       = resolvedImg;
    if (author)      ld.author      = { '@type': 'Person', name: author };
    if (publishedTime) ld.datePublished = new Date(publishedTime).toISOString();
    scriptTags.push({ type: 'application/ld+json', innerHTML: JSON.stringify(ld) });
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {metaTags.map((props, i)   => <meta   key={i} {...props} />)}
      {linkTags.map((props, i)   => <link   key={i} {...props} />)}
      {scriptTags.map((props, i) => <script key={i} {...props} />)}
    </Helmet>
  );
}
