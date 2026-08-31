const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/customizer`;

async function req(method, url, body) {
  const token = localStorage.getItem('vk_admin_token');
  const res   = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const getCustomizer          = ()              => req('GET',  BASE);
export const getCustomizerSection   = (section)       => req('GET',  `${BASE}/${section}`);
export const saveCustomizerSection  = (section, data) => req('PUT',  `${BASE}/${section}`, data);
export const getAdminSettings       = ()              => req('GET',  `${BASE}/admin-settings`);

export async function uploadAdminLogo(file) {
  const token = localStorage.getItem('vk_admin_token');
  const form  = new FormData();
  form.append('logo', file);
  const res = await fetch(`${BASE}/admin-settings/logo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function uploadCustomizerLogo(section, file) {
  const token = localStorage.getItem('vk_admin_token');
  const form  = new FormData();
  form.append('logo', file);
  const res = await fetch(`${BASE}/${section}/logo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function uploadLoaderIcon(file) {
  const token = localStorage.getItem('vk_admin_token');
  const form  = new FormData();
  form.append('icon', file);
  const res = await fetch(`${BASE}/loader/icon`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function uploadInnerHeroImage(endpoint, file) {
  const token = localStorage.getItem('vk_admin_token');
  const form  = new FormData();
  form.append('image', file);
  const res = await fetch(`${BASE}/inner-hero/${endpoint}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function uploadFavicon(file) {
  const token = localStorage.getItem('vk_admin_token');
  const form  = new FormData();
  form.append('favicon', file);
  const res = await fetch(`${BASE}/favicon/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
