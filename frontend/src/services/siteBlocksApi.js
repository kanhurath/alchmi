import { authHeaders } from './apiUtils.js';
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/site-blocks`;

async function json(res) {
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export const getBlocks = (slug) =>
  fetch(`${BASE}/${slug}`).then(json);

export const addBlock = (slug, data) =>
  fetch(`${BASE}/${slug}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  }).then(json);

export const updateBlock = (slug, blockId, data) =>
  fetch(`${BASE}/${slug}/${blockId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  }).then(json);

export const deleteBlock = (slug, blockId) =>
  fetch(`${BASE}/${slug}/${blockId}`, { method: 'DELETE', headers: authHeaders() }).then(json);

export const reorderBlocks = (slug, items) =>
  fetch(`${BASE}/${slug}/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ items }),
  }).then(json);

export const uploadBlockImage = (slug, file) => {
  const form = new FormData();
  form.append('image', file);
  return fetch(`${BASE}/${slug}/upload`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};

export const uploadBlockPdf = (slug, file) => {
  const form = new FormData();
  form.append('pdf', file);
  return fetch(`${BASE}/${slug}/upload-pdf`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};
