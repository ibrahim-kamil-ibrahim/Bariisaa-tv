import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Card, CardContent, Typography, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, MenuItem, Tabs, Tab } from '@mui/material';
import { Edit, Trash2, Plus, Eye } from 'lucide-react';
import DataTable, { Column } from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';

const TABS = ['All', 'page', 'faq', 'banner', 'footer'];

export default function CmsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ slug: '', title: '', content: '', type: 'page', status: 'draft', metaTitle: '', metaDesc: '' });
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cms-pages', page, TABS[tab]],
    queryFn: () => api.get('/cms', { params: { page: page + 1, limit: 20, type: TABS[tab] === 'All' ? undefined : TABS[tab] } }).then((r) => r.data),
  });

  const pages = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/cms', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cms-pages'] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/cms/${body.id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cms-pages'] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cms/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cms-pages'] }); setDeleteId(null); },
  });

  const handleOpen = (item?: any) => {
    if (item) {
      setEditItem(item);
      setForm({ slug: item.slug, title: item.title, content: item.content, type: item.type, status: item.status, metaTitle: item.metaTitle || '', metaDesc: item.metaDesc || '' });
    } else {
      setEditItem(null);
      setForm({ slug: '', title: '', content: '', type: 'page', status: 'draft', metaTitle: '', metaDesc: '' });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => { setDialogOpen(false); setEditItem(null); setFormError(''); };
  const handleSave = () => {
    if (!form.title.trim() || !form.slug.trim()) { setFormError('Title and slug required'); return; }
    if (editItem) updateMutation.mutate({ id: editItem.id, ...form });
    else createMutation.mutate(form);
  };

  const columns: Column<any>[] = [
    { id: 'title', label: 'Title', sortable: true, render: (row) => <Typography variant="body2" fontWeight={500}>{row.title}</Typography> },
    { id: 'slug', label: 'Slug', render: (row) => <Typography variant="body2" color="text.secondary">/{row.slug}</Typography> },
    { id: 'type', label: 'Type', render: (row) => <Chip label={row.type} size="small" /> },
    { id: 'status', label: 'Status', render: (row) => <Chip label={row.status} size="small" color={row.status === 'published' ? 'success' : row.status === 'draft' ? 'warning' : 'default'} /> },
    { id: 'actions', label: 'Actions', align: 'right', render: (row) => (
      <Box>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(row)}><Edit fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><Trash2 fontSize="small" /></IconButton></Tooltip>
      </Box>
    )},
  ];

  return (
    <FadeIn>
      <Box>
        <PageHeader title="CMS" subtitle="Manage pages, FAQs, banners, and footer content" actionLabel="Add Page" onAction={() => handleOpen()} />
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          {TABS.map((t) => <Tab key={t} label={t} />)}
        </Tabs>
        <DataTable columns={columns} rows={pages} total={data?.meta?.total || pages.length} page={page} limit={20} onPageChange={setPage} onLimitChange={() => {}} loading={isLoading} getRowId={(r) => r.id} />
        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>{editItem ? 'Edit Page' : 'Add Page'}</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <TextField fullWidth label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} sx={{ mb: 2, mt: 1 }} />
            <TextField fullWidth label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} multiline rows={6} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <MenuItem value="page">Page</MenuItem><MenuItem value="faq">FAQ</MenuItem><MenuItem value="banner">Banner</MenuItem><MenuItem value="footer">Footer</MenuItem>
              </TextField>
              <TextField fullWidth select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="draft">Draft</MenuItem><MenuItem value="published">Published</MenuItem><MenuItem value="archived">Archived</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>Save</Button>
          </DialogActions>
        </Dialog>
        <ConfirmDialog open={!!deleteId} title="Delete Page" message="Are you sure?" confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} loading={deleteMutation.isPending} destructive />
      </Box>
    </FadeIn>
  );
}
