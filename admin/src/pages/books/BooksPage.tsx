import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, IconButton, Tooltip, Typography, Card, CardContent,
  CardActions, Chip, Skeleton, Grid, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Checkbox, FormControlLabel, Paper, InputAdornment,
  MenuItem, Menu, ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, Eye as EyeIcon,
  CheckSquare, Square, Trash2, Search, SlidersHorizontal, X,
  ChevronLeft, ChevronRight, BookOpen, FolderOpen, LayoutGrid, List,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';
import { Book } from '../../types';

function BookCard({ book, onEdit, onView, onDelete, selectMode, selected, onToggleSelect }: {
  book: Book;
  onEdit: (b: Book) => void;
  onView: (b: Book) => void;
  onDelete: (b: Book) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (b: Book) => void;
}) {
  const s = (book.status || '').toUpperCase();
  const coverUrl = book.coverUrl || (book as any).cover_url;
  const authorNames = book.authors?.map((a: any) => a.author?.name || a.name).join(', ') || 'Unknown';
  const categoryName = (book.categories?.[0] as any)?.category?.name || (book.categories?.[0] as any)?.name || 'General';

  return (
    <Card
      elevation={0}
      onClick={selectMode && onToggleSelect ? () => onToggleSelect(book) : undefined}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        cursor: selectMode ? 'pointer' : 'default',
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        border: selected ? '2px solid #402083' : '1px solid rgba(30,27,46,0.06)',
        boxShadow: selected ? '0 8px 24px rgba(64,32,131,0.15)' : 'none',
        '&:hover': selectMode
          ? { boxShadow: selected ? '0 8px 24px rgba(64,32,131,0.15)' : '0 4px 12px rgba(30,27,46,0.08)' }
          : { transform: 'translateY(-6px)', boxShadow: '0 16px 40px rgba(30,27,46,0.12)', borderColor: 'rgba(64,32,131,0.15)' },
      }}
    >
      {/* Cover */}
      <Box sx={{ height: 220, position: 'relative', overflow: 'hidden', bgcolor: '#EEE8FA', flexShrink: 0 }}>
        {coverUrl ? (
          <Box
            component="img"
            src={coverUrl.startsWith('http') ? coverUrl : `${api.defaults.baseURL}/files/${coverUrl}`}
            alt={book.title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 400ms ease', '.MuiCard-root:hover &': { transform: 'scale(1.05)' } }}
          />
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <BookOpen size={40} color="#402083" style={{ opacity: 0.3 }} />
            <Typography variant="caption" color="#402083" sx={{ opacity: 0.5, fontWeight: 600 }}>No cover</Typography>
          </Box>
        )}

        {/* Selection checkbox */}
        {selectMode && (
          <Box
            onClick={(e) => { e.stopPropagation(); onToggleSelect?.(book); }}
            sx={{
              position: 'absolute', top: 10, left: 10, zIndex: 2,
              backgroundColor: selected ? '#402083' : 'rgba(255,255,255,0.95)',
              borderRadius: 1.5, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {selected ? <CheckSquare size={20} color="#fff" /> : <Square size={20} color="#6E6A85" />}
          </Box>
        )}

        {/* Status + tier badges */}
        <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 0.75, zIndex: 1 }}>
          <Chip
            label={s === 'PUBLISHED' ? 'Published' : s === 'DRAFT' ? 'Draft' : s}
            size="small"
            sx={{
              height: 24, fontSize: 11, fontWeight: 700,
              backgroundColor: s === 'PUBLISHED' ? '#059669' : s === 'DRAFT' ? '#6E6A85' : '#B45309',
              color: '#fff',
            }}
          />
          {book.accessTier === 'PAID' && (
            <Chip label="Paid" size="small" sx={{ height: 24, fontSize: 11, fontWeight: 700, backgroundColor: '#402083', color: '#fff' }} />
          )}
        </Box>

        {/* Featured badge */}
        {book.isFeatured && !selectMode && (
          <Chip label="Featured" size="small" sx={{ position: 'absolute', bottom: 10, right: 10, height: 24, fontSize: 11, fontWeight: 700, backgroundColor: '#FFD75A', color: '#1E1B2E' }} />
        )}

        {/* Hover action overlay */}
        {!selectMode && (
          <Box
            className="card-actions-overlay"
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', gap: 1, p: 1.5,
              background: 'linear-gradient(transparent, rgba(30,27,46,0.7))',
              opacity: 0, transform: 'translateY(8px)',
              transition: 'all 250ms ease',
              '.MuiCard-root:hover &': { opacity: 1, transform: 'translateY(0)' },
            }}
          >
            <Tooltip title="View"><IconButton size="small" onClick={() => onView(book)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#fff' }, width: 34, height: 34 }}><EyeIcon size={16} /></IconButton></Tooltip>
            <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(book)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#fff' }, width: 34, height: 34 }}><EditIcon size={16} /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => onDelete(book)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#FDE8E8' }, width: 34, height: 34 }}><DeleteIcon size={16} /></IconButton></Tooltip>
          </Box>
        )}
      </Box>

      {/* Content */}
      <CardContent sx={{ px: 2.5, pt: 2, pb: 1, flex: 1 }}>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{
            lineHeight: 1.35, fontSize: 15,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            minHeight: 42,
          }}
        >
          {book.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, fontSize: 13 }}>
          by {authorNames}
        </Typography>
      </CardContent>

      {/* Footer */}
      <CardActions sx={{ px: 2.5, pb: 2, pt: 0, justifyContent: 'space-between' }}>
        <Chip label={categoryName} size="small" variant="outlined" sx={{ fontSize: 11, height: 24, borderColor: 'rgba(64,32,131,0.2)', color: '#402083' }} />
        {typeof (book as any).viewCount === 'number' && (book as any).viewCount > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
            {(book as any).viewCount.toLocaleString()} views
          </Typography>
        )}
      </CardActions>
    </Card>
  );
}

function BookListItem({ book, onEdit, onView, onDelete, selectMode, selected, onToggleSelect }: {
  book: Book;
  onEdit: (b: Book) => void;
  onView: (b: Book) => void;
  onDelete: (b: Book) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (b: Book) => void;
}) {
  const s = (book.status || '').toUpperCase();
  const coverUrl = book.coverUrl || (book as any).cover_url;
  const authorNames = book.authors?.map((a: any) => a.author?.name || a.name).join(', ') || 'Unknown';
  const categoryName = (book.categories?.[0] as any)?.category?.name || (book.categories?.[0] as any)?.name || 'General';

  return (
    <Card
      elevation={0}
      onClick={selectMode && onToggleSelect ? () => onToggleSelect(book) : undefined}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2.5,
        p: 1.5,
        borderRadius: 3,
        cursor: selectMode ? 'pointer' : 'default',
        transition: 'all 200ms ease',
        border: selected ? '2px solid #402083' : '1px solid rgba(30,27,46,0.06)',
        boxShadow: selected ? '0 4px 16px rgba(64,32,131,0.12)' : 'none',
        '&:hover': { backgroundColor: selectMode && selected ? '#F6F3FF' : 'rgba(30,27,46,0.02)' },
      }}
    >
      {/* Selection checkbox */}
      {selectMode && (
        <Box
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(book); }}
          sx={{
            flexShrink: 0, width: 28, height: 28, borderRadius: 1.5,
            backgroundColor: selected ? '#402083' : '#F0EEF8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 150ms ease',
          }}
        >
          {selected ? <CheckSquare size={18} color="#fff" /> : <Square size={18} color="#6E6A85" />}
        </Box>
      )}

      {/* Cover thumbnail */}
      <Box sx={{ width: 56, height: 80, borderRadius: 1.5, overflow: 'hidden', flexShrink: 0, bgcolor: '#EEE8FA' }}>
        {coverUrl ? (
          <Box
            component="img"
            src={coverUrl.startsWith('http') ? coverUrl : `${api.defaults.baseURL}/files/${coverUrl}`}
            alt={book.title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} color="#402083" style={{ opacity: 0.35 }} />
          </Box>
        )}
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ fontSize: 14 }}>
          {book.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: 12.5, mt: 0.25 }}>
          by {authorNames}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Chip label={categoryName} size="small" variant="outlined" sx={{ height: 22, fontSize: 11, borderColor: 'rgba(64,32,131,0.2)', color: '#402083' }} />
          {book.accessTier === 'PAID' && (
            <Chip label="Paid" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 600, backgroundColor: '#402083', color: '#fff' }} />
          )}
          {book.isFeatured && (
            <Chip label="Featured" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 600, backgroundColor: '#FFD75A', color: '#1E1B2E' }} />
          )}
        </Box>
      </Box>

      {/* Status */}
      <Chip
        label={s === 'PUBLISHED' ? 'Published' : s === 'DRAFT' ? 'Draft' : s}
        size="small"
        sx={{
          flexShrink: 0, height: 24, fontSize: 11, fontWeight: 700,
          backgroundColor: s === 'PUBLISHED' ? '#059669' : s === 'DRAFT' ? '#6E6A85' : '#B45309',
          color: '#fff',
        }}
      />

      {/* Views */}
      {typeof (book as any).viewCount === 'number' && (book as any).viewCount > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: 12, display: { xs: 'none', md: 'block' } }}>
          {(book as any).viewCount.toLocaleString()} views
        </Typography>
      )}

      {/* Actions */}
      {!selectMode && (
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Tooltip title="View"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onView(book); }}><EyeIcon size={17} /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(book); }}><EditIcon size={17} /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(book); }}><DeleteIcon size={17} /></IconButton></Tooltip>
        </Box>
      )}
    </Card>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <Box sx={{ textAlign: 'center', py: 10, gridColumn: '1 / -1' }}>
      <FolderOpen size={56} color="#6E6A85" style={{ opacity: 0.4 }} />
      <Typography variant="h6" fontWeight={700} sx={{ mt: 2, mb: 0.5 }}>No books found</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Try adjusting your search or filters
      </Typography>
      <Button variant="outlined" onClick={onClear} sx={{ borderRadius: 2 }}>
        Clear filters
      </Button>
    </Box>
  );
}

export default function BooksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [page, setPage] = useState(0);
  const [limit] = useState(12);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [accessTierFilter, setAccessTierFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const toggleSelect = (book: Book) => {
    setSelectedIds((prev) => prev.includes(book.id) ? prev.filter((id) => id !== book.id) : [...prev, book.id]);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds([]);
  };

  const clearFilters = () => {
    setSearch('');
    setAccessTierFilter('ALL');
    setSortBy('newest');
    setPage(0);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['books', page, limit, search, sortBy, accessTierFilter],
    queryFn: () => api.get('/books', {
      params: {
        page: page + 1,
        limit,
        search: search || undefined,
        sort: sortBy,
        accessTier: accessTierFilter === 'ALL' ? undefined : accessTierFilter,
      },
    }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/books/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['books'] }); setDeleteDialog(null); addNotification('Book deleted', 'success'); },
    onError: (err: any) => addNotification(err?.response?.data?.message || 'Failed', 'error'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/bulk/books', { ids, action: 'delete' }),
    onSuccess: (res: any) => { queryClient.invalidateQueries({ queryKey: ['books'] }); setSelectedIds([]); setSelectMode(false); setBulkDeleteDialog(false); addNotification(`${res.data?.data?.count || selectedIds.length} books deleted`, 'success'); },
    onError: (err: any) => { addNotification(err?.response?.data?.message || 'Failed', 'error'); setBulkDeleteDialog(false); },
  });

  const books: Book[] = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const allSelected = books.length > 0 && selectedIds.length === books.length;
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : books.map((b) => b.id));
  const hasFilters = search !== '' || accessTierFilter !== 'ALL';

  const sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'alphabetical', label: 'A → Z' },
    { value: 'rating', label: 'Top rated' },
    { value: 'popularity', label: 'Most popular' },
  ];
  const sortLabel = sortOptions.find((o) => o.value === sortBy)?.label || 'Newest first';

  if (isLoading) {
    return (
      <FadeIn>
        <Box>
          <PageHeader title="Books" subtitle="Manage your catalog" actionLabel="Add Book" onAction={() => navigate('/books/new')} />
          <Grid container spacing={3}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <Box>
        <PageHeader title="Books" subtitle={`${total.toLocaleString()} books in your catalog`} actionLabel="Add Book" onAction={() => navigate('/books/new')} />

        {/* Toolbar */}
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 3, borderRadius: 3, border: '1px solid rgba(30,27,46,0.06)', flexWrap: 'wrap' }}>
          {/* Search */}
          <TextField
            placeholder="Search books..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small"
            sx={{ flex: 1, minWidth: 200, maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#6E6A85" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.5 }}>
                    <X size={16} color="#6E6A85" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: { borderRadius: 2, fontSize: 14, backgroundColor: '#F5F4FA', '&:hover': { backgroundColor: '#F0EEF8' }, '&.Mui-focused': { backgroundColor: '#fff' } },
            }}
          />

          {/* Tier filter */}
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {(['ALL', 'FREE', 'PAID'] as const).map((tier) => (
              <Chip
                key={tier}
                label={tier === 'ALL' ? 'All' : tier === 'FREE' ? 'Free' : 'Paid'}
                onClick={() => { setAccessTierFilter(tier); setPage(0); }}
                color={accessTierFilter === tier ? 'primary' : 'default'}
                variant={accessTierFilter === tier ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: 600, fontSize: 12 }}
              />
            ))}
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Sort */}
          <Button
            size="small"
            startIcon={<SlidersHorizontal size={15} />}
            onClick={(e) => setSortAnchor(e.currentTarget)}
            sx={{ borderRadius: 2, color: 'text.secondary', fontSize: 13, fontWeight: 600, textTransform: 'none' }}
          >
            {sortLabel}
          </Button>
          <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)} PaperProps={{ sx: { borderRadius: 2, minWidth: 180 } }}>
            {sortOptions.map((opt) => (
              <MenuItem
                key={opt.value}
                selected={sortBy === opt.value}
                onClick={() => { setSortBy(opt.value); setPage(0); setSortAnchor(null); }}
                sx={{ fontSize: 14, borderRadius: 1, mx: 0.5 }}
              >
                {opt.label}
              </MenuItem>
            ))}
          </Menu>

          {/* View toggle + Select */}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', border: '1px solid rgba(30,27,46,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <IconButton
                size="small"
                onClick={() => setViewMode('grid')}
                sx={{
                  borderRadius: 0, px: 1.25, py: 0.75,
                  backgroundColor: viewMode === 'grid' ? '#402083' : 'transparent',
                  color: viewMode === 'grid' ? '#fff' : '#6E6A85',
                  '&:hover': { backgroundColor: viewMode === 'grid' ? '#402083' : '#F0EEF8' },
                }}
              >
                <LayoutGrid size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setViewMode('list')}
                sx={{
                  borderRadius: 0, px: 1.25, py: 0.75,
                  backgroundColor: viewMode === 'list' ? '#402083' : 'transparent',
                  color: viewMode === 'list' ? '#fff' : '#6E6A85',
                  '&:hover': { backgroundColor: viewMode === 'list' ? '#402083' : '#F0EEF8' },
                }}
              >
                <List size={16} />
              </IconButton>
            </Box>
            <Chip
              label={selectMode ? 'Cancel' : 'Select'}
              onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
              color={selectMode ? 'default' : 'primary'}
              variant={selectMode ? 'outlined' : 'filled'}
              size="small"
              icon={selectMode ? undefined : <Square size={14} />}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Paper>

        {/* Bulk action bar */}
        {selectMode && (
          <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <FormControlLabel
              control={<Checkbox checked={allSelected} onChange={toggleSelectAll} size="small" />}
              label={<Typography variant="body2" fontWeight={600}>Select all</Typography>}
            />
            <Typography variant="body2" color="text.secondary">
              {selectedIds.length} of {books.length} selected
            </Typography>
            {selectedIds.length > 0 && (
              <Button
                size="small"
                color="error"
                startIcon={<Trash2 size={16} />}
                onClick={() => setBulkDeleteDialog(true)}
                sx={{ ml: 'auto', borderRadius: 2 }}
              >
                Delete ({selectedIds.length})
              </Button>
            )}
          </Paper>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{(error as any)?.response?.data?.message || (error as any)?.message || 'Failed'}</Alert>}

        {/* Book grid / list */}
        {books.length === 0 ? (
          <EmptyState onClear={clearFilters} />
        ) : viewMode === 'grid' ? (
          <Grid container spacing={3}>
            {books.map((book) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                <BookCard
                  book={book}
                  onEdit={(b) => navigate(`/books/${b.id}/edit`)}
                  onView={(b) => navigate(`/books/${b.id}`)}
                  onDelete={(b) => setDeleteDialog(b.id)}
                  selectMode={selectMode}
                  selected={selectedIds.includes(book.id)}
                  onToggleSelect={toggleSelect}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {books.map((book) => (
              <BookListItem
                key={book.id}
                book={book}
                onEdit={(b) => navigate(`/books/${b.id}/edit`)}
                onView={(b) => navigate(`/books/${b.id}`)}
                onDelete={(b) => setDeleteDialog(b.id)}
                selectMode={selectMode}
                selected={selectedIds.includes(book.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </Box>
        )}

        {/* Pagination */}
        {total > limit && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 4, gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ChevronLeft size={16} />}
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              sx={{ borderRadius: 2 }}
            >
              Previous
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Page {page + 1} of {totalPages}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              endIcon={<ChevronRight size={16} />}
              onClick={() => setPage(page + 1)}
              disabled={books.length < limit}
              sx={{ borderRadius: 2 }}
            >
              Next
            </Button>
          </Box>
        )}

        {/* Delete dialog */}
        <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete Book?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteDialog(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => deleteDialog && deleteMutation.mutate(deleteDialog)} disabled={deleteMutation.isPending} sx={{ borderRadius: 2 }}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk delete dialog */}
        <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete {selectedIds.length} Books?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setBulkDeleteDialog(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => bulkDeleteMutation.mutate(selectedIds)} disabled={bulkDeleteMutation.isPending} sx={{ borderRadius: 2 }}>
              {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </FadeIn>
  );
}
