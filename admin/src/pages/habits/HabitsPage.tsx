import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Typography, MenuItem, Switch, FormControlLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';

interface Habit {
  id: string;
  title: string;
  description?: string;
  emoji: string;
  category?: string;
  points: number;
  isActive: boolean;
  order: number;
  createdAt: string;
}

export default function HabitsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Habit | null>(null);
  const [form, setForm] = useState({ title: '', description: '', emoji: '⭐', category: 'health', points: 10, isActive: true, order: 0 });
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['habits', page, limit, search],
    queryFn: () => api.get('/habits', { params: { page: page + 1, limit, search: search || undefined } }).then((r) => r.data),
  });

  const habits: Habit[] = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/habits', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/habits/${body.id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/habits/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); setDeleteId(null); },
  });

  const handleOpen = (item?: Habit) => {
    if (item) {
      setEditItem(item);
      setForm({ title: item.title, description: item.description || '', emoji: item.emoji, category: item.category || 'health', points: item.points, isActive: item.isActive, order: item.order });
    } else {
      setEditItem(null);
      setForm({ title: '', description: '', emoji: '⭐', category: 'health', points: 10, isActive: true, order: 0 });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => { setDialogOpen(false); setEditItem(null); setFormError(''); };

  const handleSave = () => {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const columns: Column<Habit>[] = [
    { id: 'emoji', label: '', render: (row) => <Typography variant="h5">{row.emoji}</Typography> },
    { id: 'title', label: 'Title', sortable: true, render: (row) => <Typography variant="body2" fontWeight={500}>{row.title}</Typography> },
    { id: 'category', label: 'Category', render: (row) => <Chip label={row.category || '-'} size="small" /> },
    { id: 'points', label: 'Points', render: (row) => <Chip label={row.points} size="small" color="primary" variant="outlined" /> },
    { id: 'isActive', label: 'Active', render: (row) => <Chip label={row.isActive ? 'Active' : 'Inactive'} size="small" color={row.isActive ? 'success' : 'default'} /> },
    { id: 'order', label: 'Order', render: (row) => row.order },
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
      <PageHeader title="Habits" subtitle="Manage daily habits for the Habits feature" actionLabel="Add Habit" onAction={() => handleOpen()} />
      <DataTable
        columns={columns}
        rows={habits}
        total={data?.meta?.total ?? habits.length}
        page={page} limit={limit}
        onPageChange={setPage} onLimitChange={setLimit}
        search={search} onSearchChange={setSearch}
        loading={isLoading}
        error={isError ? (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load habits' : null}
        getRowId={(r) => r.id}
      />
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Habit' : 'Add Habit'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <TextField fullWidth label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} sx={{ mb: 2 }} />
          <TextField fullWidth label="Emoji" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} sx={{ mb: 2 }}>
            <MenuItem value="health">Health</MenuItem>
            <MenuItem value="productivity">Productivity</MenuItem>
            <MenuItem value="mindfulness">Mindfulness</MenuItem>
            <MenuItem value="fitness">Fitness</MenuItem>
            <MenuItem value="learning">Learning</MenuItem>
          </TextField>
          <TextField fullWidth label="Points" type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} sx={{ mb: 2 }} />
          <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Active" />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!deleteId} title="Delete Habit" message="Are you sure?" confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} loading={deleteMutation.isPending} destructive />
    </Box>
    </FadeIn>
  );
}
