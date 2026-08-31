import { useState, useEffect } from 'react';
import talksImg01 from '../../assets/videos-thumb/VK_Podcast_Thumbnail-01_27052026_01_v1.jpg';
import talksImg02 from '../../assets/videos-thumb/VK_Podcast_Thumbnail-02_27052026_01_v1.jpg';
import talksImg03 from '../../assets/videos-thumb/VK_Podcast_Thumbnail-05_27052026_01_v1.jpg';
import { uploadUrl } from '../../services/apiUtils';
import { useSectionStyle, buildSectionCss } from '../../context/SectionStylesContext';
import './TalksSection.css';

const BRANDED_THUMBS = [talksImg01, talksImg02, talksImg03];

function resolveThumb(talk, index) {
  if (talk.thumb_url) return uploadUrl(talk.thumb_url);
  return BRANDED_THUMBS[index] || `https://img.youtube.com/vi/${talk.youtube_id}/hqdefault.jpg`;
}

function TalksSection({ talks }) {
  const ss = useSectionStyle('home:talks');
  const { style: sectionStyle, css: sectionCss } = buildSectionCss(ss, 'talks-section');
  if (!talks?.length) return null;
  const list = talks;
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    if (activeVideo === null) return;
    const onKey = (e) => { if (e.key === 'Escape') setActiveVideo(null); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [activeVideo]);

  return (
    <>
    {sectionCss && <style>{sectionCss}</style>}
    <section className="talks-section" id="talks" style={sectionStyle}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}
        className="reveal"
      >
        <div>
          <div className="section-label">Media</div>
          <h2 className="section-title">Videos &amp; <em>Podcasts</em></h2>
        </div>
        <a href="/videos" className="view-all">View all</a>
      </div>

      <div className="talks-grid">
        {list.map((talk, i) => (
          <div
            key={talk.id}
            className={`talk-card reveal${i === 1 ? ' reveal-delay-1' : i === 2 ? ' reveal-delay-2' : ''}`}
            onClick={() => setActiveVideo(talk)}
          >
            <img src={resolveThumb(talk, i)} alt="" className="talk-thumb" />
            <div className="talk-overlay">
              <div className="talk-label">{talk.label}</div>
              <div className="talk-title">{talk.title}</div>
            </div>
            <button className="talk-play" aria-label="Play" />
          </div>
        ))}
      </div>

      {activeVideo && (
        <div className="yt-modal" onClick={(e) => { if (e.target === e.currentTarget) setActiveVideo(null); }}>
          <div className="yt-modal-inner">
            <button className="yt-modal-close" onClick={() => setActiveVideo(null)} aria-label="Close">&#x2715;</button>
            <div className="yt-modal-title">{activeVideo.title}</div>
            <div className="yt-embed-wrap">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtube_id || activeVideo.youtubeId}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
    </>
  );
}

export default TalksSection;
