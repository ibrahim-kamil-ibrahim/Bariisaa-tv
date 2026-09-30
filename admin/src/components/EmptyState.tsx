import { Box, Typography, Button } from '@mui/material';
import { Inbox } from 'lucide-react';
import { palette, typography } from '../theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        textAlign: 'center',
      }}
    >
      <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: palette.deepTealLight, color: palette.deepTeal, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        {icon || <Inbox size={36} strokeWidth={1.5} />}
      </Box>
      <Typography variant="h6" fontFamily={typography.serif} fontWeight={700} sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mb: 2 }}>
          {message}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
