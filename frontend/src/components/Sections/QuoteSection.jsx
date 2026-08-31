import { useSectionStyle, buildSectionCss } from '../../context/SectionStylesContext';
import { uploadUrl } from '../../services/apiUtils';
import './QuoteSection.css';

function QuoteSection({ quote }) {
  const ss = useSectionStyle('home:quote');
  const { style: sectionStyle, css: sectionCss } = buildSectionCss(ss, 'quote-section');
  if (!quote?.quote_text) return null;

  const bgStyle = quote.bg_image_url
    ? { backgroundImage: `url(${uploadUrl(quote.bg_image_url)})` }
    : {};

  return (
    <>
    {sectionCss && <style>{sectionCss}</style>}
    <section className="quote-section" style={{ ...bgStyle, ...sectionStyle }}>
      <div className="quote-bg-text" aria-hidden="true">ॐ</div>
      <div className="quote-inner reveal">
        {quote.quote_mark_url && (
          <div className="quote-mark">
            <img src={uploadUrl(quote.quote_mark_url)} alt="Quote mark" className="quote-mark-img" />
          </div>
        )}
        <p className="quote-text">{quote.quote_text}</p>
        {quote.ornament_url && (
          <div className="ornament">
            <img src={uploadUrl(quote.ornament_url)} alt="Ornament divider" className="ornament-img" />
          </div>
        )}
        {quote.quote_attr && <div className="quote-attr">{quote.quote_attr}</div>}
      </div>
    </section>
    </>
  );
}

export default QuoteSection;
