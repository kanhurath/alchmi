import { authHeaders } from './apiUtils.js';
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/gallery`;

async function json(res) {
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

const put  = (url, d) => fetch(url, { method: 'PUT',    headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const post = (url, d) => fetch(url, { method: 'POST',   headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const del  = (url)    => fetch(url, { method: 'DELETE', headers: authHeaders() }).then(json);

export const getGalleryData = () => fetch(BASE).then(json);

export const getHero    = () => fetch(`${BASE}/hero`).then(json);
export const updateHero = (d) => put(`${BASE}/hero`, d);

export const getImages    = ()      => fetch(`${BASE}/images`).then(json);
export const createImage  = (d)     => post(`${BASE}/images`, d);
export const updateImage  = (id, d) => put(`${BASE}/images/${id}`, d);
export const deleteImage  = (id)    => del(`${BASE}/images/${id}`);
export const uploadImage  = (id, file) => {
  const form = new FormData(); form.append('image', file);
  return fetch(`${BASE}/images/${id}/upload`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};
