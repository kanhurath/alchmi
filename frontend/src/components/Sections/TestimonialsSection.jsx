import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCards } from '../../services/testimonialsApi';
import { useSectionStyle, buildSectionCss } from '../../context/SectionStylesContext';
import './TestimonialsSection.css';

const HOME_COUNT  = 4;
const AUTOPLAY_MS = 5500;

function TestimonialsSection() {
  const ss = useSectionStyle('home:testimonials');
  const { style: sectionStyle, css: sectionCss } = buildSectionCss(ss, 'testimonials-section');
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef  = useRef(null);
  const pausedRef = useRef(false);

  // Fetch CMS cards; show only first HOME_COUNT
  useEffect(() => {
    getCards()
      .then(rows => { if (Array.isArray(rows)) setItems(rows.slice(0, HOME_COUNT)); })
      .catch(() => {});
  }, []);

  // Reset carousel index when items change
  useEffect(() => { setCurrent(0); }, [items]);

  const goTo = useCallback((index) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => { setCurrent(index); setTransitioning(false); }, 320);
  }, [transitioning]);

  const next = useCallback(() => goTo((current + 1) % items.length), [current, goTo, items.length]);
  const prev = useCallback(() => goTo((current - 1 + items.length) % items.length), [current, goTo, items.length]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) setCurrent(c => (c + 1) % items.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [items.length]);

  const pause  = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  const item = items[current] || items[0];
  if (!item) return null;

  return (
    <>
    {sectionCss && <style>{sectionCss}</style>}
    <section className="testimonials-section" id="testimonials" style={sectionStyle}>
      <div className="testimonials-header reveal">
        <div className="section-label">Recommendation</div>
        <h2 className="section-title">Professional <em>Recommendations</em></h2>
      </div>

      <div className="testimonials-carousel"
        onMouseEnter={pause} onMouseLeave={resume}
        onTouchStart={pause} onTouchEnd={resume}>
        <button className="carousel-arrow carousel-prev" onClick={prev} aria-label="Previous testimonial">&#8592;</button>

        <div className={`testimonial-card${transitioning ? ' fading' : ''}`}>
          <div className="testimonial-quote-mark" aria-hidden="true">"</div>
          <blockquote className="testimonial-text">{item.text}</blockquote>
          <div className="testimonial-author">
            <div className="author-initial">{item.avatar}</div>
            <div className="author-info">
              <div className="author-name">{item.author}</div>
              <div className="author-role">{item.role}</div>
            </div>
          </div>
          <div className="testimonial-category">{item.program}</div>
        </div>

        <button className="carousel-arrow carousel-next" onClick={next} aria-label="Next testimonial">&#8594;</button>
      </div>

      <div className="carousel-dots" role="tablist" aria-label="Testimonial navigation">
        {items.map((_, i) => (
          <button key={i} role="tab" aria-selected={i === current}
            aria-label={`Testimonial ${i + 1}`}
            className={`carousel-dot${i === current ? ' active' : ''}`}
            onClick={() => goTo(i)} />
        ))}
      </div>

      <div className="testimonials-cta reveal">
        <Link to="/testimonials" className="testimonials-view-all">View All Recommendations</Link>
      </div>
    </section>
    </>
  );
}

export default TestimonialsSection;
