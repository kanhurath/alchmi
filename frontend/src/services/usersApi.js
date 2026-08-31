const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users`;

function authHeaders() {
  const token = localStorage.getItem('vk_admin_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
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

export const listUsers       = ()           => req('GET',  BASE);
export const getUser         = (id)         => req('GET',  `${BASE}/${id}`);
export const createUser      = (body)       => req('POST', BASE, body);
export const updateUser      = (id, body)   => req('PUT',  `${BASE}/${id}`, body);
export const deleteUser      = (id)         => req('DELETE', `${BASE}/${id}`);
export const getPermissions  = (id)         => req('GET',  `${BASE}/${id}/permissions`);
export const savePermissions = (id, perms)  => req('PUT',  `${BASE}/${id}/permissions`, { permissions: perms });
export const changePassword  = (id, password) => req('PUT', `${BASE}/${id}/password`, { password });
