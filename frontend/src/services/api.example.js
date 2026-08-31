/**
 * FUTURE API SERVICE LAYER
 * 
 * This file shows how to integrate with your Node.js + MySQL backend.
 * Uncomment and customize based on your actual API structure.
 * 
 * Usage in components:
 * 
 * import { getArticles, submitContactForm } from '../services/api';
 * 
 * useEffect(() => {
 *   getArticles().then(setArticles).catch(handleError);
 * }, []);
 */

// Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// =========================
// ARTICLE ENDPOINTS
// =========================

/**
 * Get all articles
 * @returns {Promise<Array>} Array of articles
 */
export const getArticles = async () => {
  try {
    const response = await fetch(`${API_URL}/articles`);
    if (!response.ok) throw new Error('Failed to fetch articles');
    return await response.json();
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
};

/**
 * Get single article by slug
 * @param {string} slug - Article slug
 * @returns {Promise<Object>} Article object
 */
export const getArticleBySlug = async (slug) => {
  try {
    const response = await fetch(`${API_URL}/articles/${slug}`);
    if (!response.ok) throw new Error('Article not found');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching article ${slug}:`, error);
    throw error;
  }
};

// =========================
// THEME ENDPOINTS
// =========================

/**
 * Get all themes
 * @returns {Promise<Array>} Array of themes
 */
export const getThemes = async () => {
  try {
    const response = await fetch(`${API_URL}/themes`);
    if (!response.ok) throw new Error('Failed to fetch themes');
    return await response.json();
  } catch (error) {
    console.error('Error fetching themes:', error);
    throw error;
  }
};

// =========================
// TALK/EVENT ENDPOINTS
// =========================

/**
 * Get all talks
 * @returns {Promise<Array>} Array of talks
 */
export const getTalks = async () => {
  try {
    const response = await fetch(`${API_URL}/talks`);
    if (!response.ok) throw new Error('Failed to fetch talks');
    return await response.json();
  } catch (error) {
    console.error('Error fetching talks:', error);
    throw error;
  }
};

// =========================
// CONTACT FORM
// =========================

/**
 * Submit contact form
 * @param {Object} formData - Form data {name, email, message}
 * @returns {Promise<Object>} Submission confirmation
 */
export const submitContactForm = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/contact/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    if (!response.ok) throw new Error('Failed to submit form');
    return await response.json();
  } catch (error) {
    console.error('Error submitting contact form:', error);
    throw error;
  }
};

// =========================
// UTILITY FUNCTIONS
// =========================

/**
 * Fetch with error handling
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export const apiCall = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

/**
 * Set up in .env.local file:
 * 
 * # Development
 * REACT_APP_API_URL=http://localhost:3001/api
 * 
 * # Production
 * REACT_APP_API_URL=https://api.yourdomain.com/api
 */
