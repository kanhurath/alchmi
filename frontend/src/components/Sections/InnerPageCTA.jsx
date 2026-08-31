import { useBookingModal } from '../../context/BookingModalContext';
import './InnerPageCTA.css';

function InnerPageCTA() {
  const { openModal } = useBookingModal();
  return (
    <section className="inner-cta-strip">
      <h2>Begin a <em>Conversation</em></h2>
      <p>Explore a collaboration, commission a workshop, or simply reach out.</p>
      <div className="cta-btns">
        <button className="btn-light" onClick={openModal}>Book a Session</button>
        <button className="btn-outline-light" onClick={openModal}>Send a Message</button>
      </div>
    </section>
  );
}

export default InnerPageCTA;
