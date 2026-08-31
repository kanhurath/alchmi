import { authHeaders } from './apiUtils.js';
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/section-layout`;

async function json(res) {
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export const getLayout = (slug) =>
  fetch(`${BASE}/${slug}`).then(json);

export const saveLayout = (slug, items) =>
  fetch(`${BASE}/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ items }),
  }).then(json);

export const resetLayout = (slug) =>
  fetch(`${BASE}/${slug}`, { method: 'DELETE', headers: authHeaders() }).then(json);
