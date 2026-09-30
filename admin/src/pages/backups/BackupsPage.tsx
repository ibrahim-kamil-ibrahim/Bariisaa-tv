import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Card, CardContent, Typography, Chip, IconButton, Tooltip, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Skeleton } from '@mui/material';
import { Database, Download, RotateCcw, Trash2, Plus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';

export default function BackupsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['backups', page],
    queryFn: () => api.get('/backups', { params: { page: page + 1, limit: 20 } }).then((r) => r.data),
  });

  const backups = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const createMutation = useMutation({ mutationFn: () => api.post('/backups', { type: 'manual' }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['backups'] }); } });
  const restoreMutation = useMutation({ mutationFn: (id: string) => api.post(`/backups/${id}/restore`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['backups'] }); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/backups/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['backups'] }); } });

  const formatSize = (bytes: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (s: string) => {
    switch (s) { case 'COMPLETED': return 'success'; case 'IN_PROGRESS': return 'warning'; case 'FAILED': return 'error'; default: return 'default'; }
  };

  return (
    <FadeIn>
      <Box>
        <PageHeader title="Backup Manager" subtitle={`${total} backups`} actionLabel="Create Backup" onAction={() => createMutation.mutate()} />
        {isLoading && <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={60} />)}</Box>}
        {!isLoading && (
          <>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead><TableRow><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell>Size</TableCell><TableCell>Created</TableCell><TableCell>Completed</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {backups.map((b: any) => (
                    <TableRow key={b.id}><TableCell><Chip label={b.type} size="small" /></TableCell>
                      <TableCell><Chip label={b.status} size="small" color={getStatusColor(b.status) as any} /></TableCell>
                      <TableCell>{formatSize(b.fileSize)}</TableCell>
                      <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{b.completedAt ? new Date(b.completedAt).toLocaleString() : '—'}</TableCell>
                      <TableCell>
                        {b.status === 'COMPLETED' && <Tooltip title="Restore"><IconButton size="small" onClick={() => { if (window.confirm('Are you sure you want to restore this backup? This action cannot be undone.')) { restoreMutation.mutate(b.id); } }}><RotateCcw size={16} /></IconButton></Tooltip>}
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => deleteMutation.mutate(b.id)}><Trash2 size={16} /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">Page {page + 1} of {totalPages}</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="Previous" clickable onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} />
                <Chip label="Next" clickable onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} />
              </Box>
            </Box>
          </>
        )}
      </Box>
    </FadeIn>
  );
}
