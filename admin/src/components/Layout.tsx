import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
  Collapse,
  Badge,
  Alert,
} from '@mui/material';
import {
  LayoutDashboard,
  Library,
  Users,
  CreditCard,
  Megaphone,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,

  Bell,
  LogOut,
  BookOpen,
  Grid3X3,
  PenTool,
  Bookmark,
  Headphones,
  FileText,
  BarChart3,
  CheckCircle,
  Send,
  ScrollText,
  ChevronDown,
  WifiOff,

  Database,
  Image,
  UserCog,
} from 'lucide-react';
import { useAuthStore, hasRole, ADMIN_ROLES, EDITOR_ROLES, MODERATOR_ROLES, type User } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { APP_NAME } from '../App';
import { palette, typography } from '../theme';
import api from '../services/api';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 76;

type NavItem =
  | { type: 'section'; label: string; icon?: React.ElementType }
  | { type: 'link'; label: string; path: string; icon: React.ElementType; roles?: string[] };

const navSections: NavItem[] = [
  { type: 'link', label: 'Dashboard', path: '/', icon: LayoutDashboard },


  { type: 'section', label: 'Content' },
  { type: 'link', label: 'Books', path: '/books', icon: Library, roles: EDITOR_ROLES },
  { type: 'link', label: 'Categories', path: '/categories', icon: Grid3X3, roles: EDITOR_ROLES },
  { type: 'link', label: 'Authors', path: '/authors', icon: PenTool, roles: EDITOR_ROLES },
  { type: 'link', label: 'Storytelling', path: '/storytelling', icon: Headphones, roles: EDITOR_ROLES },
  { type: 'link', label: 'Music', path: '/music', icon: FileText, roles: EDITOR_ROLES },
  { type: 'link', label: 'My Doctor', path: '/my-doctor', icon: ShieldCheck, roles: EDITOR_ROLES },
  { type: 'link', label: 'My Captain', path: '/my-captain', icon: Bookmark, roles: EDITOR_ROLES },
  { type: 'link', label: 'Habits', path: '/habits', icon: CheckCircle, roles: EDITOR_ROLES },
  { type: 'link', label: 'Media', path: '/media', icon: Image, roles: EDITOR_ROLES },

  { type: 'section', label: 'Users' },
  { type: 'link', label: 'All Users', path: '/users', icon: Users, roles: ADMIN_ROLES },
  { type: 'link', label: 'Admins', path: '/admins', icon: UserCog, roles: ADMIN_ROLES },
  { type: 'link', label: 'Roles', path: '/roles', icon: ShieldCheck, roles: ADMIN_ROLES },

  { type: 'section', label: 'Subscriptions & Payments' },
  { type: 'link', label: 'Plans', path: '/subscriptions', icon: Bookmark },
  { type: 'link', label: 'Coupons', path: '/coupons', icon: ScrollText },
  { type: 'link', label: 'Payments', path: '/payments', icon: CreditCard },
  { type: 'link', label: 'Invoices', path: '/invoices', icon: FileText },

  { type: 'section', label: 'Marketing' },
  { type: 'link', label: 'Reports', path: '/reports', icon: BarChart3, roles: MODERATOR_ROLES },
  { type: 'link', label: 'Notifications', path: '/notifications', icon: Send },
  { type: 'link', label: 'CMS', path: '/cms', icon: BookOpen, roles: EDITOR_ROLES },

  { type: 'section', label: 'Administration' },
  { type: 'link', label: 'Audit & Activity', path: '/audit-logs', icon: ScrollText, roles: ADMIN_ROLES },
  { type: 'link', label: 'Backups', path: '/backups', icon: Database },
  { type: 'link', label: 'Settings', path: '/settings', icon: Settings, roles: ADMIN_ROLES },
];

function filterNav(items: NavItem[], user: User | null): NavItem[] {
  const visible: NavItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type === 'section') {
      let hasVisibleLink = false;
      for (let j = i + 1; j < items.length; j++) {
        const link = items[j];
        if (link.type !== 'link') break;
        if (!link.roles || hasRole(user, link.roles)) {
          hasVisibleLink = true;
          break;
        }
      }
      if (hasVisibleLink) visible.push(item);
    } else if (!item.roles || hasRole(user, item.roles)) {
      visible.push(item);
    }
  }
  return visible;
}

function getInitials(name?: string) {
  if (!name) return 'A';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const isAdminBase = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const withBase = (path: string) => (isAdminBase ? `/admin${path === '/' ? '' : path}` : path);
  const visibleNav = filterNav(navSections, user);

  const [mounted, setMounted] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);

  const checkBackend = useCallback(async () => {
    try {
      await api.get('/health', { timeout: 5000 });
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, [checkBackend]);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate(withBase('/login'));
  };

  const currentWidth = sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', py: 1.5, px: sidebarCollapsed ? 1.5 : 2 }}>
      {/* Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2,
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          pl: sidebarCollapsed ? 0 : 0.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${palette.deepTeal}, ${palette.deepTealDark})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(64, 32, 131, 0.25)',
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt={APP_NAME}
            sx={{ width: 26, height: 26, objectFit: 'contain' }}
          />
        </Box>
        {!sidebarCollapsed && (
          <Typography
            variant="h6"
            fontFamily={typography.serif}
            fontWeight={900}
            color={palette.ink}
            noWrap
            sx={{ letterSpacing: '-0.02em' }}
          >
            {APP_NAME}
          </Typography>
        )}
      </Box>

      {/* Nav */}
      <List sx={{ flex: 1, overflow: 'auto', px: 0 }}>
        {visibleNav.map((item, index) => {
          if (item.type === 'section') {
            return sidebarCollapsed ? null : (
              <Typography
                key={item.label}
                variant="caption"
                sx={{
                  display: 'block',
                  px: 1,
                  py: 0.75,
                  color: palette.inkMuted,
                  fontFamily: typography.mono,
                  fontWeight: 600,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-8px)',
                  transition: `all 300ms ease ${index * 40}ms`,
                }}
              >
                {item.label}
              </Typography>
            );
          }

          const target = withBase(item.path);
          const isActive =
            item.path === '/'
              ? location.pathname === target || location.pathname === `${target}/`
              : location.pathname.startsWith(target);
          const Icon = item.icon;

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
              <Tooltip title={sidebarCollapsed ? item.label : ''} placement="right" arrow>
                <ListItemButton
                  selected={isActive}
                  onClick={() => {
                    navigate(target);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 1.5,
                    minHeight: 40,
                    px: sidebarCollapsed ? 1.5 : 1.5,
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateX(0)' : 'translateX(-12px)',
                    transition: `all 300ms ease ${index * 40}ms`,
                    '&.Mui-selected': {
                      backgroundColor: palette.deepTealLight,
                      color: palette.deepTealDark,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarCollapsed ? 0 : 1.5,
                      color: isActive ? palette.deepTeal : palette.inkMuted,
                    }}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                  </ListItemIcon>
                  {!sidebarCollapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 500,
                        noWrap: true,
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Collapse toggle */}
      {!isMobile && (
        <Box sx={{ mt: 'auto', pt: 1 }}>
          <IconButton
            onClick={toggleSidebar}
            sx={{
              width: '100%',
              borderRadius: 1.5,
              color: palette.inkMuted,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              px: sidebarCollapsed ? 1 : 1.5,
              '&:hover': { backgroundColor: palette.warmGrayLight, color: palette.ink },
            }}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!sidebarCollapsed && (
              <Typography variant="body2" sx={{ ml: 1.5, fontWeight: 500 }}>
                Collapse
              </Typography>
            )}
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Mobile drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: currentWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: currentWidth,
              boxSizing: 'border-box',
              transition: 'width 250ms ease',
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <AppBar position="sticky">
          <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isMobile && (
                <IconButton onClick={() => setMobileOpen(true)} sx={{ color: palette.ink }}>
                  <Library size={22} />
                </IconButton>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton size="small" sx={{ color: palette.inkMuted }}>
                <Badge badgeContent={0} color="secondary">
                  <Bell size={20} />
                </Badge>
              </IconButton>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  pl: 1,
                  pr: 0.5,
                  py: 0.5,
                  borderRadius: 2,
                  '&:hover': { bgcolor: palette.warmGrayLight },
                }}
                onClick={(e) => setAnchorEl(e.currentTarget)}
              >
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                    {user?.name || 'Admin'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
                    {user?.roles?.length ? user.roles.join(', ') : user?.role || 'Super Admin'}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: palette.deepTeal,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: typography.sans,
                  }}
                >
                  {getInitials(user?.name)}
                </Avatar>
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                disableRestoreFocus
                MenuListProps={{ autoFocus: true, sx: { gap: 0.5 } }}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 200, px: 0.5 } }}
              >
                <MenuItem disabled sx={{ opacity: 0.7, py: 1.25 }}>
                  {user?.email}
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={() => { setAnchorEl(null); navigate(withBase('/subscriptions')); }} sx={{ gap: 1.5, py: 1.25 }}>
                  <Bookmark size={18} color={palette.deepTeal} />
                  Plans
                </MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); navigate(withBase('/settings')); }} sx={{ gap: 1.5, py: 1.25 }}>
                  <Settings size={18} color={palette.deepTeal} />
                  Settings
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={handleLogout} sx={{ color: palette.coral, gap: 1.5, py: 1.25 }}>
                  <LogOut size={18} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {!backendOnline && (
            <Alert
              severity="warning"
              icon={<WifiOff size={18} />}
              sx={{ borderRadius: 0, py: 0.5, fontSize: 13 }}
            >
              Backend server is unreachable. Some features may not work.
            </Alert>
          )}
          <Box sx={{ flex: 1, px: { xs: 1.5, md: 2 }, py: { xs: 1, md: 1.5 }, overflow: 'auto' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
