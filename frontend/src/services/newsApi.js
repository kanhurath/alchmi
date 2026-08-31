const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const BASE = `${API_ROOT}/news`;

// Resolve a server-relative upload path (e.g. /uploads/news/x.jpg) to an absolute URL.
// Needed in dev where the frontend (Vite :5173) and uploads (Express :3001) are on different ports.
export function resolveUploadUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return API_ROOT.replace(/\/api$/, '') + url;
}

function authHeaders() {
  const token = localStorage.getItem('vk_admin_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: method === 'GET' ? {} : authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const getNewsData    = ()          => req('GET',  BASE);
export const getHero        = ()          => req('GET',  `${BASE}/hero`);
export const updateHero     = (body)      => req('PUT',  `${BASE}/hero`, body);
export const getArticles    = ()          => req('GET',  `${BASE}/articles`);
export const createArticle  = (body)      => req('POST', `${BASE}/articles`, body);
export const updateArticle  = (id, body)  => req('PUT',  `${BASE}/articles/${id}`, body);
export const deleteArticle  = (id)        => req('DELETE', `${BASE}/articles/${id}`);
export const reorderArticles= (items)     => req('PUT',  `${BASE}/articles/reorder`, { items });
export const getFilters     = ()          => req('GET',  `${BASE}/filters`);
export const createFilter   = (body)      => req('POST', `${BASE}/filters`, body);
export const updateFilter   = (id, body)  => req('PUT',  `${BASE}/filters/${id}`, body);
export const deleteFilter   = (id)        => req('DELETE', `${BASE}/filters/${id}`);
export const getSidebar     = ()          => req('GET',  `${BASE}/sidebar`);
export const updateSidebar  = (key, body) => req('PUT',  `${BASE}/sidebar/${key}`, body);

export async function uploadArticleImage(id, file) {
  const token = localStorage.getItem('vk_admin_token');
  const body = new FormData();
  body.append('image', file);
  const res = await fetch(`${BASE}/articles/${id}/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
