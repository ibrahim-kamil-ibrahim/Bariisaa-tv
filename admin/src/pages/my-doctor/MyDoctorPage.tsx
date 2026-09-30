import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Chip, IconButton, Tooltip, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Typography, Switch, FormControlLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';

interface HealthTip { id: string; title: string; content: string; emoji: string; category: string; order: number; }
interface DoctorProfile { id: string; name: string; specialty: string; bio?: string; photoUrl?: string; available: boolean; order: number; }

export default function MyDoctorPage() {
  const queryClient = useQueryClient();
  const [tabIndex, setTabIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formTip, setFormTip] = useState({ title: '', content: '', emoji: '💪', category: 'general', order: 0 });
  const [formDoctor, setFormDoctor] = useState({ name: '', specialty: '', bio: '', photoUrl: '', available: true, order: 0 });
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'tips' | 'profiles'>('tips');

  const tab = tabIndex === 0 ? 'tips' : 'profiles';
  const queryKey = tabIndex === 0 ? 'health-tips' : 'doctor-profiles';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [queryKey, page, limit],
    queryFn: () => api.get(`/my-doctor/${tab}`).then((r) => r.data),
  });

  const items: any[] = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post(`/my-doctor/${tab}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [queryKey] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/my-doctor/${tab}/${body.id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [queryKey] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/my-doctor/${deleteType}/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['health-tips', 'doctor-profiles'] }); setDeleteId(null); },
  });

  const handleOpen = (item?: any) => {
    if (tabIndex === 0) {
      setFormTip(item ? { title: item.title, content: item.content || '', emoji: item.emoji || '💪', category: item.category || 'general', order: item.order || 0 } : { title: '', content: '', emoji: '💪', category: 'general', order: 0 });
    } else {
      setFormDoctor(item ? { name: item.name, specialty: item.specialty, bio: item.bio || '', photoUrl: item.photoUrl || '', available: item.available ?? true, order: item.order || 0 } : { name: '', specialty: '', bio: '', photoUrl: '', available: true, order: 0 });
    }
    setEditItem(item || null);
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => { setDialogOpen(false); setEditItem(null); setFormError(''); };

  const handleSave = () => {
    if (tabIndex === 0) {
      if (!formTip.title.trim()) { setFormError('Title is required'); return; }
      if (editItem) updateMutation.mutate({ id: editItem.id, ...formTip });
      else createMutation.mutate(formTip);
    } else {
      if (!formDoctor.name.trim()) { setFormError('Name is required'); return; }
      if (editItem) updateMutation.mutate({ id: editItem.id, ...formDoctor });
      else createMutation.mutate(formDoctor);
    }
  };

  const handleDelete = (id: string, type: 'tips' | 'profiles') => {
    setDeleteType(type);
    setDeleteId(id);
  };

  const tipColumns: Column<HealthTip>[] = [
    { id: 'emoji', label: '', render: (row) => <Typography variant="h5">{row.emoji}</Typography> },
    { id: 'title', label: 'Title', sortable: true, render: (row) => <Typography variant="body2" fontWeight={500}>{row.title}</Typography> },
    { id: 'category', label: 'Category', render: (row) => <Chip label={row.category} size="small" /> },
    { id: 'order', label: 'Order', render: (row) => row.order },
    { id: 'actions', label: 'Actions', align: 'right' as const, render: (row: any) => (
      <Box>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(row.id, 'tips')}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
      </Box>
    )},
  ];

  const doctorColumns: Column<DoctorProfile>[] = [
    { id: 'name', label: 'Name', sortable: true, render: (row) => <Typography variant="body2" fontWeight={500}>{row.name}</Typography> },
    { id: 'specialty', label: 'Specialty', render: (row) => <Chip label={row.specialty} size="small" /> },
    { id: 'available', label: 'Available', render: (row) => row.available ? <Chip label="Yes" size="small" color="success" /> : <Chip label="No" size="small" color="default" /> },
    { id: 'order', label: 'Order', render: (row) => row.order },
    { id: 'actions', label: 'Actions', align: 'right' as const, render: (row: any) => (
      <Box>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(row.id, 'profiles')}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
      </Box>
    )},
  ];

  const columns = (tabIndex === 0 ? tipColumns : doctorColumns) as Column<any>[];

  return (
    <FadeIn>
    <Box>
      <PageHeader title="My Doctor" subtitle="Manage health tips and doctor profiles" actionLabel={tabIndex === 0 ? 'Add Tip' : 'Add Doctor'} onAction={() => handleOpen()} />
      <Tabs value={tabIndex} onChange={(_, v) => { setTabIndex(v); setPage(0); }} sx={{ mb: 2 }}>
        <Tab label="Health Tips" />
        <Tab label="Doctor Profiles" />
      </Tabs>
      <DataTable
        columns={columns}
        rows={items}
        total={items.length}
        page={page} limit={limit}
        onPageChange={setPage} onLimitChange={setLimit}
        loading={isLoading}
        error={isError ? (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load' : null}
        getRowId={(r) => r.id}
      />
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? `Edit ${tabIndex === 0 ? 'Tip' : 'Doctor'}` : `Add ${tabIndex === 0 ? 'Tip' : 'Doctor'}`}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {tabIndex === 0 ? (
            <>
              <TextField fullWidth label="Title" value={formTip.title} onChange={(e) => setFormTip({ ...formTip, title: e.target.value })} sx={{ mb: 2, mt: 1 }} />
              <TextField fullWidth label="Content" value={formTip.content} onChange={(e) => setFormTip({ ...formTip, content: e.target.value })} multiline rows={3} sx={{ mb: 2 }} />
              <TextField fullWidth label="Emoji" value={formTip.emoji} onChange={(e) => setFormTip({ ...formTip, emoji: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Category" value={formTip.category} onChange={(e) => setFormTip({ ...formTip, category: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Order" type="number" value={formTip.order} onChange={(e) => setFormTip({ ...formTip, order: parseInt(e.target.value) || 0 })} />
            </>
          ) : (
            <>
              <TextField fullWidth label="Name" value={formDoctor.name} onChange={(e) => setFormDoctor({ ...formDoctor, name: e.target.value })} sx={{ mb: 2, mt: 1 }} />
              <TextField fullWidth label="Specialty" value={formDoctor.specialty} onChange={(e) => setFormDoctor({ ...formDoctor, specialty: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Bio" value={formDoctor.bio} onChange={(e) => setFormDoctor({ ...formDoctor, bio: e.target.value })} multiline rows={3} sx={{ mb: 2 }} />
              <TextField fullWidth label="Photo URL" value={formDoctor.photoUrl} onChange={(e) => setFormDoctor({ ...formDoctor, photoUrl: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Order" type="number" value={formDoctor.order} onChange={(e) => setFormDoctor({ ...formDoctor, order: parseInt(e.target.value) || 0 })} sx={{ mb: 2 }} />
              <FormControlLabel control={<Switch checked={formDoctor.available} onChange={(e) => setFormDoctor({ ...formDoctor, available: e.target.checked })} />} label="Available" />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!deleteId} title={`Delete ${deleteType === 'tips' ? 'Tip' : 'Doctor'}`} message="Are you sure?" confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} loading={deleteMutation.isPending} destructive />
    </Box>
    </FadeIn>
  );
}
