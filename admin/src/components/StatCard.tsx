import { useEffect, useRef, useState } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { palette } from '../theme';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: number;
  trendLabel?: string;
  prefix?: string;
  bgColor?: string;
  iconColor?: string;
  animate?: boolean;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function StatCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  prefix = '',
  bgColor = palette.deepTealLight,
  iconColor = palette.deepTeal,
  animate = true,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);
  const [mounted, setMounted] = useState(false);
  const frameRef = useRef<number>();

  useEffect(() => {
    setMounted(true);
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0 : value;
    const isCurrency = prefix === '$' || prefix === 'ETB';

    if (animate && numericValue > 0) {
      const duration = 1200;
      const start = performance.now();

      const animateCount = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);
        const current = Math.round(eased * numericValue * 100) / 100;
        setDisplayValue(isCurrency ? current : Math.round(current));
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animateCount);
        }
      };

      frameRef.current = requestAnimationFrame(animateCount);
    } else {
      setDisplayValue(numericValue);
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, animate, prefix]);

  const formatValue = (v: number | string) => {
    if (typeof v === 'string') return v;
    const isCurrency = prefix === '$' || prefix === 'ETB';
    if (isCurrency) return v.toFixed(2);
    return v.toLocaleString();
  };

  return (
    <Card
      sx={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 400ms ease',
        '&:hover': { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.1)', transform: 'translateY(-2px)' },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {label}
          </Typography>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: bgColor,
              color: iconColor,
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>
          {prefix}{formatValue(displayValue)}
        </Typography>
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            {trend >= 0 ? (
              <TrendingUp size={14} color={palette.emerald} />
            ) : (
              <TrendingDown size={14} color={palette.coral} />
            )}
            <Typography
              variant="caption"
              sx={{ color: trend >= 0 ? palette.emerald : palette.coral, fontWeight: 600 }}
            >
              {Math.abs(trend).toFixed(1)}%
            </Typography>
            {trendLabel && <Typography variant="caption" color="text.secondary">{trendLabel}</Typography>}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
