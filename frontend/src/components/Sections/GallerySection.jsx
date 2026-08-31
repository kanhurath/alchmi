import { useState, useEffect, useCallback, useRef } from 'react';
import { uploadUrl } from '../../services/apiUtils';
import './GallerySection.css';

// ── Bundled static images (Vite glob — build-time only) ───────────────────────
const imgs = import.meta.glob('../../assets/gallery-images/*', { eager: true, import: 'default' });
const g = (name) => imgs[`../../assets/gallery-images/${name}`];

const STATIC_IMAGES = [
  { id: 1,  cat: 'iks',       caption: 'IKS APEX Meet 2026',                  src: g('IMG_6570-1024x576.jpg') },
  { id: 2,  cat: 'iks',       caption: 'IKS APEX Meet 2026',                  src: g('IMG_6521-1024x576.jpg') },
  { id: 3,  cat: 'iks',       caption: 'IKS APEX Meet 2026',                  src: g('IMG_6523-1024x576.jpg') },
  { id: 4,  cat: 'portraits', caption: 'Vinay Kulkarni',                      src: g('IMG_6421-1024x1021.jpg') },
  { id: 5,  cat: 'iks',       caption: 'IKS APEX Meet 2026 · Session',        src: g('IKS-APEX-Meet-2026-03.png') },
  { id: 6,  cat: 'talks',     caption: 'IKS & Bhāratīya Education',           src: g('IKS-and-How-It-Can-Transform-Bharatiya-Education.png') },
  { id: 7,  cat: 'iks',       caption: 'IKS APEX Meet 2026',                  src: g('IKS-APEX-Meet-2026.png') },
  { id: 8,  cat: 'iks',       caption: 'IKS APEX Meet 2026',                  src: g('IKS-APEX-Meet-2026-02.png') },
  { id: 9,  cat: 'workshops', caption: 'Workshop · 2025',                     src: g('6.jpg') },
  { id: 10, cat: 'workshops', caption: 'Workshop · 2025',                     src: g('5.jpg') },
  { id: 11, cat: 'workshops', caption: 'Workshop · 2025',                     src: g('4.jpg') },
  { id: 12, cat: 'talks',     caption: 'Talk · 2026',                         src: g('1740126148140.jpg') },
  { id: 13, cat: 'talks',     caption: 'Talk · 2026',                         src: g('1740126148281.jpg') },
  { id: 14, cat: 'talks',     caption: 'Talk · 2026',                         src: g('1740126148667.jpg') },
  { id: 15, cat: 'iks',       caption: 'IKS Session · Feb 2026',              src: g('WhatsApp-Image-2026-02-05-at-5.49.29-PM.jpg') },
  { id: 16, cat: 'workshops', caption: 'Certificate Course · 2025',           src: g('WhatsApp-Image-2025-02-14-at-2.04.32-AM-2.jpg') },
  { id: 17, cat: 'workshops', caption: 'Workshop · 2025',                     src: g('17.jpg') },
  { id: 18, cat: 'workshops', caption: 'Workshop · 2025',                     src: g('8.jpg') },
  { id: 19, cat: 'iks',       caption: 'IKS Session · Feb 2026',              src: g('WhatsApp-Image-2026-02-05-at-5.49.28-PM.jpg') },
  { id: 20, cat: 'workshops', caption: 'IKS Certificate Course · Feb 2025',  src: g('WhatsApp-Image-2025-02-09-at-12.39.38-AM.jpg') },
  { id: 21, cat: 'workshops', caption: 'Certificate Course · Feb 2025',       src: g('WhatsApp-Image-2025-02-14-at-1.48.05-AM-1.jpg') },
  { id: 22, cat: 'workshops', caption: 'Certificate Course · Feb 2025',       src: g('WhatsApp-Image-2025-02-14-at-1.48.05-AM-2.jpg') },
  { id: 23, cat: 'workshops', caption: 'Workshop · Feb 2025',                 src: g('WhatsApp-Image-2025-02-14-at-1.40.54-AM.jpg') },
  { id: 24, cat: 'workshops', caption: 'Workshop · Feb 2025',                 src: g('WhatsApp-Image-2025-02-14-at-1.41.46-AM.jpg') },
  { id: 25, cat: 'portraits', caption: 'Portrait · 2025',                    src: g('IMG_9662-scaled.jpg') },
  { id: 26, cat: 'workshops', caption: 'IKS Course Launch · Feb 2025',       src: g('WhatsApp-Image-2025-02-04-at-7.49.46-PM.jpg') },
];

// ── Helpers ───────────────────────────────────────────────────────────────────


const BADGE_LABEL = {
  iks:       'IKS Events',
  talks:     'Talks & Panels',
  workshops: 'Workshops',
  portraits: 'Portraits',
};

function toAbsolute(url) {
  return uploadUrl(url);
}

// Returns { fullJpg, fullWebp, thumbJpg, thumbWebp } for any image object.
// CMS images: derives WebP + thumbnail paths from image_url by convention:
//   /uploads/gallery/stem.jpg   → stem.webp / stem-thumb.jpg / stem-thumb.webp
// Static bundled images: all four point to the same src (no server-side variants).
function resolveImageSources(img) {
  if (img.image_url) {
    const base    = toAbsolute(img.image_url); // full JPEG
    const fullWebp  = base.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const thumbJpg  = base.replace(/\.(jpg|jpeg|png|webp)$/i, '-thumb.$1');
    const thumbWebp = base.replace(/\.(jpg|jpeg|png|webp)$/i, '-thumb.webp');
    return { fullJpg: base, fullWebp, thumbJpg, thumbWebp };
  }
  const src = img.src || null;
  return { fullJpg: src, fullWebp: null, thumbJpg: src, thumbWebp: null };
}

// Legacy helper kept for lightbox (used below)
function resolveImgSrc(img) {
  return img.image_url ? toAbsolute(img.image_url) : (img.src || null);
}

// Build filter list from the actual image set (unique cats, always prepend 'all')
function buildFilters(imageList) {
  const seen = new Set();
  const result = [{ key: 'all', label: 'All Photos' }];
  imageList.forEach(img => {
    const cat = img.cat;
    if (cat && !seen.has(cat)) {
      seen.add(cat);
      result.push({ key: cat, label: BADGE_LABEL[cat] || cat });
    }
  });
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

function GallerySection({ images: cmsImages }) {
  if (!cmsImages?.length) return null;
  const imageList = cmsImages;
  const filters   = buildFilters(imageList);

  const [active,     setActive]     = useState('all');
  const [loadedIds,  setLoadedIds]  = useState(new Set());
  const [lightbox,   setLightbox]   = useState(null);
  const gridRef = useRef(null);

  const visible = active === 'all'
    ? imageList
    : imageList.filter(img => img.cat === active);

  // Reset active filter if the CMS image set changes (avoids empty grids)
  useEffect(() => { setActive('all'); }, [cmsImages]);

  // Re-run reveal observer when filter or image source changes
  useEffect(() => {
    const container = gridRef.current;
    if (!container) return;
    const els = container.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.05 }
    );
    els.forEach(el => { el.classList.remove('visible'); obs.observe(el); });
    return () => obs.disconnect();
  }, [active, imageList]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightbox]);

  // Keyboard navigation for lightbox
  const handleKey = useCallback(e => {
    if (lightbox === null) return;
    if (e.key === 'ArrowRight') setLightbox(l => ({ index: (l.index + 1) % visible.length }));
    if (e.key === 'ArrowLeft')  setLightbox(l => ({ index: (l.index - 1 + visible.length) % visible.length }));
    if (e.key === 'Escape')     setLightbox(null);
  }, [lightbox, visible.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const openLightbox  = (index) => setLightbox({ index });
  const closeLightbox = () => setLightbox(null);
  const navigate      = (dir) => setLightbox(l => ({ index: (l.index + dir + visible.length) % visible.length }));

  const currentImage = lightbox !== null ? visible[lightbox.index] : null;

  return (
    <>
      {/* ── FILTER BAR ── */}
      <div className="gallery-filter reveal">
        <span className="gallery-filter-label">View</span>
        {filters.map(f => (
          <button key={f.key}
            className={`gallery-filter-btn${active === f.key ? ' active' : ''}`}
            onClick={() => setActive(f.key)}>
            {f.label}
          </button>
        ))}
        <span className="gallery-count-display">
          {visible.length} Image{visible.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── GALLERY ── */}
      <div className="gallery-wrapper">
        <div className="gallery-section-label reveal">Gallery of Images</div>

        <div className="masonry-grid" ref={gridRef}>
          {visible.map((img, i) => {
            const { fullJpg, thumbJpg, thumbWebp } = resolveImageSources(img);
            return (
              <div key={img.id}
                className={`gallery-item reveal${loadedIds.has(img.id) ? ' img-ready' : ''}`}
                onClick={() => openLightbox(i)}>
                {thumbJpg && (
                  <picture>
                    {thumbWebp && <source type="image/webp" srcSet={thumbWebp} />}
                    <img
                      src={thumbJpg}
                      alt={img.caption}
                      loading="lazy"
                      decoding="async"
                      className={loadedIds.has(img.id) ? 'loaded' : ''}
                      onLoad={() => setLoadedIds(prev => new Set([...prev, img.id]))}
                      onError={(e) => { e.target.onerror = null; e.target.src = fullJpg; }}
                    />
                  </picture>
                )}
                <div className="gallery-overlay">
                  <div className="overlay-caption">{img.caption}</div>
                </div>
                <span className="item-badge">{BADGE_LABEL[img.cat] || img.cat}</span>
                <span className="overlay-zoom">+</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      {lightbox !== null && currentImage && (
        <div className="lightbox open"
          onClick={e => { if (e.target.classList.contains('lightbox')) closeLightbox(); }}>
          <div className="lightbox-inner">
            <button className="lightbox-close" onClick={closeLightbox} aria-label="Close" />
            <button className="lightbox-nav lightbox-prev" onClick={() => navigate(-1)} aria-label="Previous">&#8592;</button>
            {(() => {
              const { fullJpg, fullWebp } = resolveImageSources(currentImage);
              return (
                <picture>
                  {fullWebp && <source type="image/webp" srcSet={fullWebp} />}
                  <img className="lightbox-img" src={fullJpg} alt={currentImage.caption} decoding="async" />
                </picture>
              );
            })()}
            <button className="lightbox-nav lightbox-next" onClick={() => navigate(1)} aria-label="Next">&#8594;</button>
            <div className="lightbox-caption">{currentImage.caption}</div>
            <div className="lightbox-counter">{lightbox.index + 1} / {visible.length}</div>
          </div>
        </div>
      )}
    </>
  );
}

export default GallerySection;
