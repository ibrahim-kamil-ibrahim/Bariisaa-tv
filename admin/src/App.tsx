import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Button, Card, Typography } from '@mui/material';
import { useAuthStore, hasRole, ADMIN_ROLES, EDITOR_ROLES, MODERATOR_ROLES, PANEL_ROLES } from './store/authStore';
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
import AdminsPage from './pages/admins/AdminsPage';
import MediaManagerPage from './pages/media/MediaManagerPage';
import NotFoundPage from './pages/notFound/NotFoundPage';

import { AuthLayout } from './auth/components/AuthLayout';
import { AuthLoginPage } from './auth/pages/LoginPage';

function NotAuthorizedScreen() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Card elevation={0} sx={{ p: 4, textAlign: 'center', maxWidth: 440, width: '100%', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Not authorized
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          You are not authorized to access the admin panel
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Sign out
        </Button>
      </Card>
    </Box>
  );
}

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !hasRole(user, roles)) return <NotAuthorizedScreen />;
  return <>{children}</>;
}

export const APP_NAME = 'Bariisaa Tv';

const protectedChildren = (
  <>
    <Route index element={<DashboardV2Page />} />
    <Route path="dashboard-v2" element={<DashboardV2Page />} />
    <Route
      path="cms"
      element={
        <PrivateRoute roles={EDITOR_ROLES}>
          <CmsPage />
        </PrivateRoute>
      }
    />
    <Route path="invoices" element={<InvoicesPage />} />
    <Route path="backups" element={<BackupsPage />} />
    <Route
      path="books"
      element={
        <PrivateRoute roles={EDITOR_ROLES}>
          <BooksPage />
        </PrivateRoute>
      }
    />
    <Route
      path="books/new"
      element={
        <PrivateRoute roles={EDITOR_ROLES}>
          <BookFormPage />
        </PrivateRoute>
      }
    />
    <Route
      path="books/:id"
      element={
        <PrivateRoute roles={EDITOR_ROLES}>
          <BookDetailPage />
        </PrivateRoute>
      }
    />
    <Route
      path="books/:id/edit"
      element={
        <PrivateRoute roles={EDITOR_ROLES}>
          <BookFormPage />
        </PrivateRoute>
      }
    />
    <Route
      path="users"
      element={
        <PrivateRoute roles={ADMIN_ROLES}>
          <UsersPage />
        </PrivateRoute>
      }
    />
    <Route
      path="admins"
      element={
        <PrivateRoute roles={ADMIN_ROLES}>
          <AdminsPage />
        </PrivateRoute>
      }
    />
    <Route
      path="categories"
      element={
        <PrivateRoute roles={EDITOR_ROLES}>
          <CategoriesPage />
        </PrivateRoute>
      }
    />
    <Route
      path="authors"
      element={
        <PrivateRoute roles={EDITOR_ROLES}>
          <AuthorsPage />
        </PrivateRoute>
      }
    />
    <Route path="subscriptions" element={<PlansPage />} />
    <Route path="coupons" element={<CouponsPage />} />
    <Route
      path="reports"
      element={
        <PrivateRoute roles={MODERATOR_ROLES}>
          <ReportsPage />
        </PrivateRoute>
      }
    />
    <Route path="notifications" element={<NotificationsPage />} />
    <Route path="payments" element={<PaymentsPage />} />
    <Route
      path="roles"
      element={
        <PrivateRoute roles={ADMIN_ROLES}>
          <RolesPage />
        </PrivateRoute>
      }
    />
    <Route
      path="audit-logs"
      element={
        <PrivateRoute roles={ADMIN_ROLES}>
          <AuditLogsPage />
        </PrivateRoute>
      }
    />
    <Route
      path="settings"
      element={
        <PrivateRoute roles={ADMIN_ROLES}>
          <SettingsPage />
        </PrivateRoute>
      }
    />
    <Route
      path="storytelling"
      element={
        <PrivateRoute roles={EDITOR_ROLES}>
          <StorytellingPage />
        </PrivateRoute>
      }
    />
    <Route
      path="music"
      element={
        <PrivateRoute roles={EDITOR_ROLES}>
          <MusicPage />
        </PrivateRoute>
      }
    />
    <Route
      path="my-doctor"
      element={
        <PrivateRoute roles={EDITOR_ROLES}>
          <MyDoctorPage />
        </PrivateRoute>
      }
    />
    <Route
      path="my-captain"
      element={
        <PrivateRoute roles={EDITOR_ROLES}>
          <MyCaptainPage />
        </PrivateRoute>
      }
    />
    <Route
      path="habits"
      element={
        <PrivateRoute roles={EDITOR_ROLES}>
          <HabitsPage />
        </PrivateRoute>
      }
    />
    <Route
      path="media"
      element={
        <PrivateRoute roles={EDITOR_ROLES}>
          <MediaManagerPage />
        </PrivateRoute>
      }
    />
  </>
);

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
          <Route path="/admin/login" element={<AuthLoginPage />} />
        </Route>

        {/* Admin pages (MUI) — protected (mounted at "/" and "/admin") */}
        <Route
          path="/"
          element={
            <PrivateRoute roles={PANEL_ROLES}>
              <Layout />
            </PrivateRoute>
          }
        >
          {protectedChildren}
        </Route>
        <Route
          path="/admin"
          element={
            <PrivateRoute roles={PANEL_ROLES}>
              <Layout />
            </PrivateRoute>
          }
        >
          {protectedChildren}
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
}
