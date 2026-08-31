import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal';
import { PageSeo } from '../components/PageSeo';
import InnerPageHero from '../components/Sections/InnerPageHero';
import { getArticle, resolveUploadUrl } from '../services/articlesApi';
import './ArticleSinglePage.css';

const SITE_URL = (import.meta.env.VITE_SERVER_URL || 'http://localhost:3001').replace(/\/$/, '');

function ArticleSinglePage() {
  useReveal();
  const { slug } = useParams();
  const navigate  = useNavigate();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setError(null);

    getArticle(slug)
      .then(d => { setData(d); setLoading(false); })
      .catch(err => {
        if (err.message?.includes('404')) {
          navigate('/articles', { replace: true });
        } else {
          setError(err.message || 'Failed to load article.');
          setLoading(false);
        }
      });
  }, [slug, navigate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <main className="article-single">
        <div className="article-loading">
          <div className="article-loading-spinner" />
          <p>Loading article…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="article-single">
        <div className="article-error">
          <p>Could not load this article.</p>
          <Link to="/articles" className="article-back-link">← Back to Articles</Link>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { article, categories, prev, next } = data;
  const imgUrl     = resolveUploadUrl(article.featured_image_url);
  const displayDate = article.pub_date_display || formatDate(article.pub_date);
  const cats       = (article.categories || '').split(/[\s,]+/).filter(Boolean);

  return (
    <main className="article-single">
      <PageSeo
        type="article"
        title={article.seo_title || article.title}
        description={article.meta_description || undefined}
        keyword={article.tags || undefined}
        canonical={article.canonical_url || `${SITE_URL}/articles/${article.slug}`}
        ogImage={resolveUploadUrl(article.og_image_url || article.featured_image_url)}
        publishedTime={article.pub_date || undefined}
        author={article.author_name || 'Vinay Kulkarni'}
      />

      {/* ── Inner Hero Banner ── */}
      <InnerPageHero
        eyebrow={
          categories.length > 0
            ? categories.map(c => c.name).join(' · ')
            : 'Articles'
        }
        title={article.title}
        subtitle={
          displayDate
            ? `By ${article.author_name || 'Vinay Kulkarni'} · ${displayDate}`
            : `By ${article.author_name || 'Vinay Kulkarni'}`
        }
        breadcrumb={
          <>
            <Link to="/articles">Articles</Link>
            {categories.length > 0 && (
              <>
                <span>/</span>
                <Link to={`/articles?category=${categories[0].slug}`}>
                  {categories[0].name}
                </Link>
              </>
            )}
            <span>/</span>
            <span aria-current="page">{article.title}</span>
          </>
        }
      />

      {/* ── Featured Image ── */}
      {imgUrl && (
        <div className="article-featured-image">
          <img src={imgUrl} alt={article.title} />
        </div>
      )}

      {/* ── Content ── */}
      <div className="article-body-wrap">
        <article
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* ── Tags ── */}
        {article.tags && (
          <div className="article-tags-row">
            <span className="article-tags-label">Tags</span>
            {(article.tags || '').split(/[\s,]+/).filter(Boolean).map(t => (
              <span key={t} className="article-tag-chip">{t}</span>
            ))}
          </div>
        )}

        {/* ── Author card ── */}
        <div className="article-author-card">
          <div className="author-avatar" aria-hidden="true">वि</div>
          <div className="author-info">
            <div className="author-name">{article.author_name || 'Vinay Kulkarni'}</div>
            <div className="author-bio">
              Founder, ALCHMI · Dharmic Enterprise. Scholar-practitioner exploring the intersection
              of Indian Knowledge Systems, education, and conscious enterprise.
            </div>
          </div>
        </div>

        {/* ── Prev / Next ── */}
        {(prev || next) && (
          <nav className="article-prev-next" aria-label="Article navigation">
            {prev ? (
              <Link to={`/articles/${prev.slug}`} className="article-nav-link prev">
                <span className="nav-dir">← Previous</span>
                <span className="nav-title">{prev.title}</span>
              </Link>
            ) : <div />}

            {next ? (
              <Link to={`/articles/${next.slug}`} className="article-nav-link next">
                <span className="nav-dir">Next →</span>
                <span className="nav-title">{next.title}</span>
              </Link>
            ) : <div />}
          </nav>
        )}

        {/* ── Back link ── */}
        <div className="article-back">
          <Link to="/articles" className="article-back-btn">← All Articles</Link>
        </div>
      </div>
    </main>
  );
}

export default ArticleSinglePage;
