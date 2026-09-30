import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Chip, IconButton, Tooltip, Button, Typography, MenuItem, Switch, FormControlLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FadeIn from '../../components/FadeIn';
import FormModal from '../../components/FormModal';
import FormTextField from '../../components/FormTextField';
import AccessTierFields, { AccessTierValue, validateAccessTier } from '../../components/AccessTierFields';
import api from '../../services/api';

interface Track {
  id: string;
  title: string;
  artist?: string;
  artistId?: string;
  artistAuthor?: { id: string; name: string };
  coverUrl?: string;
  audioUrl: string;
  pdfUrl?: string;
  price: number;
  status: string;
  isFeatured: boolean;
  playCount: number;
  accessTier?: 'FREE' | 'PAID';
  requiredPlanId?: string | null;
}

export default function MusicPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [accessTierFilter, setAccessTierFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Track | null>(null);
  const [form, setForm] = useState({ title: '', artist: '', artistId: '', status: 'DRAFT', isFeatured: false, audioUrl: '', coverUrl: '', pdfUrl: '', price: 0 });
  const [accessTier, setAccessTier] = useState<AccessTierValue>({ accessTier: 'FREE', requiredPlanId: '' });
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['tracks', page, limit, search, accessTierFilter],
    queryFn: () => api.get('/music', { params: { page: page + 1, limit, search: search || undefined, accessTier: accessTierFilter === 'ALL' ? undefined : accessTierFilter } }).then((r) => r.data),
  });

  const { data: authorsData } = useQuery({
    queryKey: ['authors'],
    queryFn: () => api.get('/authors', { params: { page: 1, limit: 100 } }).then((r) => r.data),
  });

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.get('/subscriptions/plans').then((r) => r.data.data),
  });
  const planCount = Array.isArray(plansData) ? plansData.length : 0;

  const tracks: Track[] = data?.data || [];
  const authors: { id: string; name: string }[] = authorsData?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/music', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tracks'] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/music/${body.id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tracks'] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/music/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tracks'] }); setDeleteId(null); },
  });

  const handleOpen = (item?: Track) => {
    if (item) {
      setEditItem(item);
      setForm({ title: item.title, artist: item.artist || '', artistId: item.artistId || item.artistAuthor?.id || '', status: item.status, isFeatured: item.isFeatured, audioUrl: item.audioUrl, coverUrl: item.coverUrl || '', pdfUrl: item.pdfUrl || '', price: item.price ?? 0 });
      setAccessTier({ accessTier: item.accessTier === 'PAID' ? 'PAID' : 'FREE', requiredPlanId: item.requiredPlanId || '' });
    } else {
      setEditItem(null);
      setForm({ title: '', artist: '', artistId: '', status: 'DRAFT', isFeatured: false, audioUrl: '', coverUrl: '', pdfUrl: '', price: 0 });
      setAccessTier({ accessTier: 'FREE', requiredPlanId: '' });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => { setDialogOpen(false); setEditItem(null); setFormError(''); };

  const handleSave = () => {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!form.audioUrl.trim()) { setFormError('Audio URL is required'); return; }
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

  const handleAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioUploading(true);
    try {
      const fd = new FormData();
      fd.append('audio', file);
      const { data } = await api.post('/music/upload-audio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, audioUrl: data.data.audioUrl }));
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Audio upload failed');
    } finally {
      setAudioUploading(false);
      e.target.value = '';
    }
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append('cover', file);
      const { data } = await api.post('/music/upload-cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, coverUrl: data.data.coverUrl }));
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Cover upload failed');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const handlePdfFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploading(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      const { data } = await api.post('/music/upload-pdf', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, pdfUrl: data.data.pdfUrl }));
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'PDF upload failed');
    } finally {
      setPdfUploading(false);
      e.target.value = '';
    }
  };

  const columns: Column<Track>[] = [
    { id: 'title', label: 'Title', sortable: true, render: (row) => <Typography variant="body2" fontWeight={500}>{row.title}</Typography> },
    { id: 'artist', label: 'Artist', render: (row) => row.artist || '-' },
    { id: 'price', label: 'Price', render: (row) => row.price > 0 ? `$${row.price.toFixed(2)}` : 'Free' },
    { id: 'accessTier', label: 'Access', render: (row) => <Chip label={row.accessTier === 'PAID' ? 'Paid' : 'Free'} size="small" color={row.accessTier === 'PAID' ? 'primary' : 'default'} variant={row.accessTier === 'PAID' ? 'filled' : 'outlined'} /> },
    { id: 'status', label: 'Status', render: (row) => <Chip label={row.status} size="small" color={row.status === 'PUBLISHED' ? 'success' : row.status === 'DRAFT' ? 'warning' : 'default'} /> },
    { id: 'playCount', label: 'Plays', render: (row) => row.playCount },
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
      <PageHeader title="Music" subtitle="Manage music tracks for the Music tab" actionLabel="Add Track" onAction={() => handleOpen()} />
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
        rows={tracks}
        total={data?.meta?.total ?? tracks.length}
        page={page} limit={limit}
        onPageChange={setPage} onLimitChange={setLimit}
        search={search} onSearchChange={setSearch}
        loading={isLoading}
        error={isError ? (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load tracks' : null}
        getRowId={(r) => r.id}
      />
      <FormModal
        open={dialogOpen}
        title={editItem ? 'Edit Track' : 'Add Track'}
        subtitle="Manage music tracks for the Music tab"
        onClose={handleClose}
        onSubmit={handleSave}
        loading={createMutation.isPending || updateMutation.isPending}
        error={formError || null}
      >
        <FormTextField required label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
        <FormTextField select label="Artist (from Authors)" value={form.artistId} onChange={(e) => setForm({ ...form, artistId: e.target.value })}>
          <MenuItem value="">— None —</MenuItem>
          {authors.map((a) => (
            <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
          ))}
        </FormTextField>
        <FormTextField label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} helperText="0 = Free" />
        <AccessTierFields
          value={accessTier}
          onChange={setAccessTier}
          error={validateAccessTier(accessTier, planCount) || undefined}
        />
        <FormTextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <MenuItem value="DRAFT">Draft</MenuItem>
          <MenuItem value="PUBLISHED">Published</MenuItem>
        </FormTextField>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <FormTextField label="Audio URL" value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} helperText="Paste a URL or upload a file from your device" sx={{ mb: 0 }} />
          <Button variant="outlined" component="label" disabled={audioUploading} sx={{ minWidth: 120, flexShrink: 0 }}>
            {audioUploading ? 'Uploading…' : 'Upload audio'}
            <input type="file" hidden accept="audio/*" onChange={handleAudioFile} />
          </Button>
        </Box>
        {form.audioUrl && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Preview — play before saving
            </Typography>
            <audio controls src={form.audioUrl} style={{ width: '100%' }} />
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <FormTextField label="Cover URL" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} sx={{ mb: 0 }} />
          <Button variant="outlined" component="label" disabled={coverUploading} sx={{ minWidth: 120, flexShrink: 0 }}>
            {coverUploading ? 'Uploading…' : 'Upload cover'}
            <input type="file" hidden accept="image/*" onChange={handleCoverFile} />
          </Button>
        </Box>
        {form.coverUrl && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <img src={form.coverUrl} alt="Cover preview" style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <FormTextField label="PDF URL" value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} helperText="Optional — attach a PDF/book for this track" sx={{ mb: 0 }} />
          <Button variant="outlined" component="label" disabled={pdfUploading} sx={{ minWidth: 120, flexShrink: 0 }}>
            {pdfUploading ? 'Uploading…' : 'Upload PDF'}
            <input type="file" hidden accept="application/pdf" onChange={handlePdfFile} />
          </Button>
        </Box>
        {form.pdfUrl && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box component="iframe" src={form.pdfUrl} sx={{ width: '100%', height: 400, border: 'none', borderRadius: 1 }} />
            <Button size="small" href={form.pdfUrl} target="_blank" rel="noopener" sx={{ mt: 1 }}>
              Open in new tab
            </Button>
          </Box>
        )}
        <FormControlLabel control={<Switch checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />} label="Featured" />
      </FormModal>
      <ConfirmDialog open={!!deleteId} title="Delete Track" message="Are you sure?" confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} loading={deleteMutation.isPending} destructive />
    </Box>
    </FadeIn>
  );
}
