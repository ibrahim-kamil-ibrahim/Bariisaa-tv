import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useAuthStore } from './store/authStore';
import theme from './theme';
import Layout from './components/Layout';
import BooksPage from './pages/books/BooksPage';
import BookFormPage from './pages/books/BookFormPage';
import BookDetailPage from './pages/books/BookDetailPage';
import UsersPage from './pages/users/UsersPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import AuthorsPage from './pages/authors/AuthorsPage';
import PlansPage from './pages/subscriptions/PlansPage';
import CouponsPage from './pages/subscriptions/CouponsPage';
import ReportsPage from './pages/reports/ReportsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import RolesPage from './pages/roles/RolesPage';
import AuditLogsPage from './pages/audit/AuditLogsPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import SettingsPage from './pages/settings/SettingsPage';
import StorytellingPage from './pages/storytelling/StorytellingPage';
import MusicPage from './pages/music/MusicPage';
import MyDoctorPage from './pages/my-doctor/MyDoctorPage';
import MyCaptainPage from './pages/my-captain/MyCaptainPage';
import HabitsPage from './pages/habits/HabitsPage';
import DashboardV2Page from './pages/dashboard-v2/DashboardV2Page';
import CmsPage from './pages/cms/CmsPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import BackupsPage from './pages/backups/BackupsPage';
import NotFoundPage from './pages/notFound/NotFoundPage';

import { AuthLayout } from './auth/components/AuthLayout';
import { AuthLoginPage } from './auth/pages/LoginPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const APP_NAME = 'Bariisaa Tv';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Admin auth — only login */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<AuthLoginPage />} />
        </Route>

        {/* Admin pages (MUI) — protected */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardV2Page />} />
          <Route path="dashboard-v2" element={<DashboardV2Page />} />
          <Route path="cms" element={<CmsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="backups" element={<BackupsPage />} />
          <Route path="books" element={<BooksPage />} />
          <Route path="books/new" element={<BookFormPage />} />
          <Route path="books/:id" element={<BookDetailPage />} />
          <Route path="books/:id/edit" element={<BookFormPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="authors" element={<AuthorsPage />} />
          <Route path="subscriptions" element={<PlansPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="storytelling" element={<StorytellingPage />} />
          <Route path="music" element={<MusicPage />} />
          <Route path="my-doctor" element={<MyDoctorPage />} />
          <Route path="my-captain" element={<MyCaptainPage />} />
          <Route path="habits" element={<HabitsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
}
