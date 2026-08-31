import { useEffect } from 'react';
import { useBookingModal } from '../../context/BookingModalContext';
import ContactForm from './ContactForm';
import './BookingModal.css';

function BookingModal() {
  const { open, closeModal } = useBookingModal();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeModal]);

  if (!open) return null;

  return (
    <div
      className="booking-overlay"
      onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Send a Message"
    >
      <div className="booking-modal">
        <button className="booking-close" onClick={closeModal} aria-label="Close" />
        <div className="booking-modal-body">
          <ContactForm onSuccess={closeModal} />
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
