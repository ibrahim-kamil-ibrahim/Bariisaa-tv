import { useCallback, useRef, useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Upload,
  X,
  GripVertical,
  File,
  Image as ImageIcon,
  FileText,
  Music,
  AlertTriangle,
} from 'lucide-react';
import { palette, typography } from '../../theme';

export interface UploadFileEntry {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  previewUrl?: string;
  chapterTitle?: string;
  trackOrder?: number;
  width?: number;
  height?: number;
}

interface FileUploadProps {
  accept: string;
  maxSize: number;
  maxSizeMessage: string;
  requiredWidth?: number;
  requiredHeight?: number;
  showDimensions?: boolean;
  files: UploadFileEntry[];
  onFilesChange: (files: UploadFileEntry[]) => void;
  onUpload: (entry: UploadFileEntry) => Promise<void>;
  multiple?: boolean;
  previewType?: 'image' | 'audio' | 'document';
  label: string;
  subtitle?: string;
  validationError?: string;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  image: <ImageIcon size={32} strokeWidth={1} />,
  audio: <Music size={32} strokeWidth={1} />,
  document: <FileText size={32} strokeWidth={1} />,
};

export default function FileUpload({
  accept,
  maxSize,
  maxSizeMessage,
  requiredWidth,
  requiredHeight,
  showDimensions = false,
  files,
  onFilesChange,
  onUpload,
  multiple = false,
  previewType = 'document',
  label,
  subtitle,
  validationError,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles?.length) return;
      const entries: UploadFileEntry[] = [];
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];

        // Check file size
        if (file.size > maxSize) {
          entries.push({
            id: crypto.randomUUID(),
            file,
            progress: 0,
            status: 'error',
            error: maxSizeMessage,
          });
          continue;
        }

        // Check image dimensions if required
        let previewUrl: string | undefined;
        let width: number | undefined;
        let height: number | undefined;

        if (previewType === 'image' && file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = () => {
            width = img.width;
            height = img.height;
            entries[entries.length - 1].width = width;
            entries[entries.length - 1].height = height;
          };
          img.onerror = () => {
            width = 0;
            height = 0;
          };
          previewUrl = URL.createObjectURL(file);
          img.src = URL.createObjectURL(file);
        }

        entries.push({
          id: crypto.randomUUID(),
          file,
          progress: 0,
          status: 'pending',
          previewUrl,
          chapterTitle: file.name.replace(/\\.[^/.]+$/, ''),
          trackOrder: files.length + i + 1,
          width,
          height,
        });
      }
      onFilesChange([...files, ...entries]);
    },
    [files, maxSize, maxSizeMessage, onFilesChange, previewType]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeFile = useCallback(
    (id: string) => {
      const entry = files.find((f) => f.id === id);
      if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      onFilesChange(files.filter((f) => f.id !== id));
    },
    [files, onFilesChange]
  );

  const moveFile = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= files.length) return;
      const updated = [...files];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      onFilesChange(updated.map((f, i) => ({ ...f, trackOrder: i + 1 })));
    },
    [files, onFilesChange]
  );

  const uploadAll = useCallback(async () => {
    const pending = files.filter(
      (f) => f.status === 'pending' || f.status === 'error'
    );
    for (const entry of pending) {
      onFilesChange(
        files.map((f) =>
          f.id === entry.id ? { ...f, status: 'uploading' as const } : f
        )
      );
      try {
        await onUpload(entry);
        onFilesChange(
          files.map(
            (f) =>
              f.id === entry.id
                ? { ...f, status: 'done' as const, progress: 100 }
                : f
          )
        );
      } catch {
        onFilesChange(
          files.map(
            (f) =>
              f.id === entry.id
                ? { ...f, status: 'error' as const, error: 'Upload failed' }
                : f
          )
        );
      }
    }
  }, [files, onFilesChange, onUpload]);

  // Check if any pending file fails dimension validation
  const hasDimensionalIssue = files.some(
    (f) =>
      f.status === 'pending' &&
      requiredWidth !== undefined &&
      requiredHeight !== undefined &&
      (f.width === undefined || f.width !== requiredWidth || f.height !== requiredHeight)
  );

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
        {label}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          {subtitle}
        </Typography>
      )}

      {/* Validation error banner */}
      {(hasDimensionalIssue || validationError) && (
        <Alert
          severity="error"
          icon={<AlertTriangle size={16} />}
          sx={{ mb: 2 }}
        >
          {hasDimensionalIssue
            ? `Image must be ${requiredWidth}x${requiredHeight}px — current size: ${files.find((f) => f.status === 'pending')?.width || 'unknown'}x${
                files.find((f) => f.status === 'pending')?.height || 'unknown'
              }px`
            : validationError}
        </Alert>
      )}

      <Box
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          border: `2px dashed ${dragOver ? palette.deepTeal : palette.warmGray}`,
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: dragOver ? palette.deepTealLight : 'transparent',
          transition: 'all 200ms ease',
          '&:hover': { borderColor: palette.deepTeal, bgcolor: palette.deepTealLight },
        }}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <Box sx={{ color: palette.inkMuted, mb: 1 }}>
          <Upload size={32} strokeWidth={1} />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Drag & drop or <strong>browse</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
          {accept} — Max: {maxSizeMessage}
          {requiredWidth && requiredHeight && (
            <> &nbsp;|&nbsp; Required: {requiredWidth}×{requiredHeight}px</>
          )}
        </Typography>
      </Box>

      {files.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {files.map((entry, index) => (
            <Box
              key={entry.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1.5,
                border: `1px solid ${palette.warmGrayLight}`,
                bgcolor: palette.parchment,
              }}
            >
              {multiple && (
                <Tooltip title="Drag to reorder">
                  <IconButton
                    size="small"
                    onMouseDown={(e) => {
                      const target = e.currentTarget.parentElement;
                      if (!target) return;
                      const parent = target.parentElement;
                      if (!parent) return;
                      const row = target as HTMLElement;
                      const startY = e.clientY;
                      const origIndex = index;
                      const handleMouseMove = (me: MouseEvent) => {
                        const delta = me.clientY - startY;
                        const rowHeight = row.offsetHeight;
                        const moveBy = Math.round(delta / rowHeight);
                        const newIndex = Math.max(0, Math.min(files.length - 1, origIndex + moveBy));
                        moveFile(origIndex, newIndex);
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                    sx={{ cursor: 'grab' }}
                  >
                    <GripVertical size={16} />
                  </IconButton>
                </Tooltip>
              )}

              <Box sx={{ flexShrink: 0, color: palette.inkMuted }}>
                {previewType === 'image' && entry.previewUrl ? (
                  <Box
                    component="img"
                    src={entry.previewUrl}
                    alt="Preview"
                    sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }}
                  />
                ) : previewType === 'audio' && entry.previewUrl ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 160 }}>
                    <Music size={18} />
                    <audio
                      src={entry.previewUrl}
                      controls
                      preload="none"
                      style={{ height: 32, width: 130 }}
                    />
                  </Box>
                ) : (
                  fileTypeIcons[previewType] || <File size={24} />
                )}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500} noWrap>
                  {entry.chapterTitle || entry.file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(entry.file.size / (1024 * 1024)).toFixed(1)} MB
                  {showDimensions && entry.width && entry.height && (
                    <> · {entry.width}×{entry.height} px</>
                  )}
                </Typography>
                {entry.status === 'uploading' && (
                  <LinearProgress
                    variant="determinate"
                    value={entry.progress}
                    sx={{ mt: 0.5, borderRadius: 1, height: 4 }}
                  />
                )}
                {entry.status === 'error' && entry.error && (
                  <Typography variant="caption" color="error">
                    {entry.error}
                  </Typography>
                )}
                {entry.status === 'done' && (
                  <Typography variant="caption" color="success.main">
                    Uploaded
                  </Typography>
                )}
              </Box>

              <IconButton size="small" onClick={() => removeFile(entry.id)} sx={{ color: palette.inkMuted }}>
                <X size={16} />
              </IconButton>
            </Box>
          ))}

          {files.some((f) => f.status === 'pending' || f.status === 'error') && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Typography
                variant="caption"
                onClick={uploadAll}
                sx={{
                  cursor: 'pointer',
                  color: palette.deepTeal,
                  fontWeight: 600,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Upload pending files
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
