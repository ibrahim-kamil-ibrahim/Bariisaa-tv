import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Button,
  Alert,
  TextField,
  Stack,
} from '@mui/material';
import { Upload, X, FileVideo, RotateCcw } from 'lucide-react';
import api from '../../services/api';

/**
 * Video upload with two storage modes:
 *
 *   1. POST /media/videos/upload-url → { mode: 'r2' | 'local', mediaId, uploadUrl }
 *   2. PUT the bytes:
 *        r2     → straight to the presigned R2 URL (bytes never hit our server)
 *        local  → PUT /media/videos/:id/local-upload on our backend (fallback
 *                 when R2 credentials are missing/placeholder)
 *   3. POST /media/videos/:id/complete → backend verifies the object exists
 *
 * The client flow is identical in both modes; only the PUT target differs.
 */

interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'requesting' | 'uploading' | 'finalizing' | 'done' | 'error';
  error?: string;
  mediaId?: string;
  xhr?: XMLHttpRequest;
}

interface VideoUploadProps {
  onUploaded?: (video: { mediaId: string; name: string }) => void;
  /** Reports whether an upload is in flight (parents can gate Save on it). */
  onUploadingChange?: (uploading: boolean) => void;
  /**
   * Locks the upload to a piece of content (scope field is hidden).
   * When omitted, a manual "Book ID" field is shown.
   */
  scope?: { type: 'book' | 'story'; id: string };
  /**
   * Visibility recorded on the MediaFile. Defaults to PREMIUM (historical
   * behaviour for manual uploads in the Media Library).
   */
  visibility?: 'PUBLIC' | 'PREMIUM';
  /** Hides the manual "Book ID" field (for callers that own their own scope UI). */
  hideScopeField?: boolean;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export default function VideoUpload({ onUploaded, onUploadingChange, scope, visibility, hideScopeField }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [bookId, setBookId] = useState('');

  const updateTask = useCallback((id: string, patch: Partial<UploadTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const uploading = tasks.some((t) => t.status === 'requesting' || t.status === 'uploading' || t.status === 'finalizing');
  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    const newTasks: UploadTask[] = list.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'pending',
    }));
    setTasks((prev) => [...prev, ...newTasks]);
    // Picking a file IS the intent to upload — start immediately.
    newTasks.forEach((t) => runTask(t));
  };

  const requestUploadUrl = async (task: UploadTask) => {
    const scopeField: { bookId?: string; storyId?: string } = {};
    if (scope?.type === 'story') scopeField.storyId = scope.id;
    else if (scope?.type === 'book') scopeField.bookId = scope.id;
    else if (bookId.trim()) scopeField.bookId = bookId.trim();

    const { data } = await api.post('/media/videos/upload-url', {
      fileName: task.file.name,
      contentType: task.file.type || 'video/mp4',
      fileSize: task.file.size,
      ...scopeField,
      ...(visibility ? { visibility } : {}),
    });
    return data.data as { mediaId: string; objectKey: string; uploadUrl: string | null; expiresIn: number | null; mode?: 'r2' | 'local' };
  };

  const putToR2 = (task: UploadTask, uploadUrl: string, contentType: string) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          updateTask(task.id, { progress: Math.round((e.loaded / e.total) * 100) });
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Storage upload failed (HTTP ${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('Upload cancelled'));
      updateTask(task.id, { xhr });
      xhr.send(task.file);
    });

  const putLocal = (task: UploadTask, mediaId: string, contentType: string) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', `${api.defaults.baseURL}/media/videos/${mediaId}/local-upload`);
      xhr.setRequestHeader('Content-Type', contentType);
      const token = localStorage.getItem('naik_admin_token');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          updateTask(task.id, { progress: Math.round((e.loaded / e.total) * 100) });
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else {
          let message = `Upload failed (HTTP ${xhr.status})`;
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed?.message) message = parsed.message;
          } catch {
            /* non-JSON error body */
          }
          reject(new Error(message));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('Upload cancelled'));
      updateTask(task.id, { xhr });
      xhr.send(task.file);
    });

  const runTask = async (task: UploadTask) => {
    try {
      updateTask(task.id, { status: 'requesting', error: undefined });
      const { mediaId, uploadUrl, mode } = await requestUploadUrl(task);
      updateTask(task.id, { mediaId, status: 'uploading' });
      const contentType = task.file.type || 'video/mp4';
      if (mode === 'local') {
        await putLocal(task, mediaId, contentType);
      } else {
        await putToR2(task, uploadUrl!, contentType);
      }
      updateTask(task.id, { status: 'finalizing' });
      await api.post(`/media/videos/${mediaId}/complete`);
      updateTask(task.id, { status: 'done', progress: 100 });
      onUploaded?.({ mediaId, name: task.file.name });
    } catch (e: any) {
      updateTask(task.id, { status: 'error', error: e?.message || 'Upload failed' });
    }
  };

  const startUpload = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) runTask(task);
  };

  const startAll = () => {
    tasks.filter((t) => t.status === 'pending' || t.status === 'error').forEach((t) => runTask(t));
  };

  const cancel = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    task?.xhr?.abort();
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const remove = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <Box>
      {!scope && !hideScopeField && (
        <TextField
          fullWidth
          size="small"
          label="Book ID (optional)"
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
          sx={{ mb: 2 }}
          helperText="Links the video to a book — used in the R2 object key structure."
        />
      )}

      <Box
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          border: `2px dashed ${dragOver ? 'primary.main' : 'grey.300'}`,
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: dragOver ? 'primary.50' : 'grey.50',
          transition: 'all 200ms ease',
          mb: 2,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          accept="video/*"
          multiple
          onChange={(e) => { addFiles(e.target.files || []); e.target.value = ''; }}
        />
        <Box sx={{ color: 'text.secondary', mb: 1 }}>
          <Upload size={32} />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Drag & drop videos or <strong>browse</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
          Pick a file and the upload starts automatically — wait for ✓ before saving.
        </Typography>
      </Box>

      {tasks.length > 0 && (
        <Stack spacing={1.5}>
          {tasks.map((task) => (
            <Box
              key={task.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.5,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: task.status === 'error' ? 'error.main' : 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Box sx={{ flexShrink: 0, color: 'primary.main' }}>
                <FileVideo size={24} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500} noWrap>
                  {task.file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatSize(task.file.size)}
                  {task.status === 'uploading' || task.status === 'requesting' || task.status === 'finalizing'
                    ? ` — ${task.progress}%`
                    : ''}
                </Typography>
                {(task.status === 'uploading' || task.status === 'requesting' || task.status === 'finalizing') && (
                  <LinearProgress
                    variant={task.status === 'requesting' ? 'indeterminate' : 'determinate'}
                    value={task.progress}
                    sx={{ mt: 0.5, borderRadius: 1, height: 4 }}
                  />
                )}
                {task.status === 'error' && task.error && (
                  <Typography variant="caption" color="error">{task.error}</Typography>
                )}
                {task.status === 'done' && (
                  <Typography variant="caption" color="success.main">Upload completed ✓</Typography>
                )}
              </Box>

              {task.status === 'pending' && (
                <Button size="small" variant="contained" startIcon={<Upload />} onClick={() => startUpload(task.id)}>
                  Upload
                </Button>
              )}
              {task.status === 'error' && (
                <Button size="small" variant="outlined" startIcon={<RotateCcw />} onClick={() => startUpload(task.id)}>
                  Retry
                </Button>
              )}
              {(task.status === 'uploading' || task.status === 'requesting' || task.status === 'finalizing') && (
                <Button size="small" color="warning" onClick={() => cancel(task.id)}>
                  Cancel
                </Button>
              )}
              {(task.status === 'pending' || task.status === 'error' || task.status === 'done') && (
                <IconButton size="small" onClick={() => remove(task.id)}>
                  <X size={16} />
                </IconButton>
              )}
            </Box>
          ))}

          {tasks.some((t) => t.status === 'pending') && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" startIcon={<Upload />} onClick={startAll}>
                Upload all
              </Button>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}
