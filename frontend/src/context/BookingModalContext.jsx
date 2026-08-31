import { createContext, useContext, useState } from 'react';

const BookingModalContext = createContext(null);

export function BookingModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <BookingModalContext.Provider value={{ open, openModal: () => setOpen(true), closeModal: () => setOpen(false) }}>
      {children}
    </BookingModalContext.Provider>
  );
}

export function useBookingModal() {
  return useContext(BookingModalContext);
}
