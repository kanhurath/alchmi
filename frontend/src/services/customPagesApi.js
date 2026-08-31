import { authHeaders } from './apiUtils.js';
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/custom-pages`;

async function json(res) {
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
const get  = url       => fetch(url).then(json);
const put  = (url, d)  => fetch(url, { method: 'PUT',    headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const post = (url, d)  => fetch(url, { method: 'POST',   headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const del  = url       => fetch(url, { method: 'DELETE', headers: authHeaders() }).then(json);

// Pages
export const listPages   = ()          => get(BASE);
export const getPage     = id          => get(`${BASE}/${id}`);
export const getPageSlug = slug        => get(`${BASE}/by-slug/${slug}`);
export const createPage  = data        => post(BASE, data);
export const updatePage  = (id, data)  => put(`${BASE}/${id}`, data);
export const deletePage  = id          => del(`${BASE}/${id}`);

// Blocks
export const addBlock      = (pid, data)       => post(`${BASE}/${pid}/blocks`, data);
export const updateBlock   = (pid, bid, data)  => put(`${BASE}/${pid}/blocks/${bid}`, data);
export const deleteBlock   = (pid, bid)        => del(`${BASE}/${pid}/blocks/${bid}`);
export const reorderBlocks = (pid, items)      => put(`${BASE}/${pid}/blocks/reorder`, { items });

// Image upload
export const uploadBlockImage = (pid, file) => {
  const form = new FormData(); form.append('image', file);
  return fetch(`${BASE}/${pid}/blocks/upload`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};

// PDF upload
export const uploadBlockPdf = (pid, file) => {
  const form = new FormData(); form.append('pdf', file);
  return fetch(`${BASE}/${pid}/blocks/upload-pdf`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};
