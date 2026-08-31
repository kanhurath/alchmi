import { authHeaders } from './apiUtils.js';
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/connect`;

async function json(res) {
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

const put  = (url, d) => fetch(url, { method: 'PUT',    headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const post = (url, d) => fetch(url, { method: 'POST',   headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const del  = (url)    => fetch(url, { method: 'DELETE', headers: authHeaders() }).then(json);

export const getConnectData = () => fetch(BASE).then(json);

export const getHero    = () => fetch(`${BASE}/hero`).then(json);
export const updateHero = (d) => put(`${BASE}/hero`, d);

export const getSection    = ()  => fetch(`${BASE}/section`).then(json);
export const updateSection = (d) => put(`${BASE}/section`, d);

export const getLinks    = ()      => fetch(`${BASE}/links`).then(json);
export const createLink  = (d)     => post(`${BASE}/links`, d);
export const updateLink  = (id, d) => put(`${BASE}/links/${id}`, d);
export const deleteLink  = (id)    => del(`${BASE}/links/${id}`);
