# Vinay Kulkarni - React Home Page

Your React portfolio website is now live! 🎉

## Project Overview

This is a modern, scalable React application built from your HTML template with full support for future CMS and backend integration.

## 🚀 Quick Start

```bash
# Development
npm run dev

# Production Build
npm run build

# Preview
npm run preview
```

The app will be available at `http://localhost:5174/`

## 📁 Project Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.jsx (Navigation with mobile menu)
│   │   └── Footer.jsx (Footer with links)
│   ├── Sections/
│   │   ├── HeroSection.jsx
│   │   ├── AboutSection.jsx
│   │   ├── ArticlesSection.jsx
│   │   ├── ThemesSection.jsx
│   │   ├── QuoteSection.jsx
│   │   ├── TalksSection.jsx
│   │   └── ConnectSection.jsx
│   └── UI/
│       └── PageLoader.jsx (Loading animation)
├── pages/
│   ├── HomePage.jsx (Main page with all sections)
│   ├── AboutPage.jsx
│   ├── ArticlesPage.jsx
│   ├── ThemesPage.jsx
│   ├── TalksPage.jsx
│   └── ConnectPage.jsx
├── data/
│   └── contentConfig.js (CMS data layer - editable!)
├── styles/
│   └── globals.css (Global styles & CSS variables)
├── App.jsx (Main app with routing)
└── index.css (Base styles)
```

## 📋 Key Features

- ✅ **Responsive Design** - Mobile, tablet, and desktop layouts
- ✅ **Page Routing** - React Router for multi-page navigation
- ✅ **CMS-Ready** - Content managed in `src/data/contentConfig.js`
- ✅ **Smooth Animations** - Fade-ins and transitions
- ✅ **Mobile Menu** - Hamburger menu with smooth animation
- ✅ **Scroll Effects** - Navigation bar changes on scroll
- ✅ **Modern Design** - Beautiful color scheme and typography

## 🎨 Color Scheme

All colors are defined as CSS variables in `src/index.css`:

```css
--ink: #1a1208           /* Primary text color */
--parchment: #f5edd8    /* Light text */
--cream: #faf6ee        /* Main background */
--saffron: #d4670a      /* Primary accent */
--gold: #b8922a         /* Secondary accent */
--deep-red: #8b1a1a     /* Dark accent */
--warm-gray: #8a7d6b    /* Secondary text */
```

## 🔧 Managing Content

### Edit Content Easily

All website content is managed in **`src/data/contentConfig.js`**:

```javascript
export const hero = {
  title: 'Your Title',
  subtitle: 'Your Subtitle',
  description: 'Your Description',
  ctaText: 'Call to Action Text',
  ctaLink: '#about',
};

export const articles = [
  {
    id: 1,
    title: 'Article Title',
    excerpt: 'Article excerpt...',
    date: '2024-01-15',
    category: 'Category',
    slug: 'article-slug',
  },
  // Add more articles...
];

// Edit themes, talks, contact sections similarly
```

**To update content:**
1. Open `src/data/contentConfig.js`
2. Edit the data objects
3. Save - changes appear automatically in dev mode
4. Build for production: `npm run build`

## 🔗 Navigation Links

Navigation is automatically generated from `contentConfig.js`. Add/remove links here:

```javascript
export const navigationLinks = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'about', label: 'About', path: '/about' },
  // Add more pages as needed
];
```

## 📱 Pages Available

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Full homepage with all sections |
| About | `/about` | Detailed about page |
| Articles | `/articles` | All articles list |
| Single Article | `/articles/:slug` | Article detail page |
| Themes | `/themes` | Core themes/focus areas |
| Talks | `/talks` | Speaking engagements |
| Connect | `/connect` | Contact & social links |

## 🚀 Future Backend Integration

### 1. Replace Content with API Calls

Instead of importing from `contentConfig.js`, fetch from your Node.js + MySQL backend:

```javascript
// In a page component
useEffect(() => {
  const fetchArticles = async () => {
    const response = await fetch('/api/articles');
    const data = await response.json();
    setArticles(data);
  };
  fetchArticles();
}, []);
```

### 2. Setup API Endpoints (Node.js Backend)

```javascript
// Example endpoints your backend should provide:
GET /api/articles           // Get all articles
GET /api/articles/:id       // Get single article
POST /api/contact           // Submit contact form
GET /api/themes             // Get all themes
GET /api/talks              // Get all talks
```

### 3. Create API Service Layer

Create `src/services/api.js`:

```javascript
const API_URL = 'http://your-backend.com/api';

export const getArticles = async () => {
  const response = await fetch(`${API_URL}/articles`);
  return response.json();
};

export const submitContactForm = async (data) => {
  const response = await fetch(`${API_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

// Add more API functions as needed
```

## 🎯 Component Guide

### Header Component
- Fixed navigation that changes appearance on scroll
- Mobile-responsive hamburger menu
- Active link indicators
- CTA button for getting in touch

### Footer Component
- Links to social profiles
- Quick navigation
- Copyright information
- Legal links

### Section Components
Each section is self-contained and receives data from `contentConfig.js`:

```javascript
// Example: Article Section
<ArticlesSection />
// Gets data from: contentConfig.articles
```

## 🛠️ Customization

### Change Colors

Edit CSS variables in `src/index.css`:

```css
:root {
  --saffron: #your-color;
  --gold: #your-color;
  /* etc. */
}
```

### Add New Sections

1. Create component: `src/components/Sections/NewSection.jsx`
2. Create styles: `src/components/Sections/NewSection.css`
3. Add data to `src/data/contentConfig.js`
4. Import and add to HomePage

### Modify Fonts

Fonts are imported in `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=...');
```

Change the font families or add new ones as needed.

## 📦 Dependencies

- **react** (^19.2.6) - UI framework
- **react-dom** (^19.2.6) - DOM utilities
- **react-router-dom** - Multi-page routing
- **vite** - Build tool

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Deploy Options

- **Vercel** - Easiest for React apps
- **Netlify** - Great with React Router
- **GitHub Pages** - Free hosting
- **Custom Server** - Deploy to your own server
- **Node.js Server** - Combine with your backend

## 📝 Next Steps

1. **Update Content** - Edit `src/data/contentConfig.js` with your information
2. **Customize Colors** - Modify CSS variables in `src/index.css`
3. **Add Images** - Place images in `src/assets/` and import them
4. **Setup Backend** - Prepare Node.js + MySQL endpoints
5. **Connect API** - Replace content config with API calls
6. **Deploy** - Build and deploy to your hosting platform

## 💡 Tips for Backend Integration

- Keep your data structure similar to `contentConfig.js` for easy migration
- Use RESTful API conventions for consistency
- Add proper error handling for API calls
- Implement loading states for better UX
- Use environment variables for API endpoints
- Consider pagination for large datasets (articles, etc.)

## 📧 Support & Customization

The codebase is fully commented and follows React best practices. Each component is:
- Modular and reusable
- Well-structured
- Easy to extend
- Ready for API integration

---

**Happy coding! Your scalable, modern portfolio is ready to grow with your backend.** 🚀
