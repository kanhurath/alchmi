import { authHeaders } from './apiUtils.js';
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/navigation`;

async function json(res) {
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
const put  = (url, data) => fetch(url, { method: 'PUT',    headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(data) }).then(json);
const post = (url, data) => fetch(url, { method: 'POST',   headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(data) }).then(json);
const del  = (url)       => fetch(url, { method: 'DELETE', headers: authHeaders() }).then(json);

export const getNav       = ()          => fetch(BASE).then(json);
export const createItem   = (data)      => post(BASE, data);
export const updateItem   = (id, data)  => put(`${BASE}/${id}`, data);
export const deleteItem   = (id)        => del(`${BASE}/${id}`);
export const reorderItems = (items)     => put(`${BASE}/reorder`, { items });
