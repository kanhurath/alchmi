import { authHeaders } from './apiUtils.js';
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/seo`;

async function json(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const getSeo = (slug) =>
  fetch(`${BASE}/${slug}`).then(json);

export const saveSeo = (slug, data) =>
  fetch(`${BASE}/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  }).then(json);

export const uploadOgImage = (slug, file) => {
  const form = new FormData();
  form.append('image', file);
  return fetch(`${BASE}/${slug}/upload-image`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};
