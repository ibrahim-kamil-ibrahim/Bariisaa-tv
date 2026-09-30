import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  Typography,
  Autocomplete,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../services/api';
import { Author, Category, PdfFile } from '../../types';
import FileUpload, { UploadFileEntry } from '../../components/FileUpload';
import AccessTierFields, { AccessTierValue, validateAccessTier } from '../../components/AccessTierFields';

const MAX_COVER_SIZE = 10 * 1024 * 1024;
const MAX_EBOOK_SIZE = 100 * 1024 * 1024;

const bookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  categoryIds: z.array(z.string()).default([]),
  authorIds: z.array(z.string()).default([]),
  accessTier: z.enum(['FREE', 'PAID']).default('FREE'),
  requiredPlanId: z.string().nullish().default(''),
});

type BookFormData = z.infer<typeof bookSchema>;

export default function BookFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; label: string } | null>(null);

  const [coverFiles, setCoverFiles] = useState<UploadFileEntry[]>([]);
  const [ebookFiles, setEbookFiles] = useState<UploadFileEntry[]>([]);

  const [existingPdf, setExistingPdf] = useState<PdfFile[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      categoryIds: [],
      authorIds: [],
      accessTier: 'FREE',
      requiredPlanId: '',
    },
  });

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.get('/subscriptions/plans').then((r) => r.data.data),
  });
  const planCount = Array.isArray(plansData) ? plansData.length : 0;
  const [accessTier, setAccessTier] = useState<AccessTierValue>({ accessTier: 'FREE', requiredPlanId: '' });

  const { data: bookData, isLoading: bookLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: () => api.get(`/books/${id}`).then((r) => r.data.data),
    enabled: isEdit,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories', { params: { limit: 200 } }).then((r) => r.data.data),
  });

  const { data: authorsData } = useQuery({
    queryKey: ['authors'],
    queryFn: () => api.get('/authors', { params: { limit: 200 } }).then((r) => r.data.data),
  });

  const categories: Category[] = (Array.isArray(categoriesData) ? categoriesData : []).filter(
    (c: Category, i: number, arr: Category[]) => arr.findIndex((x) => x.id === c.id) === i && !c.route
  );
  const authors: Author[] = (Array.isArray(authorsData) ? authorsData : []).filter(
    (a: Author, i: number, arr: Author[]) => arr.findIndex((x) => x.id === a.id) === i
  );

  useEffect(() => {
    if (bookData && isEdit) {
      const tier: AccessTierValue = {
        accessTier: bookData.accessTier === 'PAID' ? 'PAID' : 'FREE',
        requiredPlanId: bookData.requiredPlanId || '',
      };
      setAccessTier(tier);
      reset({
        title: bookData.title || '',
        description: bookData.description || '',
        price: bookData.price || 0,
        categoryIds: bookData.categories?.map((c: any) => c.category?.id || c.categoryId || c.id) || [],
        authorIds: bookData.authors?.map((a: any) => a.author?.id || a.authorId || a.id) || [],
        accessTier: tier.accessTier,
        requiredPlanId: tier.requiredPlanId,
      });
      if (bookData.coverUrl) {
        setCoverFiles([{
          id: 'existing-cover',
          file: new File([], bookData.coverUrl),
          progress: 100,
          status: 'done',
          previewUrl: bookData.coverUrl.startsWith('http') ? bookData.coverUrl : `${api.defaults.baseURL}/files/${bookData.coverUrl}`,
        }]);
      }
      if (bookData.pdfFiles) setExistingPdf(bookData.pdfFiles);
    }
  }, [bookData, isEdit, reset]);

  const createMutation = useMutation({
    mutationFn: (data: BookFormData) => api.post('/books', data),
    onError: (err: any) => setSubmitError(err.response?.data?.message || 'Failed to create book'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: BookFormData) => api.put(`/books/${id}`, data),
    onError: (err: any) => setSubmitError(err.response?.data?.message || 'Failed to update book'),
  });

  const uploadFileWithProgress = useCallback(
    async (url: string, formData: FormData): Promise<void> => {
      await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
    },
    []
  );

  const uploadCoverWithProgress = useCallback(
    async (bookId: string, entry: UploadFileEntry): Promise<void> => {
      const formData = new FormData();
      formData.append('image', entry.file);
      await api.put(`/books/${bookId}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
    },
    []
  );

  const uploadEbookWithProgress = useCallback(
    async (bookId: string, entry: UploadFileEntry): Promise<void> => {
      const formData = new FormData();
      formData.append('pdf', entry.file);
      await api.post(`/books/${bookId}/pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
    },
    []
  );

  const onSubmit = async (data: BookFormData) => {
    setSubmitError('');

    const tierError = validateAccessTier(accessTier, planCount);
    if (tierError) {
      setSubmitError(tierError);
      return;
    }

    const payload = {
      ...data,
      accessTier: accessTier.accessTier,
      requiredPlanId: accessTier.accessTier === 'PAID' && accessTier.requiredPlanId ? accessTier.requiredPlanId : null,
      price: data.price || undefined,
    };

    try {
      let bookId = id;
      let created = false;

      if (isEdit) {
        await updateMutation.mutateAsync(payload);
      } else {
        const res = await createMutation.mutateAsync(payload);
        bookId = res.data.data?.id;
        created = true;
      }

      if (!bookId) throw new Error('No book ID returned');

      const pendingCover = coverFiles.filter((f) => f.status !== 'done' && f.id !== 'existing-cover');
      const pendingEbook = ebookFiles.filter((f) => f.status !== 'done');
      const total = pendingCover.length + pendingEbook.length;
      let completed = 0;

      if (total === 0) {
        queryClient.invalidateQueries({ queryKey: ['books'] });
        queryClient.invalidateQueries({ queryKey: ['book', id] });
        navigate('/books');
        return;
      }

      for (const entry of pendingCover) {
        setUploadProgress({ current: ++completed, total, label: `Uploading cover...` });
        await uploadCoverWithProgress(bookId!, entry);
      }

      for (const entry of pendingEbook) {
        setUploadProgress({ current: ++completed, total, label: `Uploading ${entry.file.name}...` });
        await uploadEbookWithProgress(bookId!, entry);
      }

      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      navigate('/books');
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Upload failed');
      setUploadProgress(null);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || uploadProgress !== null;

  if (isEdit && bookLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/books')}>
          Back
        </Button>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit Book' : 'Add Book'}
        </Typography>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>
          {submitError}
        </Alert>
      )}

      {uploadProgress && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600} mb={0.5}>
            {uploadProgress.label}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(uploadProgress.current / uploadProgress.total) * 100}
            sx={{ borderRadius: 1, height: 6 }}
          />
          <Typography variant="caption" color="text.secondary" mt={0.5}>
            {uploadProgress.current} of {uploadProgress.total} files
          </Typography>
        </Box>
      )}

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Title"
                          error={!!errors.title}
                          helperText={errors.title?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Description"
                          multiline
                          rows={4}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="categoryIds"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          multiple
                          options={categories}
                          getOptionLabel={(o) => o.name}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          value={categories.filter((c) => field.value.includes(c.id))}
                          onChange={(_, newVal) => field.onChange(newVal.map((v) => v.id))}
                          renderInput={(params) => <TextField {...params} label="Categories" />}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="authorIds"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          multiple
                          options={authors}
                          getOptionLabel={(o) => o.name}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          value={authors.filter((a) => field.value.includes(a.id))}
                          onChange={(_, newVal) => field.onChange(newVal.map((v) => v.id))}
                          renderInput={(params) => <TextField {...params} label="Authors" />}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Controller
                      name="price"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label="Price" type="number" inputProps={{ step: 0.01 }} />
                      )}
                    />
                  </Grid>

                    <Grid item xs={12}>
                      <FileUpload
                        accept=".epub,.pdf"
                        maxSize={MAX_EBOOK_SIZE}
                        maxSizeMessage="Up to 100 MB"
                        label="E-Book File"
                        subtitle="Upload EPUB or PDF. One file per book."
                        files={ebookFiles}
                        onFilesChange={(files) => setEbookFiles(files.slice(0, 1))}
                        onUpload={async (entry) => {
                          if (!id && !createMutation.data) throw new Error('Create the book first');
                          const bookId = id || createMutation.data?.data?.id;
                          await uploadEbookWithProgress(bookId!, entry);
                        }}
                        multiple={false}
                        previewType="document"
                      />
                      {existingPdf.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Existing e-book: {existingPdf.length} file(s)
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  <Grid item xs={12}>
                    <AccessTierFields
                      value={accessTier}
                      onChange={(v) => {
                        setAccessTier(v);
                        setValue('accessTier', v.accessTier);
                        setValue('requiredPlanId', v.requiredPlanId);
                      }}
                      error={validateAccessTier(accessTier, planCount) || undefined}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <FileUpload
                    accept="image/jpeg,image/png,image/webp"
                    maxSize={MAX_COVER_SIZE}
                    maxSizeMessage="Up to 10 MB"
                    label="Cover Image"
                    files={coverFiles}
                    onFilesChange={(files) => setCoverFiles(files.slice(0, 1))}
                    onUpload={async (entry) => {
                      if (!id && !createMutation.data) throw new Error('Create the book first');
                      const bookId = id || createMutation.data?.data?.id;
                      await uploadCoverWithProgress(bookId!, entry);
                    }}
                    multiple={false}
                    previewType="image"
                  />
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => navigate('/books')}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isPending}>
                {isPending ? <CircularProgress size={20} /> : isEdit ? 'Update Book' : 'Create Book'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
