import { authHeaders, handleJson } from './apiUtils';

const BASE = `${import.meta.env.VITE_API_URL || '/api'}/booking`;

// ── Public ────────────────────────────────────────────────────────────────────
export const getBookingSettings  = () => fetch(`${BASE}/settings`).then(handleJson);
export const getActiveDurations  = () => fetch(`${BASE}/durations`).then(handleJson);
export const getPaymentPublic    = () => fetch(`${BASE}/payment-public`).then(handleJson);
export const getBookedSlots      = (date) => fetch(`${BASE}/booked-slots?date=${date}`).then(handleJson);
export const getAvailability     = () => fetch(`${BASE}/availability`).then(handleJson);
export const getDateAvailability = (date) => fetch(`${BASE}/date-availability?date=${date}`).then(handleJson);

// ── Admin: date-specific schedules ───────────────────────────────────────────
export const getAdminDateSchedules  = () =>
  fetch(`${BASE}/admin/date-schedules`, { headers: authHeaders() }).then(handleJson);
export const createDateSchedule     = (data) =>
  fetch(`${BASE}/admin/date-schedules`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(data) }).then(handleJson);
export const updateDateSchedule     = (id, data) =>
  fetch(`${BASE}/admin/date-schedules/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(data) }).then(handleJson);
export const deleteDateSchedule     = (id) =>
  fetch(`${BASE}/admin/date-schedules/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleJson);

// ── Admin: time slots ─────────────────────────────────────────────────────────
export const getAdminTimeSlots   = () =>
  fetch(`${BASE}/admin/time-slots`, { headers: authHeaders() }).then(handleJson);
export const createTimeSlot      = (data) =>
  fetch(`${BASE}/admin/time-slots`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(data) }).then(handleJson);
export const updateTimeSlot      = (id, data) =>
  fetch(`${BASE}/admin/time-slots/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(data) }).then(handleJson);
export const deleteTimeSlot      = (id) =>
  fetch(`${BASE}/admin/time-slots/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleJson);

// ── Admin: day availability ───────────────────────────────────────────────────
export const getAdminDayAvailability  = () =>
  fetch(`${BASE}/admin/day-availability`, { headers: authHeaders() }).then(handleJson);
export const saveAdminDayAvailability = (data) =>
  fetch(`${BASE}/admin/day-availability`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(data) }).then(handleJson);

// ── Admin: blocked dates ──────────────────────────────────────────────────────
export const getAdminBlockedDates  = () =>
  fetch(`${BASE}/admin/blocked-dates`, { headers: authHeaders() }).then(handleJson);
export const addBlockedDate        = (data) =>
  fetch(`${BASE}/admin/blocked-dates`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(data) }).then(handleJson);
export const deleteBlockedDate     = (id) =>
  fetch(`${BASE}/admin/blocked-dates/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleJson);

export const createOrder = (data) =>
  fetch(`${BASE}/create-order`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  }).then(handleJson);

export const submitManualBooking = (data) =>
  fetch(`${BASE}/manual`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  }).then(handleJson);

export const verifyPayment = (data) =>
  fetch(`${BASE}/verify-payment`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  }).then(handleJson);

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAdminSettings = () =>
  fetch(`${BASE}/admin/settings`, { headers: authHeaders() }).then(handleJson);

export const saveAdminSettings = (data) =>
  fetch(`${BASE}/admin/settings`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify(data),
  }).then(handleJson);

export const getAdminPayment = () =>
  fetch(`${BASE}/admin/payment`, { headers: authHeaders() }).then(handleJson);

export const saveAdminPayment = (data) =>
  fetch(`${BASE}/admin/payment`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify(data),
  }).then(handleJson);

export const getAdminEmail = () =>
  fetch(`${BASE}/admin/email`, { headers: authHeaders() }).then(handleJson);

export const saveAdminEmail = (data) =>
  fetch(`${BASE}/admin/email`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify(data),
  }).then(handleJson);

export const getAdminDurations = () =>
  fetch(`${BASE}/admin/durations`, { headers: authHeaders() }).then(handleJson);

export const createDuration = (data) =>
  fetch(`${BASE}/admin/durations`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify(data),
  }).then(handleJson);

export const updateDuration = (id, data) =>
  fetch(`${BASE}/admin/durations/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify(data),
  }).then(handleJson);

export const deleteDuration = (id) =>
  fetch(`${BASE}/admin/durations/${id}`, {
    method:  'DELETE',
    headers: authHeaders(),
  }).then(handleJson);

export const getAdminBookings = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${BASE}/admin/bookings${q ? '?' + q : ''}`, { headers: authHeaders() }).then(handleJson);
};

export const updateBooking = (id, data, sendNotification = false) =>
  fetch(`${BASE}/admin/bookings/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify({ ...data, send_notification: sendNotification }),
  }).then(handleJson);

export const deleteBooking = (id) =>
  fetch(`${BASE}/admin/bookings/${id}`, {
    method:  'DELETE',
    headers: authHeaders(),
  }).then(handleJson);

export const getAdminStats = () =>
  fetch(`${BASE}/admin/stats`, { headers: authHeaders() }).then(handleJson);
