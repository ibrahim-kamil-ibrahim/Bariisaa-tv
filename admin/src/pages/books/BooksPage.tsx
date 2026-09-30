import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, IconButton, Avatar, Tooltip, Typography, Card, CardContent,
  CardActions, Chip, Skeleton, Grid, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Eye as EyeIcon } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';
import { Book } from '../../types';

function BookCard({ book, onEdit, onView, onDelete }: { book: Book; onEdit: (b: Book) => void; onView: (b: Book) => void; onDelete: (b: Book) => void }) {
  const s = (book.status || '').toUpperCase();
  return (
    <Card elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', transition: 'all 300ms ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(30,27,46,0.12)' } }}>
      <Box sx={{ height: 180, background: 'linear-gradient(135deg, #40208310, #40208304)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Typography variant="h1" sx={{ opacity: 0.15, fontSize: 80, fontWeight: 800, color: '#402083' }}>{book.title.charAt(0)}</Typography>
        <Chip label={book.status || 'DRAFT'} size="small" sx={{ position: 'absolute', top: 8, right: 8, backgroundColor: s === 'PUBLISHED' ? '#059669' : '#6E6A85', color: '#fff', fontWeight: 600 }} />
        {book.accessTier === 'PAID' && <Chip label="Paid" size="small" color="primary" sx={{ position: 'absolute', top: 40, right: 8, fontWeight: 600 }} />}
        {book.isFeatured && <Chip label="⭐ Featured" size="small" sx={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#FFD75A', color: '#1E1B2E', fontWeight: 600 }} />}
      </Box>
      <CardContent sx={{ px: 2, pb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3, fontWeight: 700 }}>{book.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>by {book.authors?.map((a: any) => a.author?.name || a.name).join(', ') || 'Unknown'}</Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
        <Chip label={(book.categories?.[0] as any)?.category?.name || (book.categories?.[0] as any)?.name || 'General'} size="small" variant="outlined" />
        <Box>
          <Tooltip title="View"><IconButton size="small" onClick={() => onView(book)}><EyeIcon size={18} /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(book)}><EditIcon size={18} /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => onDelete(book)}><DeleteIcon size={18} /></IconButton></Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
}

// EyeIcon already imported above

export default function BooksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [accessTierFilter, setAccessTierFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  const sortMap: Record<string, string> = { createdAt: 'newest', title: 'alphabetical', rating: 'rating', viewCount: 'popularity' };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['books', page, limit, search, sortBy, sortOrder, accessTierFilter],
    queryFn: () => api.get('/books', { params: { page: page + 1, limit, search: search || undefined, sort: sortMap[sortBy] || 'newest', accessTier: accessTierFilter === 'ALL' ? undefined : accessTierFilter } }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/books/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['books'] }); setDeleteDialog(null); addNotification('Book deleted', 'success'); },
    onError: (err: any) => addNotification(err?.response?.data?.message || 'Failed', 'error'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/bulk/books', { ids, action: 'delete' }),
    onSuccess: (res: any) => { queryClient.invalidateQueries({ queryKey: ['books'] }); setSelectedIds([]); setBulkDeleteDialog(false); addNotification(`${res.data?.data?.count || selectedIds.length} books deleted`, 'success'); },
    onError: (err: any) => { addNotification(err?.response?.data?.message || 'Failed', 'error'); setBulkDeleteDialog(false); },
  });

  if (isLoading) {
    return <FadeIn><Box><PageHeader title="Books" subtitle="Manage your catalog" actionLabel="Add Book" onAction={() => navigate('/books/new')} /><Grid container spacing={3}>{Array.from({ length: 8 }).map((_, i) => <Grid item xs={12} sm={6} md={4} lg={3} key={i}><Skeleton variant="rounded" height={280} /></Grid>)}</Grid></Box></FadeIn>;
  }

  const books: Book[] = data?.data || [];

  return (
    <FadeIn>
      <Box>
        <PageHeader title="Books" subtitle={`${(data?.meta?.total || 0).toLocaleString()} books`} actionLabel="Add Book" onAction={() => navigate('/books/new')} />
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
        {error && <Alert severity="error" sx={{ mb: 2 }}>{(error as any)?.response?.data?.message || (error as any)?.message || 'Failed'}</Alert>}
        <Grid container spacing={3}>
          {books.map((book) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
              <BookCard book={book} onEdit={(b) => navigate(`/books/${b.id}/edit`)} onView={(b) => navigate(`/books/${b.id}`)} onDelete={(b) => setDeleteDialog(b.id)} />
            </Grid>
          ))}
        </Grid>
        {(data?.meta?.total || 0) > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1 }}>
            <Button variant="outlined" size="small" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} sx={{ borderRadius: 2 }}>Previous</Button>
            <Button variant="outlined" size="small" onClick={() => setPage(page + 1)} disabled={books.length < limit} sx={{ borderRadius: 2 }}>Next</Button>
          </Box>
        )}
        <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete Book?</DialogTitle>
          <DialogContent><Typography variant="body2" color="text.secondary">Are you sure? Cannot be undone.</Typography></DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteDialog(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => deleteDialog && deleteMutation.mutate(deleteDialog)} disabled={deleteMutation.isPending} sx={{ borderRadius: 2 }}>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete {selectedIds.length} Books?</DialogTitle>
          <DialogContent><Typography variant="body2" color="text.secondary">This cannot be undone.</Typography></DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setBulkDeleteDialog(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => bulkDeleteMutation.mutate(selectedIds)} disabled={bulkDeleteMutation.isPending} sx={{ borderRadius: 2 }}>{bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </FadeIn>
  );
}
