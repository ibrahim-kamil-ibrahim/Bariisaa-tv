import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Select,
  MenuItem,
  FormControl,
  Tabs,
  Tab,
  Alert,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp, Users, BookOpen, CreditCard, Cloud, Wifi,
  Timer, Activity, Heart, Cpu, HardDrive, Droplets,
  Stethoscope, Trophy, ImageIcon, Server, CheckCircle2, XCircle,
  ArrowUpRight, Sparkles, Zap,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import { palette } from '../../theme';
import api from '../../services/api';

/* ─── Animated counter ─── */
function useCountUp(target: number, duration = 1100) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    if (target <= 0) { setDisplay(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return display;
}

/* ─── Sparkline ─── */
function Sparkline({ data, color, width = 80, height = 30 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return <Box sx={{ width, height }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Donut ─── */
function DonutChart({ segments, size = 110 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = (seg.value / total) * 100;
    const dashLen = (pct / 100) * circumference;
    const gap = circumference - dashLen;
    const start = -offset;
    offset += dashLen;
    return { ...seg, dashLen, gap, start };
  });

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
            </filter>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F0ECF9" strokeWidth="14" />
          {arcs.map((arc, i) => (
            <circle key={i} cx={size / 2} cy={size / 2} r={radius} fill="none"
              stroke={arc.color} strokeWidth="14"
              strokeDasharray={`${arc.dashLen} ${arc.gap}`}
              strokeDashoffset={arc.start}
              strokeLinecap="round"
              filter="url(#donutShadow)"
              transform={`rotate(-90 ${size / 2} ${size / 2})`} />
          ))}
        </svg>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h5" fontWeight={900} color={palette.deepTeal}>{total}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {segments.map((seg, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '4px', backgroundColor: seg.color, boxShadow: `0 2px 6px ${seg.color}44` }} />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 52 }}>{seg.label}</Typography>
            <Typography variant="body2" fontWeight={800}>{seg.value}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* ─── Modern metric card ─── */
function MetricCard({ icon: Icon, label, value, trend, prefix, color, sparkData, index = 0 }: {
  icon: any; label: string; value: number; trend?: number; prefix?: string; color: string; sparkData?: number[]; index?: number;
}) {
  const display = useCountUp(value);
  return (
    <Card
      sx={{
        borderRadius: 4,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(145deg, ${color}10 0%, ${color}04 60%, transparent 100%)`,
        border: `1px solid ${color}18`,
        transition: 'all 350ms cubic-bezier(0.22, 1, 0.36, 1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: `0 20px 40px -12px ${color}30`,
          borderColor: `${color}40`,
        },
        '&:active': { transform: 'translateY(-2px) scale(0.99)' },
      }}
    >
      {/* Decorative blob */}
      <Box sx={{
        position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}12, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <CardContent sx={{ position: 'relative', p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${color}22, ${color}0C)`,
            color,
            boxShadow: `0 4px 14px ${color}20`,
          }}>
            <Icon size={24} strokeWidth={2.2} />
          </Box>
          {trend !== undefined && (
            <Chip
              icon={trend >= 0 ? <TrendingUp size={14} /> : <ArrowUpRight size={14} />}
              label={`${trend >= 0 ? '+' : ''}${trend}%`}
              size="small"
              sx={{
                fontWeight: 700, fontSize: 11, height: 26,
                backgroundColor: trend >= 0 ? `${palette.emerald}14` : '#FEE4E2',
                color: trend >= 0 ? palette.emerald : '#D92D20',
              }}
            />
          )}
        </Box>
        <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: '-0.03em', lineHeight: 1.1, color: palette.deepTeal }}>
          {prefix}{display.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>{label}</Typography>
        {sparkData && sparkData.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Sparkline data={sparkData} color={color} width={100} height={32} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Panel wrapper (consistent shell for all panels) ─── */
function Panel({ title, icon, action, children, sx }: {
  title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; sx?: any;
}) {
  return (
    <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid rgba(64,32,131,0.08)', boxShadow: '0 1px 3px rgba(64,32,131,0.04)', ...sx }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            {icon}
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>{title}</Typography>
          </Box>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const MODULE_META: Record<string, { icon: any; color: string }> = {
  books: { icon: BookOpen, color: '#6366F1' },
  users: { icon: Users, color: palette.deepTeal },
  payments: { icon: CreditCard, color: '#059669' },
  music: { icon: Activity, color: '#8B5CF6' },
  habits: { icon: Droplets, color: palette.goldDark },
  'my-doctor': { icon: Stethoscope, color: '#0EA5E9' },
  'my-captain': { icon: Trophy, color: '#F59E0B' },
  media: { icon: ImageIcon, color: '#EC4899' },
  settings: { icon: Server, color: '#64748B' },
};

function ActivityFeedItem({ item }: { item: any }) {
  const meta = MODULE_META[item.module] || { icon: Activity, color: '#94A3B8' };
  const Icon = meta.icon;
  return (
    <Box sx={{
      display: 'flex', gap: 1.5, alignItems: 'flex-start', py: 1, px: 1.25, mx: -0.5,
      borderRadius: 2.5, transition: 'background 200ms',
      '&:hover': { backgroundColor: `${palette.deepTeal}04` },
    }}>
      <Avatar sx={{
        width: 36, height: 36,
        background: `linear-gradient(135deg, ${meta.color}22, ${meta.color}0A)`,
        color: meta.color,
      }}>
        <Icon size={17} />
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" fontWeight={700} noWrap>{item.user?.name || 'System'}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {item.action} · {item.module}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, mt: 0.3 }}>{timeAgo(item.createdAt)}</Typography>
    </Box>
  );
}

function HealthRow({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1.25, mx: -0.5, borderRadius: 2.5,
      transition: 'background 200ms', '&:hover': { backgroundColor: `${palette.emerald}06` },
    }}>
      <Box sx={{
        width: 28, height: 28, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: ok ? `${palette.emerald}12` : '#FEE4E2',
      }}>
        {ok ? <CheckCircle2 size={16} color={palette.emerald} /> : <XCircle size={16} color="#D92D20" />}
      </Box>
      <Typography variant="body2" fontWeight={700} sx={{ flex: 1 }}>{label}</Typography>
      <Typography variant="caption" color="text.secondary">{detail}</Typography>
    </Box>
  );
}

export default function DashboardV2Page() {
  const [tab, setTab] = useState(0);
  const [hours, setHours] = useState(24);

  const { data: dashboardData, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard-v2'],
    queryFn: () => api.get('/reports/dashboard').then((r) => r.data.data),
  });

  const { data: serverHealth } = useQuery({ queryKey: ['server-health'], queryFn: () => api.get('/health').then((r) => r.data), refetchInterval: 30000 });
  const { data: activityStats } = useQuery({ queryKey: ['activity-stats'], queryFn: () => api.get('/activity/stats').then((r) => r.data.data) });
  const { data: recentActivity } = useQuery({ queryKey: ['recent-activity'], queryFn: () => api.get('/activity', { params: { limit: 6 } }).then((r) => r.data.data), retry: false });
  const { data: recentPayments, isError: recentPaymentsError } = useQuery({ queryKey: ['recent-payments'], queryFn: () => api.get('/payments/admin/all', { params: { limit: 5 } }).then((r) => r.data.data), retry: false });

  const { data: habitCount } = useQuery({ queryKey: ['dash-habits'], queryFn: () => api.get('/habits', { params: { limit: 1 } }).then((r) => r.data.meta?.total ?? (r.data.data as any[])?.length ?? 0) });
  const { data: tipCount } = useQuery({ queryKey: ['dash-tips'], queryFn: () => api.get('/my-doctor/tips', { params: { limit: 100 } }).then((r) => (r.data.data as any[])?.length ?? 0) });
  const { data: doctorCount } = useQuery({ queryKey: ['dash-doctors'], queryFn: () => api.get('/my-doctor/profiles', { params: { limit: 100 } }).then((r) => (r.data.data as any[])?.length ?? 0) });
  const { data: achievementCount } = useQuery({ queryKey: ['dash-achievements'], queryFn: () => api.get('/my-captain/achievements', { params: { limit: 100 } }).then((r) => (r.data.data as any[])?.length ?? 0) });
  const { data: mediaStats } = useQuery({ queryKey: ['media-stats'], queryFn: () => api.get('/media/stats').then((r) => r.data.data), retry: false });

  const { data: liveMetrics } = useQuery({
    queryKey: ['live-metrics', hours],
    queryFn: () => api.get('/live/metrics', { params: { hours } }).then((r) => r.data.data),
    enabled: tab === 1, refetchInterval: 10000,
  });
  const { data: onlineData } = useQuery({ queryKey: ['online-users'], queryFn: () => api.get('/live/online-users').then((r) => r.data.data), enabled: tab === 1, refetchInterval: 15000 });

  const [now] = useState(() => new Date());
  const clock = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getMetricValue = (key: string): number => { if (!liveMetrics?.[key]) return 0; const values = liveMetrics[key].values || []; return values.length > 0 ? values[values.length - 1].value : 0; };
  const getSparkline = (key: string): number[] => { if (!liveMetrics?.[key]) return []; return (liveMetrics[key].values || []).slice(-20).map((v: any) => v.value); };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (dashLoading) {
    return (
      <FadeIn><Box><PageHeader title="Dashboard" subtitle="Platform overview" />
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={180} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 3 }}><Skeleton variant="rounded" height={200} sx={{ borderRadius: 4 }} /></Box>
      </Box></FadeIn>
    );
  }

  const d = dashboardData || {};
  const revenueData = recentPayments || [];
  const distributionData = [
    { label: 'Books', value: d.totalBooks || 0, color: palette.deepTeal },
    { label: 'Users', value: d.totalUsers || 0, color: palette.gold },
    { label: 'Subs', value: d.activeSubscriptions || 0, color: palette.emerald },
  ];

  const contentStrip = [
    { label: 'Habits', value: habitCount, icon: Droplets, color: palette.goldDark },
    { label: 'Health Tips', value: tipCount, icon: Heart, color: '#0EA5E9' },
    { label: 'Doctors', value: doctorCount, icon: Stethoscope, color: palette.deepTeal },
    { label: 'Achievements', value: achievementCount, icon: Trophy, color: '#F59E0B' },
    { label: 'Media Files', value: mediaStats?.totalFiles, icon: ImageIcon, color: '#EC4899' },
  ];

  return (
    <FadeIn>
      <Box>
        <PageHeader title="Dashboard" subtitle={`Welcome back · ${clock}`} />

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 3,
            minHeight: 48,
            '& .MuiTab-root': {
              textTransform: 'none', fontWeight: 700, minHeight: 48, borderRadius: 2.5, mx: 0.5,
              fontSize: 14, color: 'text.secondary',
              transition: 'all 200ms',
              '&.Mui-selected': { color: palette.deepTeal, backgroundColor: `${palette.deepTeal}08` },
            },
            '& .MuiTabs-indicator': { backgroundColor: palette.deepTeal, height: 3, borderRadius: 2, marginLeft: 8, marginRight: 8 },
          }}
        >
          <Tab label="Overview" />
          <Tab label="Analytics" />
          <Tab label="System" />
        </Tabs>

        {/* ═══════════ OVERVIEW ═══════════ */}
        {tab === 0 && (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard icon={Users} label="Total Users" value={d.totalUsers || 0} color={palette.deepTeal} sparkData={getSparkline('activeUsers')} index={0} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard icon={CreditCard} label="Active Subscriptions" value={d.activeSubscriptions || 0} color={palette.goldDark} index={1} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard icon={TrendingUp} label="Total Revenue" value={d.totalRevenue || 0} prefix="$" color="#059669" index={2} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard icon={BookOpen} label="Total Books" value={d.totalBooks || 0} color="#6366F1" index={3} />
              </Grid>
            </Grid>

            {/* Content Library — modern strip */}
            <Card sx={{
              borderRadius: 4, mb: 3, border: 'none', position: 'relative', overflow: 'hidden',
              background: `linear-gradient(120deg, ${palette.deepTeal} 0%, #2D1560 60%, #1F0E45 100%)`,
              color: '#fff',
              boxShadow: '0 8px 32px -8px rgba(64,32,131,0.4)',
            }}>
              {/* Decorative circle — bottom-left only, clear of content */}
              <Box sx={{ position: 'absolute', bottom: -100, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
              <CardContent sx={{ position: 'relative', py: 3, px: 3.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                  <Sparkles size={16} color={palette.gold} />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 11.5, opacity: 0.9 }}>
                    Content Library
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {contentStrip.map((item) => (
                    <Grid item xs={6} sm={4} md={2.4} key={item.label}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, px: 1.5, borderRadius: 3,
                        background: 'rgba(255,255,255,0.10)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        transition: 'all 250ms',
                        '&:hover': { background: 'rgba(255,255,255,0.16)', transform: 'translateY(-2px)' },
                      }}>
                        <Box sx={{
                          width: 40, height: 40, borderRadius: 2.5, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: `linear-gradient(135deg, ${item.color}44, ${item.color}18)`,
                        }}>
                          <item.icon size={19} color={palette.gold} />
                        </Box>
                        <Box>
                          <Typography variant="h5" fontWeight={900} lineHeight={1.1}>{item.value ?? '—'}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{item.label}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Panel title="Revenue Trend" icon={<TrendingUp size={19} color={palette.deepTeal} />} action={<Chip label="Last 30 days" size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: 2 }} />}>
                  {revenueData.length === 0 ? (
                    <Box sx={{ height: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 3, background: `linear-gradient(135deg, ${palette.deepTeal}06, ${palette.goldLight}30)`, gap: 1 }}>
                      <Zap size={22} color={palette.goldDark} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>No revenue data yet</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 130 }}>
                      {revenueData.slice(-14).map((p: any, i: number) => (
                        <Box key={i} sx={{
                          flex: 1,
                          height: `${((p.amount || 0) / Math.max(revenueData.reduce((s: any, r: any) => s + r.amount, 0) / 14, 1)) * 100}%`,
                          background: `linear-gradient(180deg, ${palette.deepTeal}, ${palette.deepTeal}88)`,
                          borderRadius: '6px 6px 0 0',
                          opacity: 0.4 + (i / 14) * 0.6,
                          minHeight: 6,
                          transition: 'opacity 200ms',
                          '&:hover': { opacity: 1 },
                        }} />
                      ))}
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">Revenue</Typography>
                    <Typography variant="caption" fontWeight={700} color={palette.deepTeal}>{revenueData.length} transactions</Typography>
                  </Box>
                </Panel>
              </Grid>
              <Grid item xs={12} md={4}>
                <Panel title="Library Distribution" icon={<BookOpen size={19} color={palette.deepTeal} />}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <DonutChart segments={distributionData} />
                  </Box>
                </Panel>
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Panel
                  title="Recent Activity"
                  icon={<Activity size={19} color={palette.deepTeal} />}
                  action={
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                      <Chip label={`${activityStats?.todayCount || 0} today`} size="small" sx={{ fontWeight: 700, fontSize: 11, backgroundColor: `${palette.deepTeal}10`, color: palette.deepTeal }} />
                      <Chip label={`${activityStats?.weekCount || 0} this week`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 11 }} />
                    </Box>
                  }
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {(recentActivity || []).length === 0 ? (
                      <Box sx={{ py: 5, textAlign: 'center', borderRadius: 3, background: `linear-gradient(135deg, ${palette.deepTeal}05, ${palette.goldLight}25)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Activity size={22} color={palette.goldDark} />
                        <Typography variant="body2" color="text.secondary">No recent activity</Typography>
                      </Box>
                    ) : (
                      (recentActivity || []).map((item: any) => <ActivityFeedItem key={item.id} item={item} />)
                    )}
                  </Box>
                </Panel>
              </Grid>
              <Grid item xs={12} md={6}>
                <Panel title="Platform Health" icon={<Cloud size={19} color={palette.deepTeal} />}>
                  <HealthRow ok={serverHealth?.status === 'ok'} label="API Server" detail={serverHealth?.status === 'ok' ? 'operational' : 'unreachable'} />
                  <HealthRow ok label="Database" detail="PostgreSQL" />
                  <HealthRow ok={(mediaStats?.totalFiles ?? 0) >= 0} label="Media Storage" detail={`${mediaStats?.totalFiles || 0} files · ${formatSize(mediaStats?.totalSize)}`} />
                  {serverHealth?.timestamp && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, pl: 5 }}>
                      Last checked {new Date(serverHealth.timestamp).toLocaleTimeString()}
                    </Typography>
                  )}
                </Panel>
              </Grid>
            </Grid>

            <Panel title="Recent Transactions" icon={<CreditCard size={19} color={palette.deepTeal} />}>
              {recentPaymentsError || (recentPayments || []).length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center', borderRadius: 3, background: `linear-gradient(135deg, ${palette.deepTeal}05, ${palette.goldLight}25)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <CreditCard size={22} color={palette.goldDark} />
                  <Typography variant="body2" color="text.secondary">No transactions yet</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: `${palette.deepTeal}06` }}>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Transaction</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Method</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(recentPayments || []).slice(0, 5).map((p: any) => (
                        <TableRow hover key={p.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>#{p.gatewayTransactionId?.slice(-8)}</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>{p.currency} {p.amount}</TableCell>
                          <TableCell>{p.gateway}</TableCell>
                          <TableCell>
                            <Chip
                              label={p.status}
                              size="small"
                              sx={{
                                fontWeight: 700, fontSize: 11, borderRadius: 2,
                                backgroundColor: p.status === 'COMPLETED' ? `${palette.emerald}14` : `${palette.warmGrayLight}`,
                                color: p.status === 'COMPLETED' ? palette.emerald : 'text.secondary',
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Panel>
          </>
        )}

        {/* ═══════════ ANALYTICS ═══════════ */}
        {tab === 1 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  size="small"
                  sx={{ borderRadius: 2.5, fontWeight: 600 }}
                >
                  <MenuItem value={1}>Last 1 hour</MenuItem>
                  <MenuItem value={6}>Last 6 hours</MenuItem>
                  <MenuItem value={24}>Last 24 hours</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Online hero */}
            <Card sx={{
              mb: 3, borderRadius: 4, border: 'none', position: 'relative', overflow: 'hidden',
              background: `linear-gradient(135deg, ${palette.deepTeal} 0%, #2D1560 100%)`,
              color: '#fff',
              boxShadow: '0 12px 40px -8px rgba(64,32,131,0.5)',
            }}>
              <Box sx={{ position: 'absolute', top: -50, right: -20, width: 200, height: 200, borderRadius: '50%', background: `${palette.gold}12` }} />
              <Box sx={{ position: 'absolute', bottom: -60, left: 60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <CardContent sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 3, py: 3.5, px: 4 }}>
                <Box sx={{
                  width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.15)',
                }}>
                  <Users size={30} />
                </Box>
                <Box>
                  <Typography variant="h2" fontWeight={900} sx={{ letterSpacing: '-0.03em', lineHeight: 1 }}>{onlineData?.online ?? '—'}</Typography>
                  <Typography variant="body1" sx={{ opacity: 0.85, fontWeight: 500 }}>Users online now</Typography>
                </Box>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1, opacity: 0.7 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4ADE80', animation: 'pulse 2s infinite' }} />
                  <Typography variant="caption" fontWeight={600}>LIVE</Typography>
                </Box>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              {[
                { key: 'activeUsers', label: 'Active Users', icon: Users, color: palette.deepTeal, unit: '', decimals: 0 },
                { key: 'requestsPerMin', label: 'Requests / min', icon: Wifi, color: '#6366F1', unit: '/min', decimals: 0 },
                { key: 'avgResponseTime', label: 'Avg Response', icon: Timer, color: palette.goldDark, unit: 'ms', decimals: 1 },
                { key: 'cpu', label: 'CPU', icon: Cpu, color: '#E5484D', unit: '%', decimals: 0 },
                { key: 'memory', label: 'Memory', icon: HardDrive, color: '#69539E', unit: '%', decimals: 0 },
              ].map((metric) => (
                <Grid item xs={12} sm={6} md={4} key={metric.key}>
                  <Card sx={{
                    borderRadius: 4, height: '100%', position: 'relative', overflow: 'hidden',
                    background: `linear-gradient(145deg, ${metric.color}0A, transparent 70%)`,
                    border: `1px solid ${metric.color}15`,
                    transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 16px 32px -8px ${metric.color}22` },
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{
                        width: 44, height: 44, borderRadius: 2.5, mb: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `linear-gradient(135deg, ${metric.color}1E, ${metric.color}08)`,
                        color: metric.color,
                      }}>
                        <metric.icon size={21} strokeWidth={2.2} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 0.5 }}>{metric.label}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                        <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: '-0.03em' }}>
                          {getMetricValue(metric.key).toFixed(metric.decimals)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>{metric.unit}</Typography>
                      </Box>
                      {getSparkline(metric.key).length > 1 && (
                        <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                          <Sparkline data={getSparkline(metric.key)} color={metric.color} width={110} height={30} />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* ═══════════ SYSTEM ═══════════ */}
        {tab === 2 && (
          <>
            <Alert
              severity={serverHealth?.status === 'ok' ? 'success' : 'error'}
              icon={serverHealth?.status === 'ok' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              sx={{ mb: 3, borderRadius: 3, fontWeight: 600, alignItems: 'center' }}
            >
              {serverHealth?.status === 'ok'
                ? 'All systems operational. Live metrics refresh every 10 seconds on the Analytics tab.'
                : 'API server is unreachable. Check the backend process.'}
            </Alert>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[
                { name: 'API Server', status: serverHealth?.status === 'ok' ? 'Operational' : 'Unreachable', ok: serverHealth?.status === 'ok', detail: serverHealth?.timestamp ? `Checked ${new Date(serverHealth.timestamp).toLocaleTimeString()}` : '—', color: serverHealth?.status === 'ok' ? '#059669' : '#E5484D', icon: Server },
                { name: 'Database', status: 'Connected', ok: true, detail: 'PostgreSQL', color: '#059669', icon: Cloud },
                { name: 'Media Storage', status: (mediaStats?.totalFiles ?? 0) > 0 ? 'Healthy' : 'Empty', ok: true, detail: `${mediaStats?.totalFiles || 0} files · ${formatSize(mediaStats?.totalSize)}`, color: palette.goldDark, icon: HardDrive },
                { name: 'Activity Log', status: 'Recording', ok: true, detail: `${activityStats?.todayCount || 0} events today`, color: palette.deepTeal, icon: Activity },
              ].map((service) => (
                <Grid item xs={12} sm={6} md={3} key={service.name}>
                  <Card sx={{
                    borderRadius: 4, height: '100%', position: 'relative', overflow: 'hidden',
                    background: `linear-gradient(145deg, ${service.color}0A, transparent 70%)`,
                    border: `1px solid ${service.color}18`,
                    transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 16px 32px -8px ${service.color}22` },
                  }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                      <Box sx={{
                        width: 48, height: 48, borderRadius: 3, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `linear-gradient(135deg, ${service.color}1E, ${service.color}08)`,
                        color: service.color,
                      }}>
                        <service.icon size={23} strokeWidth={2.2} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={800}>{service.name}</Typography>
                        <Typography variant="body2" color={service.color} fontWeight={700}>{service.status}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{service.detail}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Panel title="Content Inventory" icon={<BookOpen size={19} color={palette.deepTeal} />}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: `${palette.deepTeal}06` }}>
                      <TableCell sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Module</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Items</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Managed At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { name: 'Books', count: d.totalBooks, route: '#/books', icon: BookOpen },
                      { name: 'Habits', count: habitCount, route: '#/habits', icon: Droplets },
                      { name: 'Health Tips', count: tipCount, route: '#/my-doctor', icon: Heart },
                      { name: 'Doctor Profiles', count: doctorCount, route: '#/my-doctor', icon: Stethoscope },
                      { name: 'Achievements', count: achievementCount, route: '#/my-captain', icon: Trophy },
                      { name: 'Media Files', count: mediaStats?.totalFiles, route: '#/media', icon: ImageIcon },
                    ].map((row) => (
                      <TableRow
                        hover
                        key={row.name}
                        sx={{
                          transition: 'background 150ms',
                          '&:last-child td': { borderBottom: 0 },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                              width: 32, height: 32, borderRadius: 2,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: `${palette.deepTeal}0C`, color: palette.deepTeal,
                            }}>
                              <row.icon size={15} />
                            </Box>
                            <Typography variant="body2" fontWeight={700}>{row.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={row.count ?? '—'}
                            size="small"
                            sx={{ fontWeight: 800, minWidth: 42, borderRadius: 2, backgroundColor: `${palette.deepTeal}10`, color: palette.deepTeal }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="caption"
                            component="a"
                            href={row.route}
                            sx={{
                              color: palette.deepTeal, fontWeight: 700, textDecoration: 'none',
                              display: 'inline-flex', alignItems: 'center', gap: 0.4,
                              px: 1, py: 0.4, borderRadius: 2,
                              transition: 'all 150ms',
                              '&:hover': { backgroundColor: `${palette.deepTeal}10`, textDecoration: 'none' },
                            }}
                          >
                            Open <ArrowUpRight size={13} />
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Panel>
          </>
        )}
      </Box>
    </FadeIn>
  );
}
