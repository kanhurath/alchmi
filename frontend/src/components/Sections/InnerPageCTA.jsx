import { Link } from 'react-router-dom';
import { useBookingModal } from '../../context/BookingModalContext';
import './InnerPageCTA.css';

function InnerPageCTA() {
  const { openModal } = useBookingModal();
  return (
    <section className="inner-cta-strip">
      <h2>Begin a <em>Conversation</em></h2>
      <p>Explore a collaboration, commission a workshop, or simply reach out.</p>
      <div className="cta-btns">
        <Link to="/book-discovery" className="btn-light">Book a Session</Link>
        <button className="btn-outline-light" onClick={openModal}>Send a Message</button>
      </div>
    </section>
  );
}

export default InnerPageCTA;
