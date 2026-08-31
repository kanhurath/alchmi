const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/services`;

function authHeaders() {
  const token = localStorage.getItem('vk_admin_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Public ────────────────────────────────────────────────────────────────────
export const getAllServicesData = ()      => req('GET', `${BASE}/all`);
export const getServicesHero   = ()      => req('GET', `${BASE}/hero`);
export const getServicesCards  = ()      => req('GET', `${BASE}/cards`);
export const getServicesSection = (key)  => req('GET', `${BASE}/section/${key}`);

// ── Admin ─────────────────────────────────────────────────────────────────────
export const saveServicesHero    = (body)     => req('PUT',    `${BASE}/hero`,    body);
export const createServicesCard  = (body)     => req('POST',   `${BASE}/cards`,   body);
export const updateServicesCard  = (id, body) => req('PUT',    `${BASE}/cards/${id}`, body);
export const deleteServicesCard  = (id)       => req('DELETE', `${BASE}/cards/${id}`);
export const reorderServicesCards = (items)   => req('PUT',    `${BASE}/cards/reorder`, { items });
export const saveServicesSection  = (key, body) => req('PUT',  `${BASE}/section/${key}`, body);

export async function uploadSectionGraphic(key, file) {
  const token = localStorage.getItem('vk_admin_token');
  const form = new FormData();
  form.append('graphic', file);
  const res = await fetch(`${BASE}/section/${key}/graphic`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function uploadServiceCardIcon(id, file) {
  const token = localStorage.getItem('vk_admin_token');
  const form = new FormData();
  form.append('icon', file);
  const res = await fetch(`${BASE}/cards/${id}/icon`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
