const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const BASE = `${API_ROOT}/articles`;

export function resolveUploadUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return API_ROOT.replace(/\/api$/, '') + url;
}

function authHeaders() {
  const token = localStorage.getItem('vk_admin_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
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
export const getArticles    = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return req('GET', `${BASE}${qs ? '?' + qs : ''}`);
};

export const getCategories  = ()     => req('GET', `${BASE}/categories`);
export const getArticle     = (slug) => req('GET', `${BASE}/${slug}`);

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAllArticles  = ()          => req('GET',    `${BASE}/admin/all`);
export const createArticle  = (body)      => req('POST',   BASE, body);
export const updateArticle  = (id, body)  => req('PUT',    `${BASE}/${id}`, body);
export const deleteArticle  = (id)        => req('DELETE', `${BASE}/${id}`);
export const reorderArticles= (items)     => req('PUT',    `${BASE}/reorder`, { items });
export const getArticleById = (id)        => req('GET',    `${BASE}/by-id/${id}`);

export const getAllCategories  = ()          => req('GET',    `${BASE}/categories/all`);
export const createCategory    = (body)      => req('POST',   `${BASE}/categories`, body);
export const updateCategory    = (id, body)  => req('PUT',    `${BASE}/categories/${id}`, body);
export const deleteCategory    = (id)        => req('DELETE', `${BASE}/categories/${id}`);

// ── Hero ──────────────────────────────────────────────────────────────────────
export const getArticlesHero  = ()     => req('GET', `${BASE}/hero`);
export const saveArticlesHero = (body) => req('PUT', `${BASE}/hero`, body);

// Returns the absolute URL for inline images uploaded via CKEditor
export function getInlineImageUploadUrl() {
  return `${BASE}/upload-image`;
}

export async function uploadArticleImage(id, file) {
  const token = localStorage.getItem('vk_admin_token');
  const body = new FormData();
  body.append('image', file);
  const res = await fetch(`${BASE}/${id}/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Likes ─────────────────────────────────────────────────────────────────────
export const getLikes     = (id, userToken) =>
  req('GET', `${BASE}/${id}/likes${userToken ? '?token=' + encodeURIComponent(userToken) : ''}`);

export const toggleLike   = (id, userToken) =>
  req('POST', `${BASE}/${id}/like`, { token: userToken });

// ── Comments ──────────────────────────────────────────────────────────────────
export const getComments  = (id) => req('GET', `${BASE}/${id}/comments`);

export const postComment  = (id, body) => req('POST', `${BASE}/${id}/comments`, body);

export async function uploadCommentImage(articleId, file) {
  const body = new FormData();
  body.append('image', file);
  const res = await fetch(`${BASE}/${articleId}/comments/image`, { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Admin: comments ───────────────────────────────────────────────────────────
export const getAdminComments        = (status = '') =>
  req('GET', `${BASE}/admin/comments${status ? '?status=' + status : ''}`);

export const getAdminArticleComments = (articleId) =>
  req('GET', `${BASE}/admin/${articleId}/comments`);

export const postAdminComment        = (articleId, body) =>
  req('POST', `${BASE}/admin/${articleId}/comments`, body);

export const updateAdminComment      = (cid, body) =>
  req('PUT', `${BASE}/admin/comments/${cid}`, body);

// kept for backward compat
export const updateCommentStatus     = (cid, status) =>
  req('PUT', `${BASE}/admin/comments/${cid}`, { status });

export const deleteComment           = (cid) =>
  req('DELETE', `${BASE}/admin/comments/${cid}`);

// ── Admin: likes ──────────────────────────────────────────────────────────────
export const getAdminLikeStats  = () =>
  req('GET', `${BASE}/admin/likes`);

export const adminToggleLike    = (articleId) =>
  req('POST', `${BASE}/admin/${articleId}/like`);

export const setAdminLikeCount  = (articleId, totalLikes) =>
  req('PUT', `${BASE}/admin/${articleId}/likes`, { total_likes: totalLikes });

// ── Admin: comment image upload (auth-gated) ──────────────────────────────────
export async function uploadAdminCommentImage(articleId, file) {
  const token = localStorage.getItem('vk_admin_token');
  const body = new FormData();
  body.append('image', file);
  const res = await fetch(`${BASE}/admin/${articleId}/comments/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
