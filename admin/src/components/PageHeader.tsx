import { Box, Typography, Button } from '@mui/material';
import { Plus } from 'lucide-react';
import { typography } from '../theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actionLabel, onAction, actionIcon }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        mb: 3,
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box>
        <Typography variant="h4" fontWeight={900} fontFamily={typography.serif} sx={{ letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actionLabel && onAction && (
        <Button variant="contained" startIcon={actionIcon || <Plus size={18} />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
