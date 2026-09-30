import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Grid, IconButton, Tooltip, Chip, Tabs, Tab,
  Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  Alert, LinearProgress,
} from '@mui/material';
import {
  Folder, FileImage, FileAudio, FileVideo, FileText, Trash2, FolderPlus, Eye,
  Upload, RotateCcw, Pencil,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import VideoUpload from '../../components/VideoUpload/VideoUpload';
import api, { BASE_URL } from '../../services/api';

const TABS = ['All', 'image', 'audio', 'video', 'pdf', 'document'];

export default function MediaManagerPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState<{ id: string; name: string } | null>(null);
  const [previewDialog, setPreviewDialog] = useState<any>(null);
  const [folderName, setFolderName] = useState('');
  const [formError, setFormError] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [editName, setEditName] = useState('');
  const [videoUploadOpen, setVideoUploadOpen] = useState(false);

  const showRecycle = tab === TABS.length;

  const { data, isLoading } = useQuery({
    queryKey: ['media-files', page, showRecycle ? 'recycle' : TABS[tab], folderId],
    queryFn: () =>
      showRecycle
        ? api.get('/media/files', { params: { page: page + 1, limit: 20, deleted: 'true' } }).then((r) => r.data)
        : api.get('/media/files', { params: { page: page + 1, limit: 20, type: TABS[tab] === 'All' ? undefined : TABS[tab], folderId } }).then((r) => r.data),
  });

  const { data: folders } = useQuery({
    queryKey: ['media-folders', folderId],
    queryFn: () => api.get('/media/folders', { params: { parentId: folderId } }).then((r) => r.data.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['media-stats'],
    queryFn: () => api.get('/media/stats').then((r) => r.data.data),
  });

  const createFolderMutation = useMutation({
    mutationFn: (body: any) => api.post('/media/folders', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['media-folders'] }); setFolderDialogOpen(false); setFolderName(''); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/media/files/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['media-files'] }); queryClient.invalidateQueries({ queryKey: ['media-stats'] }); },
  });

  const restoreFileMutation = useMutation({
    mutationFn: (id: string) => api.post(`/media/files/${id}/restore`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['media-files'] }); queryClient.invalidateQueries({ queryKey: ['media-stats'] }); },
  });

  const updateFileMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.put(`/media/files/${id}`, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['media-files'] }); setEditDialog(null); },
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/media/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => { if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total)); },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      queryClient.invalidateQueries({ queryKey: ['media-stats'] });
      setUploadDialogOpen(false);
      setUploadFiles([]);
      setUploadProgress(0);
    },
    onError: (err: any) => { setFormError(err.response?.data?.message || 'Upload failed'); setUploading(false); },
  });

  const files = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const handleUpload = async () => {
    if (!uploadFiles.length) return;
    setUploading(true);
    setFormError('');
    for (const file of uploadFiles) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', file.name);
      if (folderId) fd.append('folderId', folderId);
      await uploadMutation.mutateAsync(fd);
    }
    setUploading(false);
    setUploadFiles([]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setUploadFiles((prev) => [...prev, ...dropped]);
    setUploadDialogOpen(true);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFiles(Array.from(e.target.files));
      setUploadDialogOpen(true);
    }
  };

  const getIcon = (type: string, size = 20) => {
    switch (type) {
      case 'image': return <FileImage size={size} />;
      case 'audio': return <FileAudio size={size} />;
      case 'video': return <FileVideo size={size} />;
      case 'pdf': return <FileText size={size} />;
      default: return <FileText size={size} />;
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <FadeIn>
      <Box>
        <PageHeader
          title="Media Manager"
          subtitle={`${stats?.totalFiles || 0} files · ${stats ? formatSize(stats.totalSize) : '0 B'} total`}
        />

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button variant="contained" startIcon={<Upload />} onClick={() => { setUploadFiles([]); setUploadDialogOpen(true); }}>
            Upload
          </Button>
          <Button variant="outlined" color="secondary" startIcon={<FileVideo />} onClick={() => setVideoUploadOpen(true)}>
            Upload Video (R2)
          </Button>
          <Button variant="outlined" startIcon={<FolderPlus />} onClick={() => { setFolderName(''); setFormError(''); setFolderDialogOpen(true); }}>
            New Folder
          </Button>
          {stats?.recycleBinCount > 0 && (
            <Chip icon={<Trash2 size={14} />} label={`${stats.recycleBinCount} in recycle bin`} color="warning" onClick={() => setTab(TABS.length)} />
          )}
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Chip label={`${stats?.totalFiles || 0} files`} color="primary" size="small" />
          <Chip label={`${stats?.folderCount || 0} folders`} size="small" />
          {(stats?.typeBreakdown || []).map((t: any) => (
            <Chip key={t.type} label={`${t.type}: ${t._count.id}`} variant="outlined" size="small" />
          ))}
        </Box>

        {/* Folders */}
        {folders && folders.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Folders</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {folders.map((f: any) => (
                <Chip
                  key={f.id}
                  icon={<Folder size={14} />}
                  label={`${f.name} (${f._count.files})`}
                  clickable
                  onClick={() => { setFolderId(f.id); setPage(0); }}
                />
              ))}
              {folderId && (
                <Chip label="← Back to root" clickable onClick={() => { setFolderId(null); setPage(0); }} />
              )}
            </Box>
          </Box>
        )}

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} sx={{ mb: 2 }}>
          {TABS.map((t) => <Tab key={t} label={t} />)}
          <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Trash2 size={14} /> Recycle</Box>} />
        </Tabs>

        {/* Drag-drop zone */}
        {tab < TABS.length && (
          <Box
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            sx={{
              border: '2px dashed',
              borderColor: dragOver ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 3,
              mb: 3,
              textAlign: 'center',
              bgcolor: dragOver ? 'primary.50' : 'grey.50',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} color={dragOver ? 'primary' : 'grey'} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Drag files here or click to browse
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
            />
          </Box>
        )}

        {/* Files Grid */}
        {isLoading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}>
                <Skeleton variant="rounded" height={140} />
              </Grid>
            ))}
          </Grid>
        ) : files.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            {showRecycle ? <Trash2 size={48} /> : <Folder size={48} />}
            <Typography sx={{ mt: 1 }}>{showRecycle ? 'Recycle bin is empty' : 'No files here'}</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {files.map((file: any) => (
              <Grid item xs={6} sm={4} md={3} key={file.id}>
                <Card sx={{ '&:hover': { boxShadow: 2 } }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, color: 'primary.main' }}>
                      {getIcon(file.type, 32)}
                    </Box>
                    <Typography variant="body2" noWrap title={file.name} fontWeight={500}>{file.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatSize(file.size)} · {file.type}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 1.5 }}>
                      {showRecycle ? (
                        <Tooltip title="Restore">
                          <IconButton size="small" color="success" onClick={() => restoreFileMutation.mutate(file.id)}>
                            <RotateCcw size={16} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <>
                          <Tooltip title="Preview">
                            <IconButton size="small" onClick={() => setPreviewDialog(file)}>
                              <Eye size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Rename">
                            <IconButton size="small" onClick={() => { setEditDialog({ id: file.id, name: file.name }); setEditName(file.name); }}>
                              <Pencil size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => deleteFileMutation.mutate(file.id)}>
                              <Trash2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">Page {page + 1} of {totalPages}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button size="small" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
            </Box>
          </Box>
        )}

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onClose={() => { if (!uploading) { setUploadDialogOpen(false); setUploadFiles([]); } }} maxWidth="sm" fullWidth>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            {uploading && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 2 }} />}
            {!uploading && (
              <Box
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); setUploadFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]); }}
                sx={{ border: '2px dashed', borderColor: 'grey.300', borderRadius: 2, p: 3, textAlign: 'center', mb: 2, cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={28} color="disabled" />
                <Typography variant="body2" color="text.secondary">Drop files or click to browse</Typography>
              </Box>
            )}
            {uploadFiles.length > 0 && (
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {uploadFiles.map((f, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                    {getIcon(f.type.split('/')[0] === 'image' ? 'image' : f.type.split('/')[0] === 'audio' ? 'audio' : f.type.split('/')[0] === 'video' ? 'video' : 'document', 16)}
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>{f.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatSize(f.size)}</Typography>
                    {!uploading && (
                      <IconButton size="small" onClick={() => setUploadFiles((prev) => prev.filter((_, j) => j !== i))}>
                        <Trash2 size={14} />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setUploadDialogOpen(false); setUploadFiles([]); }} disabled={uploading}>Cancel</Button>
            <Button variant="contained" onClick={handleUpload} disabled={!uploadFiles.length || uploading} startIcon={<Upload />}>
              {uploading ? `Uploading ${uploadProgress}%...` : `Upload ${uploadFiles.length} file(s)`}
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Folder Dialog */}
        <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)}>
          <DialogTitle>Create Folder</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <TextField fullWidth label="Folder Name" value={folderName} onChange={(e) => setFolderName(e.target.value)} sx={{ mt: 1 }} autoFocus />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createFolderMutation.mutate({ name: folderName, parentId: folderId })} variant="contained" disabled={!folderName.trim()}>
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit/Rename Dialog */}
        <Dialog open={!!editDialog} onClose={() => setEditDialog(null)}>
          <DialogTitle>Rename File</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="File Name" value={editName} onChange={(e) => setEditName(e.target.value)} sx={{ mt: 1 }} autoFocus />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={() => editDialog && updateFileMutation.mutate({ id: editDialog.id, name: editName })} variant="contained" disabled={!editName.trim() || editName === editDialog?.name}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={!!previewDialog} onClose={() => setPreviewDialog(null)} maxWidth="md" fullWidth>
          <DialogTitle>{previewDialog?.name}</DialogTitle>
          <DialogContent sx={{ textAlign: 'center', py: 4 }}>
            {previewDialog?.type === 'image' && previewDialog?.url && (
              <img src={`${BASE_URL}${previewDialog.url}`} alt={previewDialog.name} style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8 }} />
            )}
            {previewDialog?.type === 'audio' && previewDialog?.url && (
              <audio controls src={`${BASE_URL}${previewDialog.url}`} style={{ width: '100%' }} />
            )}
            {previewDialog?.type === 'video' && previewDialog?.url && (
              <video controls src={`${BASE_URL}${previewDialog.url}`} style={{ maxWidth: '100%', maxHeight: 400 }} />
            )}
            {!['image', 'audio', 'video'].includes(previewDialog?.type) && (
              <Box>
                {getIcon(previewDialog?.type || 'document', 64)}
                <Typography sx={{ mt: 2, color: 'text.secondary' }}>Preview not available for this file type</Typography>
                <Typography variant="caption" color="text.secondary">
                  Size: {formatSize(previewDialog?.size || 0)} · Type: {previewDialog?.mimeType}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialog(null)}>Close</Button>
            {previewDialog?.url && (
              <Button href={`${BASE_URL}${previewDialog.url}`} target="_blank" variant="outlined">Open in new tab</Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Video Upload — direct to Cloudflare R2 */}
        <Dialog open={videoUploadOpen} onClose={() => setVideoUploadOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Upload Video — direct to Cloudflare R2</DialogTitle>
          <DialogContent>
            <VideoUpload
              onUploaded={() => {
                queryClient.invalidateQueries({ queryKey: ['media-files'] });
                queryClient.invalidateQueries({ queryKey: ['media-stats'] });
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVideoUploadOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </FadeIn>
  );
}
