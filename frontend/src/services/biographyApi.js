import { authHeaders } from './apiUtils.js';
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/biography`;

async function json(res) {
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

// ── Hero ─────────────────────────────────────────────────────────────────────

export const getHero = () => fetch(`${BASE}/hero`).then(json);

export const updateHero = (data) =>
  fetch(`${BASE}/hero`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  }).then(json);

// ── Profile ──────────────────────────────────────────────────────────────────

export const getProfile = () => fetch(`${BASE}/profile`).then(json);

export const updateProfile = (data) =>
  fetch(`${BASE}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  }).then(json);

export const uploadProfilePhoto = (file) => {
  const form = new FormData();
  form.append('photo', file);
  return fetch(`${BASE}/profile/photo`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};

// ── Engage ────────────────────────────────────────────────────────────────────

export const getEngage = () => fetch(`${BASE}/engage`).then(json);

export const updateEngageIntro = (data) =>
  fetch(`${BASE}/engage/intro`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  }).then(json);

export const createEngageCard = (data) =>
  fetch(`${BASE}/engage/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  }).then(json);

export const updateEngageCard = (id, data) =>
  fetch(`${BASE}/engage/cards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  }).then(json);

export const deleteEngageCard = (id) =>
  fetch(`${BASE}/engage/cards/${id}`, { method: 'DELETE', headers: authHeaders() }).then(json);

export const addVenue = (cardId, venue_text, venue_url = '', venue_new_tab = false) =>
  fetch(`${BASE}/engage/cards/${cardId}/venues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ venue_text, venue_url, venue_new_tab }),
  }).then(json);

export const updateVenue = (id, venue_text, venue_url = '', venue_new_tab = false) =>
  fetch(`${BASE}/engage/venues/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ venue_text, venue_url, venue_new_tab, sort_order: 0 }),
  }).then(json);

export const deleteVenue = (id) =>
  fetch(`${BASE}/engage/venues/${id}`, { method: 'DELETE', headers: authHeaders() }).then(json);

// ── Ventures ─────────────────────────────────────────────────────────────────

export const getVentures = () => fetch(`${BASE}/ventures`).then(json);

export const createVenture = (data) =>
  fetch(`${BASE}/ventures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  }).then(json);

export const updateVenture = (id, data) =>
  fetch(`${BASE}/ventures/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  }).then(json);

export const deleteVenture = (id) =>
  fetch(`${BASE}/ventures/${id}`, { method: 'DELETE', headers: authHeaders() }).then(json);

export const uploadVentureLogo = (id, file) => {
  const form = new FormData();
  form.append('logo', file);
  return fetch(`${BASE}/ventures/${id}/logo`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};

// ── Fetch all biography data at once ─────────────────────────────────────────

export const getBiographyData = async () => {
  const [hero, profile, engage, ventures] = await Promise.all([
    getHero(),
    getProfile(),
    getEngage(),
    getVentures(),
  ]);
  return { hero, profile, engage, ventures };
};
