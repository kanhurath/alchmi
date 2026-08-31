# Backend Integration Guide

This document explains how to connect your React frontend to your Node.js + MySQL backend.

## 🔄 Architecture Overview

```
Frontend (React)  →  API Calls  →  Node.js Backend  →  MySQL Database
   (This App)                        (Coming Soon)       (Coming Soon)
```

## 📊 Expected Data Structure from Backend

### Articles API

**GET `/api/articles`** - Get all articles
```json
[
  {
    "id": 1,
    "title": "The Art of Living",
    "excerpt": "Exploring how ancient philosophies apply to modern life.",
    "content": "Full article content...",
    "date": "2024-01-15",
    "category": "Philosophy",
    "slug": "art-of-living",
    "featured": true
  }
]
```

**GET `/api/articles/:slug`** - Get single article
```json
{
  "id": 1,
  "title": "The Art of Living",
  "excerpt": "...",
  "content": "Full article content...",
  "date": "2024-01-15",
  "category": "Philosophy",
  "slug": "art-of-living",
  "featured": true,
  "relatedArticles": [...]
}
```

### Themes API

**GET `/api/themes`** - Get all themes
```json
[
  {
    "id": 1,
    "title": "Wisdom",
    "description": "Ancient and contemporary wisdom traditions.",
    "icon": "🧘",
    "content": "Detailed description..."
  }
]
```

### Talks API

**GET `/api/talks`** - Get all talks
```json
[
  {
    "id": 1,
    "title": "The Future of Technology",
    "event": "Tech Summit 2024",
    "date": "2024-03-15",
    "location": "Online",
    "description": "Talk description...",
    "registrationUrl": "https://..."
  }
]
```

### Contact Form API

**POST `/api/contact/submit`** - Submit contact form
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Your message here..."
}
```

Response:
```json
{
  "success": true,
  "message": "Thank you for your message!",
  "ticketId": "CONTACT-12345"
}
```

## 🔌 Integration Steps

### Step 1: Copy API Service File

```bash
cp src/services/api.example.js src/services/api.js
```

Then customize it with your actual backend URLs and endpoints.

### Step 2: Update Environment Variables

Create `.env.local` in your project root:

```bash
# .env.local

# Development
REACT_APP_API_URL=http://localhost:3001/api

# Or Production
# REACT_APP_API_URL=https://your-api.com/api
```

### Step 3: Update Components to Use API

**Example: Update ArticlesPage.jsx**

```javascript
import { useEffect, useState } from 'react';
import { getArticles } from '../services/api';

function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const data = await getArticles();
        setArticles(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) return <div>Loading articles...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <main className="articles-page">
      {/* Use articles from API instead of contentConfig */}
      {articles.map((article) => (
        <article key={article.id}>
          <h2>{article.title}</h2>
          <p>{article.excerpt}</p>
        </article>
      ))}
    </main>
  );
}

export default ArticlesPage;
```

### Step 4: Update HomePage to Use Dynamic Data

```javascript
import { useEffect, useState } from 'react';
import { getArticles, getThemes, getTalks } from '../services/api';
import ArticlesSection from '../components/Sections/ArticlesSection';

function HomePage() {
  const [articles, setArticles] = useState([]);
  const [themes, setThemes] = useState([]);
  const [talks, setTalks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesData, themesData, talksData] = await Promise.all([
          getArticles(),
          getThemes(),
          getTalks(),
        ]);
        setArticles(articlesData);
        setThemes(themesData);
        setTalks(talksData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Pass API data to sections
  return (
    <main>
      <ArticlesSection articles={articles} />
      {/* ... other sections ... */}
    </main>
  );
}

export default HomePage;
```

### Step 5: Update Components to Accept Props

Modify your section components to accept data as props:

```javascript
// Before: ArticlesSection.jsx reads from contentConfig
import { articles } from '../../data/contentConfig';

function ArticlesSection() {
  return (
    // uses articles directly
  );
}

// After: ArticlesSection.jsx accepts props
function ArticlesSection({ articles = [] }) {
  return (
    // uses articles from props
  );
}

export default ArticlesSection;
```

## 🔐 CORS Setup (Backend)

Your Node.js backend needs CORS enabled:

```javascript
// In your Node.js backend
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5174',        // Dev
    'https://yourdomain.com',       // Production
  ],
  credentials: true,
}));
```

## 📦 Recommended Node.js Backend Stack

```
Backend Structure:
─ server.js (entry point)
├── routes/
│   ├── articles.js
│   ├── themes.js
│   ├── talks.js
│   └── contact.js
├── controllers/
│   ├── articleController.js
│   ├── themeController.js
│   └── talkController.js
├── models/
│   ├── Article.js
│   ├── Theme.js
│   └── Talk.js
└── config/
    └── db.js
```

### Sample Node.js Endpoint

```javascript
// routes/articles.js
const express = require('express');
const router = express.Router();
const Article = require('../models/Article');

// Get all articles
router.get('/', async (req, res) => {
  try {
    const articles = await Article.findAll();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single article
router.get('/:slug', async (req, res) => {
  try {
    const article = await Article.findBySlug(req.params.slug);
    if (!article) return res.status(404).json({ error: 'Not found' });
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

## 🚀 Migration Checklist

- [ ] Setup Node.js + Express backend
- [ ] Create MySQL database and tables
- [ ] Implement API endpoints for articles
- [ ] Implement API endpoints for themes
- [ ] Implement API endpoints for talks
- [ ] Implement contact form endpoint
- [ ] Setup CORS on backend
- [ ] Create `.env.local` file with API URL
- [ ] Copy and customize `src/services/api.js`
- [ ] Update HomePage to fetch from API
- [ ] Update ArticlesPage to fetch from API
- [ ] Update section components to accept props
- [ ] Test all API calls
- [ ] Deploy backend
- [ ] Deploy frontend with updated API URL

## 🐛 Debugging Tips

### Check Network Requests

Open DevTools (F12) → Network tab:
1. Look for API calls
2. Check response status (should be 200)
3. Verify response data format

### Console Errors

Check browser console (F12 → Console):
- CORS errors? → Update backend CORS settings
- 404 errors? → Verify API endpoints exist
- Empty data? → Check backend data

### Test API Directly

Use curl or Postman:

```bash
# Test API endpoint
curl http://localhost:3001/api/articles

# Test with data
curl -X POST http://localhost:3001/api/contact/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","message":"Hello"}'
```

## 📝 Summary

1. **Current State**: Static content from `contentConfig.js`
2. **Step 1**: Create Node.js backend with API endpoints
3. **Step 2**: Setup database with articles, themes, talks
4. **Step 3**: Copy `api.example.js` → `api.js` and customize
5. **Step 4**: Update components to fetch from API
6. **Step 5**: Deploy both frontend and backend

**Result**: Dynamic, CMS-managed website! 🎉

---

**Questions?** Refer to React documentation or contact your development team.
