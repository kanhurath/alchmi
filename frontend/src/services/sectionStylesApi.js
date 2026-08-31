import { authHeaders } from './apiUtils.js';

const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/section-styles`;

async function json(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const getAllSectionStyles = () => fetch(BASE).then(json);

export const getSectionStyle = (key) => fetch(`${BASE}/${key}`).then(json);

export const updateSectionStyle = (key, data) =>
  fetch(`${BASE}/${key}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify(data),
  }).then(json);
