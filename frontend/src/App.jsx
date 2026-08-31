import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { BookingModalProvider } from './context/BookingModalContext';
import { PageStatusProvider, usePageStatuses } from './context/PageStatusContext';
import { SectionStylesProvider } from './context/SectionStylesContext';
import { useGlobalCustomizer } from './hooks/useGlobalCustomizer';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import BookingModal from './components/UI/BookingModal';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ArticlesPage from './pages/ArticlesPage';
import ArticleSinglePage from './pages/ArticleSinglePage';
import ThemesPage from './pages/ThemesPage';
import TalksPage from './pages/TalksPage';
import ConnectPage from './pages/ConnectPage';
import BiographyPage from './pages/BiographyPage';
import EventsPage from './pages/EventsPage';
import NewsPage   from './pages/NewsPage';
import GalleryPage from './pages/GalleryPage';
import WorkshopsPage from './pages/WorkshopsPage';
import ServicesPage     from './pages/ServicesPage';
import MethodologyPage  from './pages/MethodologyPage';
import TeachingPage from './pages/TeachingPage';
import TestimonialsPage from './pages/TestimonialsPage';
import AdminApp    from './pages/admin/AdminApp';
import DynamicPage from './pages/DynamicPage';
import PageLoader from './components/UI/PageLoader';
import ScrollToTop from './components/UI/ScrollToTop';
import './styles/globals.css';
import './App.css';

// ── Draft gate — shown to visitors when a CMS page is set to Draft ────────────
function DraftNotice() {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '1rem', textAlign: 'center', padding: '2rem',
    }}>
      <div style={{ fontSize: '2.5rem', opacity: 0.18 }}>◎</div>
      <p style={{
        fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.82rem',
        letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8b7355',
      }}>
        This page is not yet published.
      </p>
      <Link to="/" style={{
        fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.7rem',
        letterSpacing: '0.15em', color: '#de7336', textDecoration: 'none',
      }}>
        ← Back to Home
      </Link>
    </div>
  );
}

// Wraps a CMS page: renders children when published, DraftNotice when draft.
// While statuses are still loading the page renders normally (avoids flash).
function PageGate({ slug, children }) {
  const { statuses, loading } = usePageStatuses();
  if (!loading && statuses[slug] === 'draft') return <DraftNotice />;
  return children;
}

function SiteShell({ isLoading, loaderSettings }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
      {isLoading && !isAdmin && <PageLoader settings={loaderSettings} />}
      {!isAdmin && <Header />}
      <Routes>
        <Route path="/"    element={<PageGate slug="home"><HomePage /></PageGate>} />
        <Route path="/about"    element={<AboutPage />} />
        <Route path="/services"     element={<PageGate slug="services"><ServicesPage /></PageGate>} />
        <Route path="/methodology"  element={<PageGate slug="methodology"><MethodologyPage /></PageGate>} />
        <Route path="/articles"       element={<ArticlesPage />} />
        <Route path="/articles/:slug" element={<ArticleSinglePage />} />
        <Route path="/themes"  element={<ThemesPage />} />
        <Route path="/teaching"    element={<PageGate slug="teaching"><TeachingPage /></PageGate>} />
        <Route path="/videos"      element={<PageGate slug="videos"><TalksPage /></PageGate>} />
        <Route path="/connect"     element={<PageGate slug="connect"><ConnectPage /></PageGate>} />
        <Route path="/biography"   element={<PageGate slug="biography"><BiographyPage /></PageGate>} />
        <Route path="/events"      element={<PageGate slug="events"><EventsPage /></PageGate>} />
        <Route path="/news"        element={<PageGate slug="news"><NewsPage /></PageGate>} />
        <Route path="/gallery"     element={<PageGate slug="gallery"><GalleryPage /></PageGate>} />
        <Route path="/workshops"   element={<PageGate slug="workshops"><WorkshopsPage /></PageGate>} />
        <Route path="/testimonials" element={<PageGate slug="testimonials"><TestimonialsPage /></PageGate>} />
        <Route path="/admin/*"     element={<AdminApp />} />
        <Route path="/:slug"       element={<DynamicPage />} />
      </Routes>
      {!isAdmin && <Footer />}
      {!isAdmin && <BookingModal />}
    </>
  );
}

function App() {
  const { loaderSettings } = useGlobalCustomizer();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SectionStylesProvider>
      <BookingModalProvider>
        <PageStatusProvider>
          <Router>
            <SiteShell isLoading={isLoading} loaderSettings={loaderSettings} />
          </Router>
        </PageStatusProvider>
      </BookingModalProvider>
    </SectionStylesProvider>
  );
}

export default App;
