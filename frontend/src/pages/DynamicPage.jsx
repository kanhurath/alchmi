import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { PageSeo } from '../components/PageSeo';
import { getPageSlug } from '../services/customPagesApi';
import './DynamicPage.css';

function DynamicPage() {
  const { slug } = useParams();
  const [page,     setPage]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true); setNotFound(false);
    getPageSlug(slug)
      .then(data => setPage(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.8rem', letterSpacing: '0.15em', color: '#8b7355' }}>
      Loading…
    </div>
  );

  if (notFound || !page) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
      <div style={{ fontSize: '3rem', opacity: 0.2 }}>404</div>
      <p style={{ fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.85rem', letterSpacing: '0.1em', color: '#8b7355' }}>This page could not be found or is not published.</p>
      <Link to="/" style={{ fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.7rem', letterSpacing: '0.15em', color: '#de7336', textDecoration: 'none' }}>← Back to Home</Link>
    </div>
  );

  const layout    = page.layout || 'no_sidebar';
  const allBlocks = (page.blocks || []).slice().sort((a, b) => a.sort_order - b.sort_order);

  // No sidebar — original flat rendering
  if (layout === 'no_sidebar') {
    return (
      <main>
        <PageSeo
          title={page.seo_title || page.title}
          description={page.meta_description}
          keyword={page.focus_keyword}
          canonical={page.canonical_url}
          ogImage={page.og_image_url}
          schema={page.custom_schema}
        />
        {allBlocks.map(block => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </main>
    );
  }

  // Sidebar layout — split blocks by area
  const mainBlocks    = allBlocks.filter(b => (b.area || 'main') === 'main');
  const sidebarBlocks = allBlocks.filter(b => b.area === 'sidebar');

  return (
    <main>
      <PageSeo
        title={page.seo_title || page.title}
        description={page.meta_description}
        keyword={page.focus_keyword}
        canonical={page.canonical_url}
        ogImage={page.og_image_url}
        schema={page.custom_schema}
      />
      <div className={`dp-layout dp-layout-${layout}`}>
        <div className="dp-main">
          {mainBlocks.map(block => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>
        <aside className="dp-sidebar">
          {sidebarBlocks.map(block => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </aside>
      </div>
    </main>
  );
}

export default DynamicPage;
