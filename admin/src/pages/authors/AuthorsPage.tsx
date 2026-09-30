import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DataTable, { Column } from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FadeIn from '../../components/FadeIn';
import FormModal from '../../components/FormModal';
import FormTextField from '../../components/FormTextField';
import api from '../../services/api';
import { Author } from '../../types';

export default function AuthorsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Author | null>(null);
  const [formName, setFormName] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formPhoto, setFormPhoto] = useState('');
  const [formPhotoFile, setFormPhotoFile] = useState<File | null>(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['authors', page, limit, search],
    queryFn: () =>
      api.get('/authors', { params: { page: page + 1, limit, search: search || undefined } }).then((r) => r.data),
  });

  const authors: Author[] = data?.data || data || [];

  const createMutation = useMutation({
    mutationFn: (body: { name: string; bio?: string; photo?: string }) => api.post('/authors', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['authors'] }); handleClose(); },
  });

  const updateMutation = useMutation({
    mutationFn: (body: { id: string; name: string; bio?: string; photo?: string }) =>
      api.put(`/authors/${body.id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['authors'] }); handleClose(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/authors/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['authors'] }); setDeleteId(null); },
  });

  const handleOpen = (item?: Author) => {
    if (item) {
      setEditItem(item);
      setFormName(item.name);
      setFormBio(item.bio || '');
      setFormPhoto(item.photoUrl || '');
      setFormPhotoPreview(item.photoUrl || '');
    } else {
      setEditItem(null);
      setFormName('');
      setFormBio('');
      setFormPhoto('');
      setFormPhotoPreview('');
    }
    setFormPhotoFile(null);
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditItem(null);
    setFormName('');
    setFormBio('');
    setFormPhoto('');
    setFormPhotoPreview('');
    setFormPhotoFile(null);
    setFormError('');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormPhotoFile(file);
      setFormPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (authorId: string): Promise<string | null> => {
    if (!formPhotoFile) return formPhoto || null;
    const formData = new FormData();
    formData.append('image', formPhotoFile);
    const res = await api.put(`/authors/${authorId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data?.photoUrl || null;
  };

  const handleSave = async () => {
    if (!formName.trim()) { setFormError('Name is required'); return; }
    setFormError('');
    try {
      if (editItem) {
        let photoUrl = formPhoto;
        if (formPhotoFile) {
          const res = await api.put(`/authors/${editItem.id}/photo`, createFormData(), {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          photoUrl = res.data.data?.photoUrl || formPhoto;
        }
        await updateMutation.mutateAsync({ id: editItem.id, name: formName, bio: formBio, photo: photoUrl });
      } else {
        const res = await createMutation.mutateAsync({ name: formName, bio: formBio, photo: formPhotoFile ? '' : formPhoto });
        const authorId = res.data.data?.id;
        if (formPhotoFile && authorId) {
          await api.put(`/authors/${authorId}/photo`, createFormData(), {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Error saving author');
    }
  };

  const createFormData = () => {
    const fd = new FormData();
    if (formPhotoFile) fd.append('image', formPhotoFile);
    return fd;
  };

  const columns: Column<Author>[] = [
    {
      id: 'photo',
      label: 'Photo',
      render: (row) => (
        <Avatar src={row.photoUrl || ''} sx={{ width: 36, height: 36 }}>
          {row.name?.charAt(0)}
        </Avatar>
      ),
    },
    { id: 'name', label: 'Name', sortable: true, render: (row) => <Typography variant="body2" fontWeight={500}>{row.name}</Typography> },
    { id: 'bio', label: 'Bio', render: (row) => <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>{row.bio || '-'}</Typography> },
    { id: 'bookCount', label: 'Books', render: (row) => <Chip label={row.bookCount || 0} size="small" /> },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
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
      <PageHeader
        title="Authors"
        subtitle="Manage book and music authors"
        actionLabel="Add Author"
        onAction={() => handleOpen()}
      />

      <DataTable
        columns={columns}
        rows={authors}
        total={data?.meta?.total ?? authors.length}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        search={search}
        onSearchChange={setSearch}
        loading={isLoading}
        error={isError ? (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load authors' : null}
        getRowId={(r) => r.id}
      />

      <FormModal
        open={dialogOpen}
        title={editItem ? 'Edit Author' : 'Add Author'}
        subtitle="Manage book and music authors"
        onClose={handleClose}
        onSubmit={handleSave}
        loading={createMutation.isPending || updateMutation.isPending}
        error={formError || null}
      >
        <FormTextField required label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus />
        <FormTextField label="Bio" value={formBio} onChange={(e) => setFormBio(e.target.value)} multiline rows={3} />
        {formPhotoPreview && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar src={formPhotoPreview} sx={{ width: 80, height: 80 }} />
          </Box>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
        <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => fileInputRef.current?.click()} fullWidth sx={{ mb: 2 }}>
          {formPhotoPreview ? 'Change Photo' : 'Upload Photo'}
        </Button>
      </FormModal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Author"
        message="Are you sure you want to delete this author? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
        destructive
      />
    </Box>
    </FadeIn>
  );
}
