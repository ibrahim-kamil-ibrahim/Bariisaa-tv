import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Typography, MenuItem, Switch, FormControlLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FadeIn from '../../components/FadeIn';
import AccessTierFields, { AccessTierValue, validateAccessTier } from '../../components/AccessTierFields';
import api from '../../services/api';

interface Story {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  audioUrl?: string;
  category: string;
  status: string;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  accessTier?: 'FREE' | 'PAID';
  requiredPlanId?: string | null;
}

export default function StorytellingPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [accessTierFilter, setAccessTierFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Story | null>(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'folk', status: 'DRAFT', isFeatured: false, coverUrl: '', audioUrl: '' });
  const [accessTier, setAccessTier] = useState<AccessTierValue>({ accessTier: 'FREE', requiredPlanId: '' });
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['stories', page, limit, search, accessTierFilter],
    queryFn: () => api.get('/storytelling', { params: { page: page + 1, limit, search: search || undefined, accessTier: accessTierFilter === 'ALL' ? undefined : accessTierFilter } }).then((r) => r.data),
  });

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.get('/subscriptions/plans').then((r) => r.data.data),
  });
  const planCount = Array.isArray(plansData) ? plansData.length : 0;

  const stories: Story[] = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/storytelling', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stories'] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/storytelling/${body.id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stories'] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/storytelling/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stories'] }); setDeleteId(null); },
  });

  const handleOpen = (item?: Story) => {
    if (item) {
      setEditItem(item);
      setForm({ title: item.title, description: item.description || '', category: item.category, status: item.status, isFeatured: item.isFeatured, coverUrl: item.coverUrl || '', audioUrl: item.audioUrl || '' });
      setAccessTier({ accessTier: item.accessTier === 'PAID' ? 'PAID' : 'FREE', requiredPlanId: item.requiredPlanId || '' });
    } else {
      setEditItem(null);
      setForm({ title: '', description: '', category: 'folk', status: 'DRAFT', isFeatured: false, coverUrl: '', audioUrl: '' });
      setAccessTier({ accessTier: 'FREE', requiredPlanId: '' });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => { setDialogOpen(false); setEditItem(null); setFormError(''); };

  const handleSave = () => {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    const tierError = validateAccessTier(accessTier, planCount);
    if (tierError) { setFormError(tierError); return; }
    const body = {
      ...form,
      accessTier: accessTier.accessTier,
      requiredPlanId: accessTier.accessTier === 'PAID' && accessTier.requiredPlanId ? accessTier.requiredPlanId : null,
    };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, ...body });
    } else {
      createMutation.mutate(body);
    }
  };

  const columns: Column<Story>[] = [
    { id: 'title', label: 'Title', sortable: true, render: (row) => <Typography variant="body2" fontWeight={500}>{row.title}</Typography> },
    { id: 'category', label: 'Category', render: (row) => <Chip label={row.category} size="small" /> },
    { id: 'status', label: 'Status', render: (row) => <Chip label={row.status} size="small" color={row.status === 'PUBLISHED' ? 'success' : row.status === 'DRAFT' ? 'warning' : 'default'} /> },
    { id: 'accessTier', label: 'Access', render: (row) => <Chip label={row.accessTier === 'PAID' ? 'Paid' : 'Free'} size="small" color={row.accessTier === 'PAID' ? 'primary' : 'default'} variant={row.accessTier === 'PAID' ? 'filled' : 'outlined'} /> },
    { id: 'isFeatured', label: 'Featured', render: (row) => row.isFeatured ? <Chip label="Featured" size="small" color="primary" /> : '-' },
    { id: 'viewCount', label: 'Views', render: (row) => row.viewCount },
    {
      id: 'actions', label: 'Actions', align: 'right' as const,
      render: (row) => (
        <Box>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <FadeIn>
    <Box>
      <PageHeader title="Storytelling" subtitle="Manage stories for the Storytelling tab" actionLabel="Add Story" onAction={() => handleOpen()} />
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {(['ALL', 'FREE', 'PAID'] as const).map((tier) => (
          <Chip
            key={tier}
            label={tier === 'ALL' ? 'All' : tier === 'FREE' ? 'Free' : 'Paid'}
            onClick={() => { setAccessTierFilter(tier); setPage(0); }}
            color={accessTierFilter === tier ? 'primary' : 'default'}
            variant={accessTierFilter === tier ? 'filled' : 'outlined'}
            size="small"
          />
        ))}
      </Box>
      <DataTable
        columns={columns}
        rows={stories}
        total={data?.meta?.total ?? stories.length}
        page={page} limit={limit}
        onPageChange={setPage} onLimitChange={setLimit}
        search={search} onSearchChange={setSearch}
        loading={isLoading}
        error={isError ? (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load stories' : null}
        getRowId={(r) => r.id}
      />
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Story' : 'Add Story'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <TextField fullWidth label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={3} sx={{ mb: 2 }} />
          <TextField fullWidth select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} sx={{ mb: 2 }}>
            <MenuItem value="folk">Folk Tales</MenuItem>
            <MenuItem value="bedtime">Bedtime</MenuItem>
            <MenuItem value="moral">Moral</MenuItem>
            <MenuItem value="adventure">Adventure</MenuItem>
            <MenuItem value="fables">Fables</MenuItem>
            <MenuItem value="poems">Poems</MenuItem>
          </TextField>
          <TextField fullWidth select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} sx={{ mb: 2 }}>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="PUBLISHED">Published</MenuItem>
          </TextField>
          <TextField fullWidth label="Cover URL" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Audio URL" value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} sx={{ mb: 2 }} />
          <AccessTierFields
            value={accessTier}
            onChange={setAccessTier}
            error={validateAccessTier(accessTier, planCount) || undefined}
          />
          <FormControlLabel control={<Switch checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />} label="Featured" />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!deleteId} title="Delete Story" message="Are you sure?" confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} loading={deleteMutation.isPending} destructive />
    </Box>
    </FadeIn>
  );
}
