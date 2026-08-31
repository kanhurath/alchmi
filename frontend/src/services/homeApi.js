import { authHeaders } from './apiUtils.js';
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/home`;

async function json(res) {
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
const put  = (url, data) => fetch(url, { method: 'PUT',    headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(data) }).then(json);
const post = (url, data) => fetch(url, { method: 'POST',   headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(data) }).then(json);
const del  = (url)       => fetch(url, { method: 'DELETE', headers: authHeaders() }).then(json);

export const getAllHome = () => fetch(`${BASE}/all`).then(json);

// Hero
export const updateHero = (data) => put(`${BASE}/hero`, data);

function heroImageUpload(endpoint, file) {
  const form = new FormData(); form.append('image', file);
  return fetch(`${BASE}/${endpoint}`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
}
export const uploadHeroBg           = (file) => heroImageUpload('hero/bg-image',            file);
export const uploadHeroBgMob        = (file) => heroImageUpload('hero/bg-image-mob',        file);
export const uploadHeroAnimImg      = (file) => heroImageUpload('hero/animation-image',     file);
export const uploadHeroAnimImgMob   = (file) => heroImageUpload('hero/animation-image-mob', file);
export const uploadHeroPortrait     = (file) => heroImageUpload('hero/portrait',            file);
export const uploadHeroPortraitMob  = (file) => heroImageUpload('hero/portrait-mob',        file);

// Marquee
export const addMarqueeItem    = (data)       => post(`${BASE}/marquee`, data);
export const updateMarqueeItem = (id, data)   => put(`${BASE}/marquee/${id}`, data);
export const deleteMarqueeItem = (id)         => del(`${BASE}/marquee/${id}`);
export const getMarqueeStyle   = ()           => fetch(`${BASE}/marquee/style`).then(json);
export const updateMarqueeStyle = (data)      => put(`${BASE}/marquee/style`, data);

// About
export const updateAbout   = (data) => put(`${BASE}/about`, data);
export const addAboutTag   = (data) => post(`${BASE}/about/tags`, data);
export const deleteAboutTag = (id)  => del(`${BASE}/about/tags/${id}`);
export const uploadAboutMedia = (file) => {
  const form = new FormData(); form.append('media', file);
  return fetch(`${BASE}/about/media`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};
export const uploadJourneyPdf = (file) => {
  const form = new FormData(); form.append('pdf', file);
  return fetch(`${BASE}/about/journey-pdf`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};

// Articles
export const addArticle    = (data)     => post(`${BASE}/articles`, data);
export const updateArticle = (id, data) => put(`${BASE}/articles/${id}`, data);
export const deleteArticle = (id)       => del(`${BASE}/articles/${id}`);
export const uploadArticleImage = (id, file) => {
  const form = new FormData(); form.append('image', file);
  return fetch(`${BASE}/articles/${id}/image`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};

// Themes
export const addTheme    = (data)     => post(`${BASE}/themes`, data);
export const updateTheme = (id, data) => put(`${BASE}/themes/${id}`, data);
export const deleteTheme = (id)       => del(`${BASE}/themes/${id}`);
export const uploadThemeIcon = (id, file) => {
  const form = new FormData(); form.append('icon', file);
  return fetch(`${BASE}/themes/${id}/icon`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};

// Quote
export const updateQuote = (data) => put(`${BASE}/quote`, data);
export const uploadQuoteMark    = (file) => { const form = new FormData(); form.append('image', file); return fetch(`${BASE}/quote/upload/quote-mark`, { method: 'POST', headers: authHeaders(), body: form }).then(json); };
export const uploadQuoteOrnament = (file) => { const form = new FormData(); form.append('image', file); return fetch(`${BASE}/quote/upload/ornament`,   { method: 'POST', headers: authHeaders(), body: form }).then(json); };
export const uploadQuoteBg       = (file) => { const form = new FormData(); form.append('image', file); return fetch(`${BASE}/quote/upload/bg-image`,   { method: 'POST', headers: authHeaders(), body: form }).then(json); };

// Talks
export const addTalk    = (data)     => post(`${BASE}/talks`, data);
export const updateTalk = (id, data) => put(`${BASE}/talks/${id}`, data);
export const deleteTalk = (id)       => del(`${BASE}/talks/${id}`);
export const uploadTalkThumb = (id, file) => {
  const form = new FormData(); form.append('thumb', file);
  return fetch(`${BASE}/talks/${id}/thumb`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};

// What We Do
export const getWhatWeDo           = ()           => fetch(`${BASE}/whatwedo`).then(json);
export const updateWhatWeDo        = (data)        => put(`${BASE}/whatwedo`, data);
export const addWhatWeDoCard       = (data)        => post(`${BASE}/whatwedo/cards`, data);
export const updateWhatWeDoCard    = (id, data)    => put(`${BASE}/whatwedo/cards/${id}`, data);
export const deleteWhatWeDoCard    = (id)          => del(`${BASE}/whatwedo/cards/${id}`);
export const uploadWhatWeDoIcon    = (id, file) => {
  const form = new FormData(); form.append('icon', file);
  return fetch(`${BASE}/whatwedo/cards/${id}/icon`, { method: 'POST', headers: authHeaders(), body: form }).then(json);
};

// Connect
export const updateConnect      = (data)     => put(`${BASE}/connect`, data);
export const addConnectLink     = (data)     => post(`${BASE}/connect/links`, data);
export const updateConnectLink  = (id, data) => put(`${BASE}/connect/links/${id}`, data);
export const deleteConnectLink  = (id)       => del(`${BASE}/connect/links/${id}`);
