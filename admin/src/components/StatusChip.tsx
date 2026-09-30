import { Chip } from '@mui/material';
import { palette } from '../theme';

type StatusVariant =
  | 'active' | 'completed'
  | 'suspended' | 'banned' | 'failed' | 'cancelled' | 'expired'
  | 'draft'
  | 'published' | 'archived'
  | 'pending'
  | 'refunded'
  | 'paid';

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: palette.emeraldLight, color: palette.emerald, label: 'Active' },
  completed: { bg: palette.emeraldLight, color: palette.emerald, label: 'Completed' },
  suspended: { bg: palette.amberLight, color: palette.amber, label: 'Suspended' },
  banned: { bg: palette.coralLight, color: palette.coral, label: 'Banned' },
  failed: { bg: palette.coralLight, color: palette.coral, label: 'Failed' },
  cancelled: { bg: palette.warmGrayLight, color: palette.inkMuted, label: 'Cancelled' },
  expired: { bg: palette.warmGrayLight, color: palette.inkMuted, label: 'Expired' },
  draft: { bg: palette.warmGrayLight, color: palette.inkMuted, label: 'Draft' },
  published: { bg: palette.deepTealLight, color: palette.deepTealDark, label: 'Published' },
  archived: { bg: palette.warmGrayLight, color: palette.inkMuted, label: 'Archived' },
  pending: { bg: palette.amberLight, color: palette.amber, label: 'Pending' },
  refunded: { bg: palette.goldLight, color: '#7A5C00', label: 'Refunded' },
  paid: { bg: palette.emeraldLight, color: palette.emerald, label: 'Paid' },
};

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

export default function StatusChip({ status, size = 'small' }: StatusChipProps) {
  const config = statusConfig[status.toLowerCase()] || {
    bg: palette.warmGrayLight,
    color: palette.inkMuted,
    label: status,
  };

  return (
    <Chip
      label={config.label}
      size={size}
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 600,
        fontSize: size === 'small' ? 11 : 12,
        height: size === 'small' ? 22 : 28,
        borderRadius: '999px',
      }}
    />
  );
}
