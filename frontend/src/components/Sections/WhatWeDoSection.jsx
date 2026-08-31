import { uploadUrl } from '../../services/apiUtils';
import { useSectionStyle, buildSectionCss } from '../../context/SectionStylesContext';
import './WhatWeDoSection.css';

// Default icon — fits the site's Dharmic / teaching theme
function DefaultIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l2.5 2.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatWeDoSection({ whatwedo }) {
  const ss = useSectionStyle('home:whatwedo');
  const { style: sectionStyle, css: sectionCss } = buildSectionCss(ss, 'wwd-section');
  const s     = whatwedo?.section || {};
  const cards = whatwedo?.cards   || [];

  if (!s.eyebrow && !s.heading && !cards.length) return null;

  return (
    <>
    {sectionCss && <style>{sectionCss}</style>}
    <section className="wwd-section" style={sectionStyle}>
      <div className="wwd-inner">

        {/* Eyebrow */}
        {s.eyebrow && (
          <div className="wwd-eyebrow reveal">
            <span className="wwd-eyebrow-dash" />
            <span className="wwd-eyebrow-text">{s.eyebrow}</span>
          </div>
        )}

        {/* Heading */}
        {(s.heading || s.heading_em) && (
          <h2 className="wwd-heading reveal reveal-delay-1">
            {s.heading}
            {s.heading_em && <> <em>{s.heading_em}</em></>}
          </h2>
        )}

        {/* Lede */}
        {s.lede && (
          <p className="wwd-lede reveal reveal-delay-2">{s.lede}</p>
        )}

        {/* Cards */}
        {cards.length > 0 && (
          <div className="wwd-cards">
            {cards.map((card, i) => {
              const iconSrc = card.icon_url ? uploadUrl(card.icon_url) : null;
              const delay   = i === 0 ? '' : ` reveal-delay-${Math.min(i, 3)}`;
              return (
                <div key={card.id} className={`wwd-card reveal${delay}`}>
                  <div className="wwd-icon">
                    {iconSrc
                      ? <img src={iconSrc} alt="" />
                      : <DefaultIcon />
                    }
                  </div>
                  <h3 className="wwd-card-title">{card.title}</h3>
                  {card.description && (
                    <p className="wwd-card-desc">{card.description}</p>
                  )}
                  {card.link_text && card.link_url && (
                    <a
                      href={card.link_url}
                      className="wwd-learn-more"
                      target={card.link_url.startsWith('http') ? '_blank' : undefined}
                      rel={card.link_url.startsWith('http') ? 'noreferrer' : undefined}
                    >
                      {card.link_text} <span aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
    </>
  );
}

export default WhatWeDoSection;
