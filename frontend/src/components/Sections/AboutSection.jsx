import { useState } from 'react';
import aboutPhoto from '../../assets/Images/vinay-kulkarni-original.jpg';
import JourneyModal from '../UI/JourneyModal';
import { uploadUrl } from '../../services/apiUtils';
import { useSectionStyle, buildSectionCss } from '../../context/SectionStylesContext';
import './AboutSection.css';

function AboutSection({ about }) {
  const [showModal, setShowModal] = useState(false);
  const ss = useSectionStyle('home:about');
  const { style: sectionStyle, css: sectionCss } = buildSectionCss(ss, 'about');
  if (!about?.bio && !about?.heading1) return null;

  const tags     = about.tags || [];
  const photoSrc = about.media_url ? uploadUrl(about.media_url) : aboutPhoto;

  return (
    <>{sectionCss && <style>{sectionCss}</style>}
    <section className="about" id="about" style={sectionStyle}>
      <div className="about-media reveal">
        <img src={photoSrc} alt="Vinay Kulkarni" className="about-photo" />
        <div className="about-photo-frame" />
        <div className="about-badge">
          <span className="devanagari">वि</span>
          <span>Vinay Ji</span>
        </div>
        <button className="about-journey-btn" onClick={() => setShowModal(true)}>
          {about.journey_btn_text || "Explore Vinay's Journey"}
        </button>
      </div>

      {showModal && (
        <JourneyModal
          pdfUrl={about.journey_pdf_url ? uploadUrl(about.journey_pdf_url) : '/leadership.pdf'}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="about-content">
        <div className="section-label reveal" style={{ color: '#de7336' }}>About</div>
        {(about.heading1 || about.heading_em || about.heading2) && (
          <h2 className="section-title reveal reveal-delay-1" style={{ color: '#8b2e33' }}>
            {about.heading1}{about.heading_em && <>{' '}<em style={{ color: '#de7336' }}>{about.heading_em}</em></>}
            {about.heading2 && <><br />{about.heading2}</>}
          </h2>
        )}
        {about.bio   && <p className="about-bio reveal reveal-delay-2">{about.bio}</p>}
        {about.quote && <blockquote className="about-quote reveal reveal-delay-3">"{about.quote}"</blockquote>}
        {tags.length > 0 && (
          <div className="about-tags reveal">
            {tags.map((tag) => {
              const text = tag.tag_text || tag;
              return <span key={text} className="tag tag-accent">{text}</span>;
            })}
          </div>
        )}
      </div>
    </section>
    </>
  );
}

export default AboutSection;
