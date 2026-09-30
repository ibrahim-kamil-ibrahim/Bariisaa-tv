import { ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { X } from 'lucide-react';
import { palette } from '../theme';

interface FormModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
  submitDisabled?: boolean;
  error?: string | null;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

/**
 * Standardized modern form dialog shell: title + subtitle, close button,
 * error alert, and Cancel/Save actions with a loading spinner.
 */
export default function FormModal({
  open,
  title,
  subtitle,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  loading = false,
  submitDisabled = false,
  error,
  maxWidth = 'sm',
  children,
}: FormModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, pr: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: palette.inkMuted, mt: -0.5 }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {children}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={loading || submitDisabled}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {loading ? 'Saving…' : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
