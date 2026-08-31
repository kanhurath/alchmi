/**
 * Returns Authorization header object if an admin token is stored.
 * Used by all admin API service files for mutation requests (POST, PUT, DELETE).
 */
export function authHeaders() {
  const token = localStorage.getItem('vk_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Shared JSON response handler with error throwing.
 */
export async function handleJson(res) {
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

// Server origin — baked in at build time from VITE_SERVER_URL.
// Production build: http://localhost:3001  (from .env)
// Local dev build:  http://localhost:3001       (from .env.development.local)
const SERVER_ORIGIN = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

/**
 * Resolve a server-uploaded file path to a full absolute URL.
 * Relative paths (/uploads/...) are prefixed with the server origin so the
 * rendered <img src> is always an explicit http://localhost:3001/uploads/...
 * External URLs (starting with http) are returned unchanged.
 */
export function uploadUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SERVER_ORIGIN}${path}`;
}
