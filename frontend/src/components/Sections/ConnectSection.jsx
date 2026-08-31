import { useBookingModal } from '../../context/BookingModalContext';
import ContactForm from '../UI/ContactForm';
import { useSectionStyle, buildSectionCss } from '../../context/SectionStylesContext';
import './ConnectSection.css';

function ConnectSection({ connect }) {
  const { openModal } = useBookingModal();
  const ss = useSectionStyle('home:connect');
  const { style: sectionStyle, css: sectionCss } = buildSectionCss(ss, 'connect-section');
  const desc  = connect?.description || '';
  const links = connect?.links?.length ? connect.links : [];

  return (
    <>
    {sectionCss && <style>{sectionCss}</style>}
    <section className="connect-section" id="connect" style={sectionStyle}>
      <div className="connect-left reveal">
        <div className="section-label">Connect</div>
        <h2 className="section-title">Begin a <em style={{ color: '#f3b33e' }}>Conversation</em></h2>
        <p className="connect-desc">{desc}</p>
        <div className="connect-links">
          <button className="connect-link connect-link-btn" onClick={openModal}>
            <span className="link-icon">◎</span>
            Book a Session
          </button>
          {links.map(link => (
            <a key={link.id || link.href} href={link.href} className="connect-link" target="_blank" rel="noreferrer">
              <span className="link-icon">{link.icon}</span>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="connect-right reveal reveal-delay-1">
        <ContactForm />
      </div>
    </section>
    </>
  );
}

export default ConnectSection;
