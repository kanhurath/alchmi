# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build → dist/
npm run preview   # Serve the production build locally
npm run lint      # ESLint (JS/JSX only, no TypeScript)
```

No test suite is configured.

## Architecture

Personal portfolio site for Vinay Kulkarni — React 19, React Router v7, Vite 8, plain JavaScript (no TypeScript).

### Data layer

`src/data/contentConfig.js` is the **single source of truth** for all site content (articles, themes, talks, navigation links, hero copy, etc.). All components import from here. The file includes comments indicating it will later be replaced with API calls to a Node.js + MySQL backend; `src/services/api.example.js` is the template for that future integration.

### Routing

`App.jsx` defines all routes via React Router `<Routes>`:

| Path | Page |
|---|---|
| `/` | `HomePage` |
| `/about` | `AboutPage` |
| `/articles`, `/articles/:slug` | `ArticlesPage` |
| `/themes` | `ThemesPage` |
| `/talks` | `TalksPage` |
| `/connect` | `ConnectPage` |

`Header` and `Footer` wrap all routes. A `PageLoader` (2-second timer) overlays on first mount.

### Component layers

- `src/components/Layout/` — `Header` (sticky nav with scroll-shrink, hamburger mobile menu with backdrop/body-scroll-lock/Escape-key), `Footer`
- `src/components/Sections/` — one component per content block (`HeroSection`, `MarqueeStrip`, `AboutSection`, `ArticlesSection`, `ThemesSection`, `QuoteSection`, `TalksSection`, `ConnectSection`)
- `src/components/UI/` — `PageLoader`
- `src/pages/` — thin route-level shells that assemble sections; `HomePage` composes all eight section components in order

### Scroll-reveal animation

`src/hooks/useReveal.js` registers an `IntersectionObserver` (threshold 0.12) that adds `.visible` to any element with class `reveal`. The CSS for `.reveal` / `.reveal.visible` lives in `src/styles/globals.css`. Staggered delays use `reveal-delay-1/2/3`. Call `useReveal()` at the top of any page that needs it (currently only `HomePage`).

### Design system

All CSS custom properties are declared in `src/styles/globals.css`:

| Token | Value |
|---|---|
| `--ink` | `#1a1208` (near-black) |
| `--cream` / `--parchment` | page/section backgrounds |
| `--saffron` | `#d4670a` (accent labels) |
| `--gold` / `--gold-light` | headings, decorative |
| `--deep-red` | `#8b1a1a` |

Typography: `Cormorant Garamond` (body/headings), `Josefin Sans` (labels/nav), `Noto Serif Devanagari` (Sanskrit text). Shared section primitives `.section-label` and `.section-title` are defined globally.

Each component has a co-located `.css` file (e.g., `Header.jsx` → `Header.css`).

### HeroSection canvas

`HeroSection` renders an animated canvas (`kundalini-canvas`) with chakra nodes, particle effects, a Shiva/Shakti yantra overlay, and a pulsing OM glyph. The animation loop uses `requestAnimationFrame` and is cleaned up on unmount. All drawing is done in vanilla Canvas 2D — no external animation library.
