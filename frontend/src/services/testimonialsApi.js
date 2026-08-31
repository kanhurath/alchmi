const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/testimonials`;

async function json(res) {
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

const put  = (url, d) => fetch(url, { method: 'PUT',    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then(json);
const post = (url, d) => fetch(url, { method: 'POST',   headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then(json);
const del  = (url)    => fetch(url, { method: 'DELETE' }).then(json);

export const getTestimonialsData = () => fetch(BASE).then(json);

export const getHero    = () => fetch(`${BASE}/hero`).then(json);
export const updateHero = (d) => put(`${BASE}/hero`, d);

export const getFilters    = ()      => fetch(`${BASE}/filters`).then(json);
export const createFilter  = (d)     => post(`${BASE}/filters`, d);
export const updateFilter  = (id, d) => put(`${BASE}/filters/${id}`, d);
export const deleteFilter  = (id)    => del(`${BASE}/filters/${id}`);

export const getFeatured    = ()  => fetch(`${BASE}/featured`).then(json);
export const updateFeatured = (d) => put(`${BASE}/featured`, d);

export const getCards    = ()      => fetch(`${BASE}/cards`).then(json);
export const createCard  = (d)     => post(`${BASE}/cards`, d);
export const updateCard  = (id, d) => put(`${BASE}/cards/${id}`, d);
export const deleteCard  = (id)    => del(`${BASE}/cards/${id}`);

export const getStats    = ()      => fetch(`${BASE}/stats`).then(json);
export const createStat  = (d)     => post(`${BASE}/stats`, d);
export const updateStat  = (id, d) => put(`${BASE}/stats/${id}`, d);
export const deleteStat  = (id)    => del(`${BASE}/stats/${id}`);

export const getPullQuotes    = ()      => fetch(`${BASE}/pull-quotes`).then(json);
export const createPullQuote  = (d)     => post(`${BASE}/pull-quotes`, d);
export const updatePullQuote  = (id, d) => put(`${BASE}/pull-quotes/${id}`, d);
export const deletePullQuote  = (id)    => del(`${BASE}/pull-quotes/${id}`);
