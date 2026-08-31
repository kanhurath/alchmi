import { authHeaders } from './apiUtils.js';
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/teaching`;

async function json(res) {
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

const put  = (url, d) => fetch(url, { method: 'PUT',    headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const post = (url, d) => fetch(url, { method: 'POST',   headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const del  = (url)    => fetch(url, { method: 'DELETE', headers: authHeaders() }).then(json);

// All sections in one request (used by the public page)
export const getTeachingData = () => fetch(BASE).then(json);

// Hero
export const getHero    = () => fetch(`${BASE}/hero`).then(json);
export const updateHero = (d) => put(`${BASE}/hero`, d);

// Stats band
export const getStats    = () => fetch(`${BASE}/stats`).then(json);
export const createStat  = (d)      => post(`${BASE}/stats`, d);
export const updateStat  = (id, d)  => put(`${BASE}/stats/${id}`, d);
export const deleteStat  = (id)     => del(`${BASE}/stats/${id}`);

// Teaching history
export const getHistory    = () => fetch(`${BASE}/history`).then(json);
export const createHistory = (d)     => post(`${BASE}/history`, d);
export const updateHistory = (id, d) => put(`${BASE}/history/${id}`, d);
export const deleteHistory = (id)    => del(`${BASE}/history/${id}`);

// Course reports
export const getCourses    = () => fetch(`${BASE}/courses`).then(json);
export const createCourse  = (d)     => post(`${BASE}/courses`, d);
export const updateCourse  = (id, d) => put(`${BASE}/courses/${id}`, d);
export const deleteCourse  = (id)    => del(`${BASE}/courses/${id}`);

// Student feedback
export const getFeedback    = () => fetch(`${BASE}/feedback`).then(json);
export const createFeedback = (d)     => post(`${BASE}/feedback`, d);
export const updateFeedback = (id, d) => put(`${BASE}/feedback/${id}`, d);
export const deleteFeedback = (id)    => del(`${BASE}/feedback/${id}`);

// Core themes
export const getThemes    = () => fetch(`${BASE}/themes`).then(json);
export const createTheme  = (d)     => post(`${BASE}/themes`, d);
export const updateTheme  = (id, d) => put(`${BASE}/themes/${id}`, d);
export const deleteTheme  = (id)    => del(`${BASE}/themes/${id}`);
