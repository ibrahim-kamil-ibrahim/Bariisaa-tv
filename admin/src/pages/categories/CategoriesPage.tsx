import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Upload as UploadIcon,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';
import { Category } from '../../types';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIconEmoji, setFormIconEmoji] = useState('');
  const [formRoute, setFormRoute] = useState('');
  const [formSortOrder, setFormSortOrder] = useState('0');
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['categories', page, limit, search],
    queryFn: () =>
      api.get('/categories', { params: { page: page + 1, limit, search: search || undefined } }).then((r) => r.data),
  });

  const categories: Category[] = data?.data || data || [];

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/categories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      api.put(`/categories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setDeleteId(null); },
    onError: (err: any) => { setFormError(err.response?.data?.message || 'Cannot delete category'); setDeleteId(null); },
  });

  const handleOpen = (item?: Category) => {
    if (item) {
      setEditItem(item);
      setFormName(item.name);
      setFormDescription(item.description || '');
      setFormIconEmoji(item.iconEmoji || '');
      setFormRoute(item.route || '');
      setFormSortOrder(String(item.sortOrder || 0));
      setFormImagePreview(item.imageUrl || '');
    } else {
      setEditItem(null);
      setFormName('');
      setFormDescription('');
      setFormIconEmoji('');
      setFormRoute('');
      setFormSortOrder('0');
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
    setFormDescription('');
    setFormIconEmoji('');
    setFormRoute('');
    setFormSortOrder('0');
    setFormImageFile(null);
    setFormImagePreview('');
    setFormError('');
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
    if (formDescription) formData.append('description', formDescription);
    if (formIconEmoji) formData.append('iconEmoji', formIconEmoji);
    if (formRoute) formData.append('route', formRoute);
    formData.append('sortOrder', formSortOrder);
    if (formImageFile) formData.append('image', formImageFile);

    if (editItem) {
      updateMutation.mutate({ id: editItem.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Category card grid columns
  const columns: any[] = [
    { id: 'image', label: '', render: (row: Category) => (
      <Avatar src={row.imageUrl} sx={{ width: 48, height: 48, bgcolor: 'gold' }}>
        {row.iconEmoji || '📚'}
      </Avatar>
    )},
    { id: 'name', label: 'Name', render: (row: Category) => (
      <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
    )},
    { id: 'slug', label: 'Slug', render: (row: Category) => (
      <Typography variant="caption" color="text.secondary" fontFamily="monospace">{row.slug}</Typography>
    )},
    { id: 'description', label: 'Description', render: (row: Category) => (
      <Typography variant="body2" sx={{ maxWidth: 200 }}>{row.description || '-'}</Typography>
    )},
    { id: 'bookCount', label: 'Books', render: (row: Category) => (
      <Chip label={String(row.bookCount || 0)} size="small" variant="outlined" />
    )},
    { id: 'sortOrder', label: 'Order', render: (row: Category) => (
      <Typography variant="body2" fontWeight={600}>{row.sortOrder}</Typography>
    )},
    { id: 'actions', label: '', align: 'right' as const, render: (row: Category) => (
      <Box>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
      </Box>
    )},
  ];

  return (
    <FadeIn>
      <Box>
        <PageHeader
          title="Categories"
          subtitle="Organize books into categories"
          actionLabel="Add Category"
          onAction={() => handleOpen()}
        />

        {formError && !dialogOpen && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>
            {formError}
          </Alert>
        )}

        {/* Category Grid Cards */}
        <Grid container spacing={3}>
          {categories.map((cat) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  transition: 'all 300ms ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(30,27,46,0.12)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar src={cat.imageUrl} sx={{ width: 56, height: 56, bgcolor: 'gold' }}>
                      {cat.iconEmoji || '📚'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>{cat.name}</Typography>
                      <Typography variant="caption" color="text.secondary" fontFamily="monospace">{cat.slug}</Typography>
                    </Box>
                  </Box>
                  {cat.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {cat.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`${cat.bookCount || 0} books`} size="small" variant="outlined" />
                    <Chip label={`Order: ${cat.sortOrder}`} size="small" variant="outlined" />
                  </Box>
                </CardContent>
                <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleOpen(cat)}
                    sx={{ borderRadius: 2, textTransform: 'none', flex: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => setDeleteId(cat.id)}
                    sx={{ borderRadius: 2, textTransform: 'none', flex: 1 }}
                  >
                    Delete
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {(data?.meta?.total || 0) > limit && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1 }}>
            <Button variant="outlined" size="small" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} sx={{ borderRadius: 2 }}>
              Previous
            </Button>
            <Button variant="outlined" size="small" onClick={() => setPage(page + 1)} disabled={categories.length < limit} sx={{ borderRadius: 2 }}>
              Next
            </Button>
          </Box>
        )}

        {/* Category Form Modal */}
        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editItem ? 'Edit Category' : 'Add Category'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              fullWidth
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Emoji Icon"
                value={formIconEmoji}
                onChange={(e) => setFormIconEmoji(e.target.value)}
                placeholder="📖"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Sort Order"
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(e.target.value)}
                sx={{ flex: 1 }}
              />
            </Box>
            <FormControl fullWidth margin="dense">
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
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Category Image</Typography>
              {formImagePreview && (
                <Box sx={{ mb: 1, textAlign: 'center' }}>
                  <img src={formImagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 8, objectFit: 'cover' }} />
                </Box>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
              <Button variant="outlined" fullWidth startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()} sx={{ borderRadius: 2, textTransform: 'none' }}>
                {formImagePreview ? 'Change Image' : 'Upload Image'}
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} sx={{ borderRadius: 2, textTransform: 'none' }}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete Category?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to delete this category? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteId(null)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} sx={{ borderRadius: 2, textTransform: 'none' }}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </FadeIn>
  );
}
