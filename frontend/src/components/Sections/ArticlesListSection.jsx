import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getArticles, getCategories, resolveUploadUrl } from '../../services/articlesApi';
import './ArticlesListSection.css';

const ARTICLES_PER_PAGE = 12;

function delayClass(i) {
  const d = i % 3;
  return d === 1 ? ' reveal-delay-1' : d === 2 ? ' reveal-delay-2' : '';
}

function ArticlesListSection() {
  const [searchParams] = useSearchParams();
  const categoryParam  = searchParams.get('category');

  const [active,      setActive]      = useState(categoryParam || 'all');
  const [articles,    setArticles]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const listRef = useRef(null);

  // Fetch categories once
  useEffect(() => {
    getCategories().catch(() => []).then(data => {
      if (Array.isArray(data)) setCategories(data);
    });
  }, []);

  // Debounce search so we don't fire on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset to page 1 whenever search term or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, active]);

  // Fetch articles — runs after every page/filter/search change.
  // The cancellation token discards any stale response from the
  // page-reset re-render, so only the final correct fetch resolves.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    const params = { page: currentPage, per_page: ARTICLES_PER_PAGE };
    if (active !== 'all') params.category = active;
    if (debouncedSearch)  params.search   = debouncedSearch;

    getArticles(params)
      .then(data => {
        if (cancelled) return;
        setArticles(data.articles || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 0);
      })
      .catch(err => {
        if (!cancelled) setFetchError(err.message || 'Failed to load articles.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [currentPage, active, debouncedSearch]);

  // Re-run reveal observer after each load
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const els = container.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08 }
    );
    els.forEach(el => { el.classList.remove('visible'); observer.observe(el); });
    return () => observer.disconnect();
  }, [articles]);

  const goToPage = (p) => {
    setCurrentPage(p);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const changeFilter = (slug) => {
    setActive(slug);
    setCurrentPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const pageStart = (currentPage - 1) * ARTICLES_PER_PAGE;

  return (
    <>
      {/* ── Filter Bar ── */}
      <div className="filter-bar">
        <span className="filter-label">Filter by</span>
        <button
          className={`filter-btn${active === 'all' ? ' active' : ''}`}
          onClick={() => changeFilter('all')}
        >
          All
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            className={`filter-btn${active === c.slug ? ' active' : ''}`}
            onClick={() => changeFilter(c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* ── Main ── */}
      <div className="articles-main" ref={listRef}>

        {/* ── Article Search ── */}
        <div className="article-search-bar">
          <div className="article-search-inner">
            <span className="article-search-icon">&#128269;</span>
            <input
              type="search"
              className="article-search-input"
              placeholder="Search articles by title or keyword…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search articles"
            />
            {searchQuery && (
              <button
                className="article-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                &#10005;
              </button>
            )}
          </div>
        </div>

        {/* Article list */}
        <div className="articles-list">
          {!loading && !fetchError && (
            <div className="articles-count">
              {total} Article{total !== 1 ? 's' : ''}
              {active !== 'all' && categories.find(c => c.slug === active)
                ? ` — ${categories.find(c => c.slug === active).name}`
                : ''}
            </div>
          )}

          {loading && <div className="articles-loading">Loading articles…</div>}

          {!loading && fetchError && (
            <div className="articles-error">
              <strong>Could not load articles.</strong>
              <span>{fetchError}</span>
            </div>
          )}

          {!loading && !fetchError && articles.length === 0 && (
            <div className="articles-loading">
              {debouncedSearch ? `No articles found for "${debouncedSearch}".` : 'No articles found.'}
            </div>
          )}

          <div className="articles-grid">
          {articles.map((article, i) => {
            const globalIndex = pageStart + i;
            const cats = (article.categories || '').split(/[\s,]+/).filter(Boolean);
            const tags = (article.tags || '').split(/[\s,]+/).filter(Boolean);
            const displayDate = article.pub_date_display || formatDate(article.pub_date);
            const imgUrl = resolveUploadUrl(article.featured_image_url);

            return (
              <div
                key={article.id}
                className={`article-item${article.is_featured ? ' featured' : ''} reveal${delayClass(i)}`}
              >
                {imgUrl && (
                  <Link to={`/articles/${article.slug}`} className="article-item-img-wrap">
                    <img src={imgUrl} alt={article.title} className="article-item-img" loading="lazy" />
                  </Link>
                )}

                <div className="article-item-inner">
                  <div>
                    {/* Category tags */}
                    {cats.length > 0 && (
                      <div className="article-tags">
                        {cats.map(slug => {
                          const cat = categories.find(c => c.slug === slug);
                          return (
                            <span
                              key={slug}
                              className="article-tag"
                              onClick={() => changeFilter(slug)}
                              style={{ cursor: 'pointer' }}
                            >
                              {cat ? cat.name : slug}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <Link to={`/articles/${article.slug}`} className="article-item-title-link">
                      <div className="article-item-title">{article.title}</div>
                    </Link>

                    {article.excerpt && (
                      <div
                        className="article-excerpt"
                        dangerouslySetInnerHTML={{ __html: article.excerpt }}
                      />
                    )}

                    <div className="article-meta-row">
                      {displayDate && (
                        <span className="article-date">{displayDate}</span>
                      )}
                      {article.author_name && (
                        <span className="article-date">By {article.author_name}</span>
                      )}
                      <Link to={`/articles/${article.slug}`} className="article-read-more">
                        Read Article
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pag-btn pag-prev"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, idx) => {
                const p = idx + 1;
                const show = p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                const ellipsisBefore = p === currentPage - 2 && currentPage > 3;
                const ellipsisAfter  = p === currentPage + 2 && currentPage < totalPages - 2;
                if (!show && !ellipsisBefore && !ellipsisAfter) return null;
                if (ellipsisBefore || ellipsisAfter) return <span key={`dots-${p}`} className="pag-dots">…</span>;
                return (
                  <button
                    key={p}
                    className={`pag-btn${p === currentPage ? ' pag-active' : ''}`}
                    onClick={() => goToPage(p)}
                    aria-current={p === currentPage ? 'page' : undefined}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                className="pag-btn pag-next"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ArticlesListSection;
