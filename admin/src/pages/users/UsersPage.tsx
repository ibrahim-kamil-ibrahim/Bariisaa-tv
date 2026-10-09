import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Switch,
  FormControlLabel,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Checkbox,
  InputAdornment,
  Box as MuiBox,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  RefreshCw as RefreshIcon,
  Blocks as BlocksIcon,
  LockOpen as ResetIcon,
  Search as SearchIcon,
  UserCog as UserCogIcon,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import AssignRolesDialog, { AssignRolesTarget } from '../../components/AssignRolesDialog';
import api from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  role?: string;
  roles?: { role: { id: string; name: string } }[];
  avatar?: string;
  avatarUrl?: string | null;
  lastLogin?: string;
  createdAt: string;
}

const STATUS_TABS = ['', 'ACTIVE', 'SUSPENDED', 'BLOCKED'];
const STATUS_TAB_LABELS = ['All Users', 'Active', 'Suspended', 'Blocked'];

function roleNames(user: User): string[] {
  if (user.roles?.length) return user.roles.map((ur) => ur.role.name);
  return user.role ? [user.role] : [];
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusDialog, setStatusDialog] = useState<{ id: string; status: string } | null>(null);
  const [statusValue, setStatusValue] = useState('');
  const [resetDialog, setResetDialog] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState('SUSPENDED');
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [tab, setTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [rolesTarget, setRolesTarget] = useState<AssignRolesTarget | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users', page, limit, search, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      api
        .get('/users', {
          params: {
            page: page + 1,
            limit,
            search: search || undefined,
            status: statusFilter || undefined,
            sortBy,
            sortOrder,
          },
        })
        .then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/users/${id}/status`, { status, reason: 'Admin update' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setStatusDialog(null); addNotification('Status updated', 'success'); },
    onError: (err: any) => addNotification(err?.response?.data?.message || 'Failed to update status', 'error'),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => api.post(`/users/${id}/reset-password`, { newPassword: password }),
    onSuccess: () => { setResetDialog(null); setNewPassword(''); addNotification('Password reset', 'success'); },
    onError: (err: any) => addNotification(err?.response?.data?.message || 'Failed to reset password', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setDeleteDialog(null); addNotification('User deleted', 'success'); },
    onError: (err: any) => addNotification(err?.response?.data?.message || 'Failed to delete user', 'error'),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) => api.post('/users/bulk-status', { ids, status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setSelectedIds([]); setBulkStatusDialog(false); addNotification('Bulk status updated', 'success'); },
    onError: (err: any) => addNotification(err?.response?.data?.message || 'Failed', 'error'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/users/bulk-delete', { ids }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setSelectedIds([]); setBulkDeleteDialog(false); addNotification('Users deleted', 'success'); },
    onError: (err: any) => addNotification(err?.response?.data?.message || 'Failed', 'error'),
  });

  const users: User[] = data?.data || [];

  const statusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'SUSPENDED': return 'warning';
      case 'BANNED':
      case 'BLOCKED': return 'error';
      default: return 'default';
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const columns = [
    { id: 'name', label: 'User', sortable: true, render: (row: User) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar src={row.avatar || ''} sx={{ width: 36, height: 36 }}>{row.name.charAt(0).toUpperCase()}</Avatar>
        <Box>
          <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.email}</Typography>
        </Box>
      </Box>
    )},
    { id: 'role', label: 'Role', render: (row: User) => (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {roleNames(row).map((name) => <Chip key={name} label={name} size="small" variant="outlined" />)}
      </Box>
    ) },
    { id: 'status', label: 'Status', render: (row: User) => <Chip label={row.status} size="small" color={statusColor(row.status) as any} variant="outlined" /> },
    { id: 'lastLogin', label: 'Last Login', render: (row: User) => <Typography variant="body2">{row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : '—'}</Typography> },
    { id: 'createdAt', label: 'Joined', render: (row: User) => <Typography variant="body2">{new Date(row.createdAt).toLocaleDateString()}</Typography> },
    { id: 'actions', label: '', align: 'right' as const, render: (row: User) => (
      <Box>
        <Tooltip title="Reset Password"><IconButton size="small" onClick={() => { setResetDialog(row.id); setNewPassword(''); }}><ResetIcon size={18} /></IconButton></Tooltip>
        <Tooltip title="Edit Status"><IconButton size="small" onClick={() => { setStatusDialog({ id: row.id, status: row.status }); setStatusValue(row.status); }}><RefreshIcon size={18} /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ id: row.id, name: row.name })}><DeleteIcon size={18} /></IconButton></Tooltip>
      </Box>
    )},
  ];

  return (
    <FadeIn>
      <Box>
        <PageHeader
          title="Users"
          subtitle={`${(data?.meta?.total || 0).toLocaleString()} registered users`}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{(error as any)?.response?.data?.message || (error as any)?.message || 'Failed'}</Alert>
        )}

        <TextField
          size="small"
          placeholder="Search users..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ mb: 2, maxWidth: 360, display: 'block' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon size={16} />
              </InputAdornment>
            ),
          }}
        />

        {/* Active Tab */}
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setStatusFilter(STATUS_TABS[v]); setPage(0); }} sx={{ mb: 3 }}>
          {STATUS_TAB_LABELS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>

        {/* Selected Actions Bar */}
        {selectedIds.length > 0 && (
          <Card sx={{ mb: 2, borderRadius: 2, backgroundColor: '#40208308', border: '1px solid #40208320' }}>
            <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" fontWeight={600}>{selectedIds.length} selected</Typography>
              <Button size="small" variant="outlined" color="warning" onClick={() => setBulkStatusDialog(true)} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Bulk Status
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={() => setBulkDeleteDialog(true)} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Bulk Delete
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => setSelectedIds([])} sx={{ borderRadius: 2 }}>Clear</Button>
            </CardContent>
          </Card>
        )}

        {/* User Grid Cards */}
        <Grid container spacing={3}>
          {users.map((user) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  transition: 'all 300ms ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(30,27,46,0.1)' },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Checkbox
                      size="small"
                      checked={selectedIds.includes(user.id)}
                      onChange={() => toggleSelected(user.id)}
                      inputProps={{ 'aria-label': `Select ${user.name}` }}
                    />
                    <Avatar src={user.avatar || user.avatarUrl || ''} sx={{ width: 44, height: 44 }}>{user.name.charAt(0).toUpperCase()}</Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>{user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {roleNames(user).map((name) => (
                      <Chip key={name} label={name} size="small" variant="outlined" />
                    ))}
                    <Chip label={user.status} size="small" color={statusColor(user.status) as any} variant="outlined" />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, justifyContent: 'flex-end' }}>
                  <Tooltip title="Assign roles">
                    <IconButton
                      size="small"
                      onClick={() =>
                        setRolesTarget({
                          id: user.id,
                          name: user.name,
                          roleIds: (user.roles || []).map((ur) => ur.role.id),
                        })
                      }
                    >
                      <UserCogIcon size={18} />
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small" onClick={() => { setResetDialog(user.id); setNewPassword(''); }}><ResetIcon size={18} /></IconButton>
                  <IconButton size="small" onClick={() => { setStatusDialog({ id: user.id, status: user.status }); setStatusValue(user.status); }}><RefreshIcon size={18} /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteDialog({ id: user.id, name: user.name })}><DeleteIcon size={18} /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Pagination */}
        {(data?.meta?.total || 0) > limit && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1 }}>
            <Button variant="outlined" size="small" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} sx={{ borderRadius: 2 }}>Previous</Button>
            <Button variant="outlined" size="small" onClick={() => setPage(page + 1)} disabled={users.length < limit} sx={{ borderRadius: 2 }}>Next</Button>
          </Box>
        )}

        {/* Status Dialog */}
        <Dialog open={!!statusDialog} onClose={() => setStatusDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Change Status</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusValue} label="Status" onChange={(e) => setStatusValue(e.target.value)}>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="SUSPENDED">Suspended</MenuItem>
                <MenuItem value="BLOCKED">Blocked</MenuItem>
                <MenuItem value="DELETED">Deleted</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setStatusDialog(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" onClick={() => statusDialog && statusMutation.mutate({ id: statusDialog.id, status: statusValue })} disabled={statusMutation.isPending} sx={{ borderRadius: 2 }}>
              {statusMutation.isPending ? 'Updating...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={!!resetDialog} onClose={() => setResetDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="New Password"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ mt: 2, mb: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setResetDialog(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" onClick={() => resetDialog && resetMutation.mutate({ id: resetDialog, password: newPassword })} disabled={resetMutation.isPending || !newPassword} sx={{ borderRadius: 2 }}>
              {resetMutation.isPending ? 'Resetting...' : 'Reset'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Delete User?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to delete <strong>{deleteDialog?.name}</strong>? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteDialog(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => deleteDialog && deleteMutation.mutate(deleteDialog.id)} disabled={deleteMutation.isPending} sx={{ borderRadius: 2 }}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Status Dialog */}
        <Dialog open={bulkStatusDialog} onClose={() => setBulkStatusDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Bulk Status Change</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">Set status for {selectedIds.length} users:</Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select value={bulkStatusValue} label="Status" onChange={(e) => setBulkStatusValue(e.target.value)}>
                <MenuItem value="SUSPENDED">Suspended</MenuItem>
                <MenuItem value="BLOCKED">Blocked</MenuItem>
                <MenuItem value="DELETED">Deleted</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setBulkStatusDialog(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" color="warning" onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: bulkStatusValue })} disabled={bulkStatusMutation.isPending} sx={{ borderRadius: 2 }}>
              {bulkStatusMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Delete {selectedIds.length} Users?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">Are you sure you want to permanently delete {selectedIds.length} users?</Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setBulkDeleteDialog(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => bulkDeleteMutation.mutate(selectedIds)} disabled={bulkDeleteMutation.isPending} sx={{ borderRadius: 2 }}>
              {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assign Roles Dialog */}
        <AssignRolesDialog user={rolesTarget} onClose={() => setRolesTarget(null)} />
      </Box>
    </FadeIn>
  );
}
