import { authHeaders } from './apiUtils.js';
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/events`;

async function json(res) {
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

const put  = (url, d) => fetch(url, { method: 'PUT',    headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const post = (url, d) => fetch(url, { method: 'POST',   headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const del  = (url)    => fetch(url, { method: 'DELETE', headers: authHeaders() }).then(json);

// All sections in one request (used by the public page)
export const getEventsData = () => fetch(BASE).then(json);

// Hero
export const getHero    = () => fetch(`${BASE}/hero`).then(json);
export const updateHero = (d) => put(`${BASE}/hero`, d);

// Upcoming events
export const getUpcoming    = ()      => fetch(`${BASE}/upcoming`).then(json);
export const createUpcoming = (d)     => post(`${BASE}/upcoming`, d);
export const updateUpcoming = (id, d) => put(`${BASE}/upcoming/${id}`, d);
export const deleteUpcoming = (id)    => del(`${BASE}/upcoming/${id}`);

// Completed events
export const getCompleted    = ()      => fetch(`${BASE}/completed`).then(json);
export const createCompleted = (d)     => post(`${BASE}/completed`, d);
export const updateCompleted = (id, d) => put(`${BASE}/completed/${id}`, d);
export const deleteCompleted = (id)    => del(`${BASE}/completed/${id}`);
