const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/methodology`;

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

export const getAllMethodologyData    = ()          => req('GET',    `${BASE}/all`);
export const getMethodologyHero      = ()          => req('GET',    `${BASE}/hero`);
export const saveMethodologyHero     = (body)      => req('PUT',    `${BASE}/hero`, body);
export const getMethodologyFrameworks = ()         => req('GET',    `${BASE}/frameworks`);
export const createMethodologyFramework = (body)   => req('POST',   `${BASE}/frameworks`, body);
export const updateMethodologyFramework = (id, b)  => req('PUT',    `${BASE}/frameworks/${id}`, b);
export const deleteMethodologyFramework = (id)     => req('DELETE', `${BASE}/frameworks/${id}`);
export const getMethodologySection   = (key)       => req('GET',    `${BASE}/section/${key}`);
export const saveMethodologySection  = (key, body) => req('PUT',    `${BASE}/section/${key}`, body);

async function upload(url, fieldName, file) {
  const token = localStorage.getItem('vk_admin_token');
  const form = new FormData();
  form.append(fieldName, file);
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const uploadFrameworkGraphic = (id, file) =>
  upload(`${BASE}/frameworks/${id}/graphic`, 'graphic', file);

export const uploadExplainerImage = (file) =>
  upload(`${BASE}/section/explainer/image`, 'image', file);
