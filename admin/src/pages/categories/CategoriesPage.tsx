import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, IconButton, Tooltip, Typography, Card, CardContent,
  Chip, Skeleton, Grid, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Checkbox, FormControlLabel, Paper, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Avatar,
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon,
  CheckSquare, Square, Trash2, Search, X,
  ChevronLeft, ChevronRight, ImagePlus, FolderOpen, Tag,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';
import { Category } from '../../types';

function CategoryCard({ cat, onEdit, onDelete, selectMode, selected, onToggleSelect }: {
  cat: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (c: Category) => void;
}) {
  return (
    <Card
      elevation={0}
      onClick={selectMode && onToggleSelect ? () => onToggleSelect(cat) : undefined}
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
      {/* Icon area */}
      <Box sx={{ height: 140, position: 'relative', overflow: 'hidden', bgcolor: '#EEE8FA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {cat.imageUrl ? (
          <Box
            component="img"
            src={cat.imageUrl.startsWith('http') ? cat.imageUrl : `${api.defaults.baseURL}/files/${cat.imageUrl}`}
            alt={cat.name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 400ms ease', '.MuiCard-root:hover &': { transform: 'scale(1.05)' } }}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Tag size={36} color="#402083" style={{ opacity: 0.3 }} />
            <Typography variant="caption" color="#402083" sx={{ opacity: 0.5, fontWeight: 600 }}>No icon</Typography>
          </Box>
        )}

        {/* Selection checkbox */}
        {selectMode && (
          <Box
            onClick={(e) => { e.stopPropagation(); onToggleSelect?.(cat); }}
            sx={{
              position: 'absolute', top: 10, left: 10, zIndex: 2,
              backgroundColor: selected ? '#402083' : 'rgba(255,255,255,0.95)',
              borderRadius: 1.5, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'pointer', transition: 'all 150ms ease',
            }}
          >
            {selected ? <CheckSquare size={20} color="#fff" /> : <Square size={20} color="#6E6A85" />}
          </Box>
        )}

        {/* Hover actions */}
        {!selectMode && (
          <Box
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
            <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(cat)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#fff' }, width: 34, height: 34 }}><EditIcon size={16} /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => onDelete(cat)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#FDE8E8' }, width: 34, height: 34 }}><DeleteIcon size={16} /></IconButton></Tooltip>
          </Box>
        )}
      </Box>

      {/* Content */}
      <CardContent sx={{ px: 2.5, pt: 2, pb: 1, flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.35, fontSize: 15 }} noWrap>
          {cat.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontFamily="monospace" sx={{ fontSize: 11.5 }}>
          {cat.slug}
        </Typography>
      </CardContent>

      {/* Footer */}
      <Box sx={{ px: 2.5, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Chip label={`${cat.bookCount || 0} books`} size="small" variant="outlined" sx={{ fontSize: 11, height: 24, borderColor: 'rgba(64,32,131,0.2)', color: '#402083' }} />
        {cat.route && (
          <Chip label={cat.route} size="small" sx={{ fontSize: 11, height: 24, backgroundColor: '#F0EEF8', color: '#402083', fontWeight: 600 }} />
        )}
      </Box>
    </Card>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <Box sx={{ textAlign: 'center', py: 10, gridColumn: '1 / -1' }}>
      <FolderOpen size={56} color="#6E6A85" style={{ opacity: 0.4 }} />
      <Typography variant="h6" fontWeight={700} sx={{ mt: 2, mb: 0.5 }}>No categories found</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Try adjusting your search or add a new category
      </Typography>
      <Button variant="outlined" onClick={onClear} sx={{ borderRadius: 2 }}>
        Clear search
      </Button>
    </Box>
  );
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [page, setPage] = useState(0);
  const [limit] = useState(12);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formRoute, setFormRoute] = useState('');
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['categories', page, limit, search],
    queryFn: () => api.get('/categories', { params: { page: page + 1, limit, search: search || undefined } }).then((r) => r.data),
  });

  const categories: Category[] = data?.data || data || [];
  const total = data?.meta?.total || categories.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const allSelected = categories.length > 0 && selectedIds.length === categories.length;
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : categories.map((c) => c.id));

  const toggleSelect = (cat: Category) => {
    setSelectedIds((prev) => prev.includes(cat.id) ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds([]);
  };

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/categories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); addNotification('Category created', 'success'); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      api.put(`/categories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); addNotification('Category updated', 'success'); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setDeleteId(null); addNotification('Category deleted', 'success'); },
    onError: (err: any) => { setFormError(err.response?.data?.message || 'Cannot delete category'); setDeleteId(null); },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api.delete(`/categories/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSelectedIds([]);
      setSelectMode(false);
      setBulkDeleteDialog(false);
      addNotification(`${selectedIds.length} categories deleted`, 'success');
    },
    onError: (err: any) => { addNotification(err?.response?.data?.message || 'Failed'); setBulkDeleteDialog(false); },
  });

  const handleOpen = (item?: Category) => {
    if (item) {
      setEditItem(item);
      setFormName(item.name);
      setFormRoute(item.route || '');
      setFormImagePreview(item.imageUrl || '');
    } else {
      setEditItem(null);
      setFormName('');
      setFormRoute('');
      setFormImagePreview('');
    }
    setFormImageFile(null);
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditItem(null);
    setFormName('');
    setFormRoute('');
    setFormImageFile(null);
    setFormImagePreview('');
    setFormError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImageFile(file);
      setFormImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    if (!formName.trim()) {
      setFormError('Name is required');
      return;
    }
    const formData = new FormData();
    formData.append('name', formName);
    if (formRoute) formData.append('route', formRoute);
    if (formImageFile) formData.append('image', formImageFile);

    if (editItem) {
      updateMutation.mutate({ id: editItem.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <FadeIn>
        <Box>
          <PageHeader title="Categories" subtitle="Organize books into categories" actionLabel="Add Category" onAction={() => handleOpen()} />
          <Grid container spacing={3}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
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
        <PageHeader
          title="Categories"
          subtitle={`${total.toLocaleString()} categories`}
          actionLabel="Add Category"
          onAction={() => handleOpen()}
        />

        {/* Toolbar */}
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 3, borderRadius: 3, border: '1px solid rgba(30,27,46,0.06)', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search categories..."
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

          {/* Select toggle */}
          <Box sx={{ ml: 'auto' }}>
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
              {selectedIds.length} of {categories.length} selected
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

        {formError && !dialogOpen && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>
            {formError}
          </Alert>
        )}

        {/* Category grid */}
        {categories.length === 0 ? (
          <EmptyState onClear={() => setSearch('')} />
        ) : (
          <Grid container spacing={3}>
            {categories.map((cat) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id}>
                <CategoryCard
                  cat={cat}
                  onEdit={(c) => handleOpen(c)}
                  onDelete={(c) => setDeleteId(c.id)}
                  selectMode={selectMode}
                  selected={selectedIds.includes(cat.id)}
                  onToggleSelect={toggleSelect}
                />
              </Grid>
            ))}
          </Grid>
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
              disabled={categories.length < limit}
              sx={{ borderRadius: 2 }}
            >
              Next
            </Button>
          </Box>
        )}

        {/* Category Form Modal — only Name, Route, Icon */}
        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editItem ? 'Edit Category' : 'Add Category'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              required
              fullWidth
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              sx={{ mb: 2.5 }}
            />

            <FormControl fullWidth margin="dense" sx={{ mb: 2.5 }}>
              <InputLabel>Route</InputLabel>
              <Select value={formRoute} label="Route" onChange={(e) => setFormRoute(e.target.value)}>
                <MenuItem value=""><em>None (Book Category)</em></MenuItem>
                <MenuItem value="/books">📚 /books</MenuItem>
                <MenuItem value="/storytelling">📖 /storytelling</MenuItem>
                <MenuItem value="/music">🎵 /music</MenuItem>
                <MenuItem value="/my-doctor">🏥 /my-doctor</MenuItem>
                <MenuItem value="/my-captain">🏆 /my-captain</MenuItem>
                <MenuItem value="/habits">✅ /habits</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                Icon <Typography component="span" variant="caption" color="text.secondary" fontWeight={400}>(image from folder)</Typography>
              </Typography>
              {formImagePreview && (
                <Box sx={{ mb: 1.5, textAlign: 'center' }}>
                  <Box
                    component="img"
                    src={formImagePreview}
                    alt="Preview"
                    sx={{ maxWidth: '100%', maxHeight: 140, borderRadius: 2, objectFit: 'cover', border: '1px solid rgba(30,27,46,0.08)' }}
                  />
                </Box>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ImagePlus size={18} />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ borderRadius: 2, textTransform: 'none', py: 1.25 }}
              >
                {formImagePreview ? 'Change Icon' : 'Upload Icon from Folder'}
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete Category?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteId(null)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} sx={{ borderRadius: 2, textTransform: 'none' }}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk delete dialog */}
        <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete {selectedIds.length} Categories?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setBulkDeleteDialog(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => bulkDeleteMutation.mutate(selectedIds)} disabled={bulkDeleteMutation.isPending} sx={{ borderRadius: 2, textTransform: 'none' }}>
              {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </FadeIn>
  );
}
