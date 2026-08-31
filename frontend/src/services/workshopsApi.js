import { authHeaders } from './apiUtils.js';
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/workshops`;

async function json(res) {
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

const put  = (url, d) => fetch(url, { method: 'PUT',    headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const post = (url, d) => fetch(url, { method: 'POST',   headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(d) }).then(json);
const del  = (url)    => fetch(url, { method: 'DELETE', headers: authHeaders() }).then(json);

// All sections in one request (used by the public page)
export const getWorkshopsData = () => fetch(BASE).then(json);

// Hero
export const getHero    = () => fetch(`${BASE}/hero`).then(json);
export const updateHero = (d) => put(`${BASE}/hero`, d);

// Intro band
export const getIntro    = () => fetch(`${BASE}/intro`).then(json);
export const updateIntro = (d) => put(`${BASE}/intro`, d);

// Filter buttons
export const getFilters    = ()      => fetch(`${BASE}/filters`).then(json);
export const createFilter  = (d)     => post(`${BASE}/filters`, d);
export const updateFilter  = (id, d) => put(`${BASE}/filters/${id}`, d);
export const deleteFilter  = (id)    => del(`${BASE}/filters/${id}`);

// Workshop program cards
export const getCards    = ()      => fetch(`${BASE}/cards`).then(json);
export const createCard  = (d)     => post(`${BASE}/cards`, d);
export const updateCard  = (id, d) => put(`${BASE}/cards/${id}`, d);
export const deleteCard  = (id)    => del(`${BASE}/cards/${id}`);

// Residential retreats
export const getRetreats    = ()      => fetch(`${BASE}/retreats`).then(json);
export const createRetreat  = (d)     => post(`${BASE}/retreats`, d);
export const updateRetreat  = (id, d) => put(`${BASE}/retreats/${id}`, d);
export const deleteRetreat  = (id)    => del(`${BASE}/retreats/${id}`);

// Testimonials
export const getTestimonials    = ()      => fetch(`${BASE}/testimonials`).then(json);
export const createTestimonial  = (d)     => post(`${BASE}/testimonials`, d);
export const updateTestimonial  = (id, d) => put(`${BASE}/testimonials/${id}`, d);
export const deleteTestimonial  = (id)    => del(`${BASE}/testimonials/${id}`);
