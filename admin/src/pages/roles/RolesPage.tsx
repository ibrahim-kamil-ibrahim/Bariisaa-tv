import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, IconButton, Tooltip, Typography, Card, CardContent,
  Chip, Grid, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Avatar,
  Skeleton, Paper,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, string[]>;
}

export default function RolesPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Role | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissions, setFormPermissions] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState('');

  const { data: roles, isLoading, isError, error } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then((r) => r.data.data),
  });

  const createMutation = useMutation({ mutationFn: (body: any) => api.post('/roles', body), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); handleClose(); addNotification('Role created', 'success'); }, onError: (err: any) => setFormError(err.response?.data?.message || 'Error') });
  const updateMutation = useMutation({ mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/roles/${id}`, body), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); handleClose(); addNotification('Role updated', 'success'); }, onError: (err: any) => setFormError(err.response?.data?.message || 'Error') });
  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/roles/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); addNotification('Role deleted', 'success'); }, onError: (err: any) => addNotification(err?.response?.data?.message || 'Failed', 'error') });

  const handleOpen = (item?: Role) => {
    if (item) { setEditItem(item); setFormName(item.name); setFormDescription(item.description || ''); setFormPermissions(item.permissions || {}); }
    else { setEditItem(null); setFormName(''); setFormDescription(''); setFormPermissions({}); }
    setFormError(''); setDialogOpen(true);
  };
  const handleClose = () => { setDialogOpen(false); setEditItem(null); setFormError(''); };
  const handleSave = () => {
    if (!formName.trim()) { setFormError('Name required'); return; }
    const body = { name: formName, description: formDescription, permissions: formPermissions };
    if (editItem) updateMutation.mutate({ id: editItem.id, body }); else createMutation.mutate(body);
  };
  const togglePermission = (resource: string, action: string) => {
    setFormPermissions((prev) => { const current = prev[resource] || []; if (current.includes(action)) return { ...prev, [resource]: current.filter((a) => a !== action) }; return { ...prev, [resource]: [...current, action] }; });
  };

  const RESOURCES = ['books', 'users', 'categories', 'authors', 'subscriptions', 'payments', 'notifications', 'reports', 'roles', 'settings'];
  const ACTIONS = ['create', 'read', 'update', 'delete'];

  const rolesList = roles?.map((role: Role) => (
    <Grid item xs={12} sm={6} md={4} key={role.id}>
      <Card elevation={0} sx={{ borderRadius: 3, transition: 'all 300ms ease', '&:hover': { transform: 'translateY(-2px)' } }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: '#402083', width: 48, height: 48 }}>{role.name.charAt(0).toUpperCase()}</Avatar>
            <Box sx={{ flex: 1 }}><Typography variant="subtitle2" fontWeight={700}>{role.name}</Typography><Typography variant="caption" color="text.secondary">{role.description}</Typography></Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {Object.entries(role.permissions || {}).map(([resource, actions]) => <Chip key={resource} label={`${resource}: ${actions.join(', ')}`} size="small" variant="outlined" />)}
          </Box>
        </CardContent>
        <CardContent sx={{ pt: 0, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <IconButton size="small" onClick={() => handleOpen(role)}><EditIcon size={18} /></IconButton>
          <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(role.id)}><DeleteIcon size={18} /></IconButton>
        </CardContent>
      </Card>
    </Grid>
  )) || [];

  return (
    <FadeIn>
      <Box>
        <PageHeader title="Roles & Permissions" subtitle="Manage user roles" actionLabel="Add Role" onAction={() => handleOpen()} />
        {error && <Alert severity="error" sx={{ mb: 2 }}>{(error as any)?.response?.data?.message || 'Failed'}</Alert>}
        <Grid container spacing={3}>
          {isLoading ? Array.from({ length: 6 }).map((_, i) => <Grid item xs={12} sm={6} md={4} key={i}><Card sx={{ borderRadius: 3 }}><CardContent sx={{ py: 4 }}><Skeleton variant="text" width="60%" /><Skeleton variant="text" width="40%" /></CardContent></Card></Grid>) : rolesList}
          <Grid item xs={12} sm={6} md={4}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '2px dashed #E4E1F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, '&:hover': { borderColor: '#402083' } }} onClick={() => handleOpen()}>
              <CardContent><Typography variant="h6" fontWeight={700} color="text.secondary">+ Add Role</Typography></CardContent>
            </Card>
          </Grid>
        </Grid>
        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>{editItem ? 'Edit Role' : 'Add Role'}</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <TextField autoFocus margin="dense" label="Role Name" fullWidth value={formName} onChange={(e) => setFormName(e.target.value)} sx={{ mb: 2 }} />
            <TextField margin="dense" label="Description" fullWidth value={formDescription} onChange={(e) => setFormDescription(e.target.value)} sx={{ mb: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 1 }}>Permissions</Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {RESOURCES.map((resource) => (
                <Box key={resource} sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={600} textTransform="capitalize" sx={{ mb: 1 }}>{resource}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {ACTIONS.map((action) => (
                      <Chip key={action} label={action} size="small" variant={(formPermissions[resource] || []).includes(action) ? 'filled' : 'outlined'} color={(formPermissions[resource] || []).includes(action) ? 'primary' : 'default'} onClick={() => togglePermission(resource, action)} sx={{ cursor: 'pointer' }} />
                    ))}
                  </Box>
                </Box>
              ))}
            </Paper>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} sx={{ borderRadius: 2 }}>{createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </FadeIn>
  );
}
