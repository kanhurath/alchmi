import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from '../../context/AdminAuthContext';
import ProtectedRoute   from './ProtectedRoute.jsx';
import AdminLayout      from './AdminLayout.jsx';
import AdminLogin       from './AdminLogin.jsx';
import AdminDashboard   from './AdminDashboard.jsx';
import AdminPages       from './AdminPages.jsx';
import HomeAdmin        from './HomeAdmin.jsx';
import BiographyAdmin   from './BiographyAdmin.jsx';
import TeachingAdmin    from './TeachingAdmin.jsx';
import VideosAdmin      from './VideosAdmin.jsx';
import EventsAdmin      from './EventsAdmin.jsx';
import WorkshopsAdmin      from './WorkshopsAdmin.jsx';
import TestimonialsAdmin  from './TestimonialsAdmin.jsx';
import ConnectAdmin       from './ConnectAdmin.jsx';
import GalleryAdmin       from './GalleryAdmin.jsx';
import NavigationAdmin    from './NavigationAdmin.jsx';
import CustomPagesAdmin  from './CustomPagesAdmin.jsx';
import PageBuilderAdmin  from './PageBuilderAdmin.jsx';
import UsersAdmin              from './UsersAdmin.jsx';
import NewsAdmin               from './NewsAdmin.jsx';
import GlobalCustomizerAdmin  from './GlobalCustomizerAdmin.jsx';
import ArticlesAdmin          from './ArticlesAdmin.jsx';
import ServicesAdmin          from './ServicesAdmin.jsx';
import MethodologyAdmin       from './MethodologyAdmin.jsx';
import WebsiteSettingsAdmin   from './WebsiteSettingsAdmin.jsx';

/**
 * Self-contained admin sub-application mounted at /admin/* in the main Router.
 * Add new page editors by importing them and adding a Route below.
 */
function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        {/* Default → login */}
        <Route index element={<Navigate to="login" replace />} />

        {/* Public */}
        <Route path="login" element={<AdminLogin />} />

        {/* Protected — all share AdminLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard"         element={<AdminDashboard />} />
            <Route path="pages"             element={<AdminPages />} />
            <Route path="pages/home"        element={<HomeAdmin />} />
            <Route path="pages/biography"   element={<BiographyAdmin />} />
            <Route path="pages/teaching"    element={<TeachingAdmin />} />
            <Route path="pages/videos"      element={<VideosAdmin />} />
            <Route path="pages/events"      element={<EventsAdmin />} />
            <Route path="pages/workshops"     element={<WorkshopsAdmin />} />
            <Route path="pages/testimonials" element={<TestimonialsAdmin />} />
            <Route path="pages/connect"      element={<ConnectAdmin />} />
            <Route path="pages/gallery"      element={<GalleryAdmin />} />
            <Route path="navigation"         element={<NavigationAdmin />} />
            <Route path="builder"            element={<CustomPagesAdmin />} />
            <Route path="builder/:id"        element={<PageBuilderAdmin />} />
            <Route path="users"              element={<UsersAdmin />} />
            <Route path="pages/news"         element={<NewsAdmin />} />
            <Route path="pages/articles"     element={<ArticlesAdmin />} />
            <Route path="pages/services"     element={<ServicesAdmin />} />
            <Route path="pages/methodology"  element={<MethodologyAdmin />} />
            <Route path="customizer"         element={<GlobalCustomizerAdmin />} />
            <Route path="website-settings"   element={<WebsiteSettingsAdmin />} />
          </Route>
        </Route>

        {/* Catch-all inside /admin → dashboard */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}

export default AdminApp;
