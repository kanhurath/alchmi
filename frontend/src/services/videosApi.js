import { authHeaders } from './apiUtils.js';
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/videos`;

async function json(res) {
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

const put  = (url, d) => fetch(url, { method: 'PUT',    headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const post = (url, d) => fetch(url, { method: 'POST',   headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const del  = (url)    => fetch(url, { method: 'DELETE', headers: authHeaders() }).then(json);

// All sections in one request (used by the public page)
export const getVideosData = () => fetch(BASE).then(json);

// Hero
export const getHero    = () => fetch(`${BASE}/hero`).then(json);
export const updateHero = (d) => put(`${BASE}/hero`, d);

// Videos
export const getVideos      = ()      => fetch(`${BASE}/videos`).then(json);
export const createVideo    = (d)     => post(`${BASE}/videos`, d);
export const updateVideo    = (id, d) => put(`${BASE}/videos/${id}`, d);
export const deleteVideo    = (id)    => del(`${BASE}/videos/${id}`);
export const uploadThumb    = (id, file) => {
  const form = new FormData();
  form.append('thumb', file);
  return fetch(`${BASE}/videos/${id}/thumb`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};

// Sidebar
export const getSidebar    = ()  => fetch(`${BASE}/sidebar`).then(json);
export const updateSidebar = (d) => put(`${BASE}/sidebar`, d);
