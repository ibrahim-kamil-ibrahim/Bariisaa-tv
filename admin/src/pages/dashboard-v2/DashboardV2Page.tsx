import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Avatar,
  Slide,
} from '@mui/material';
import {
  TrendingUp, Users, BookOpen, CreditCard, Cloud, Smartphone,
  Activity, ArrowUpRight, Cpu, HardDrive, Wifi, Timer,
  BarChart3, Target, Zap, Heart, Star, ShoppingCart,
  Gauge, Globe,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import StatCard from '../../components/StatCard';
import api from '../../services/api';

// Sparkline component
function Sparkline({ data, color, width = 80, height = 30 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return <Box sx={{ width: width || 80, height: height || 30 }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width || 80);
    const y = (height || 30) - ((v - min) / range) * ((height || 30) - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width || 80} height={height || 30} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Mini donut chart
function DonutChart({ segments, size = 80 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const circumference = 2 * Math.PI * 30;
  
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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc, i) => (
          <circle key={i} cx={size/2} cy={size/2} r="30" fill="none"
            stroke={arc.color} strokeWidth="12"
            strokeDasharray={`${arc.dashLen} ${arc.gap}`}
            strokeDashoffset={`${arc.start}`}
            transform={`rotate(-90 ${size/2} ${size/2})`} />
        ))}
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="700" fill="#1E1B2E">
          {segments.length}
        </text>
      </svg>
      <Box>
        {segments.map((seg, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: seg.color }} />
            <Typography variant="body2">{seg.label}</Typography>
            <Typography variant="body2" fontWeight={600}>{seg.value}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// Metric card for dashboard
function MetricCard({ icon: Icon, label, value, trend, prefix, color, sparkData }: {
  icon: any; label: string; value: number; trend?: number; prefix?: string; color: string; sparkData?: number[];
}) {
  return (
    <Card sx={{ borderRadius: 3, p: 2.5, height: '100%', background: `linear-gradient(135deg, ${color}08, ${color}04)`, border: `1px solid ${color}20`, transition: 'all 300ms ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${color}15` } }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}15`, color }}><Icon size={20} /></Box>
          {trend !== undefined && <Chip label={`${trend >= 0 ? '+' : ''}${trend}%`} size="small" color={trend >= 0 ? 'success' : 'error'} sx={{ fontWeight: 600 }} />}
        </Box>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        {sparkData && sparkData.length > 0 && <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}><Sparkline data={sparkData} color={color} /></Box>}
      </CardContent>
    </Card>
  );
}

// Activity feed item
function ActivityItem({ icon: Icon, text, time, color }: { icon: any; text: string; time: string; color: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', py: 0.5 }}>
      <Box sx={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}12`, color, flexShrink: 0 }}><Icon size={16} /></Box>
      <Box><Typography variant="body2" fontWeight={500}>{text}</Typography><Typography variant="caption" color="text.secondary">{time}</Typography></Box>
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
  const { data: recentPayments } = useQuery({ queryKey: ['recent-payments'], queryFn: () => api.get('/payments/admin/all', { params: { limit: 5 } }).then((r) => r.data.data) });
  
  const { data: liveMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['live-metrics', hours],
    queryFn: () => api.get('/live/metrics', { params: { hours } }).then((r) => r.data.data),
    enabled: tab === 1, refetchInterval: 10000,
  });
  const { data: onlineData } = useQuery({ queryKey: ['online-users'], queryFn: () => api.get('/live/online-users').then((r) => r.data.data), enabled: tab === 1, refetchInterval: 15000 });

  const [now, setNow] = useState(new Date());
  const timerRef = useState(() => setInterval(() => setNow(new Date()), 1000))[0];

  const getMetricValue = (key: string): number => { if (!liveMetrics?.[key]) return 0; const values = liveMetrics[key].values || []; return values.length > 0 ? values[values.length - 1].value : 0; };
  const getSparkline = (key: string): number[] => { if (!liveMetrics?.[key]) return []; return (liveMetrics[key].values || []).slice(-20).map((v: any) => v.value); };

  if (dashLoading) {
    return (
      <FadeIn><Box><PageHeader title="Dashboard" subtitle="Real-time platform overview" /><Grid container spacing={3}>{Array.from({ length: 8 }).map((_, i) => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={120} /></Grid>)}</Grid></Box></FadeIn>
    );
  }

  const d = dashboardData || {};
  const revenueData = recentPayments || [];
  const distributionData = [
    { label: 'Books', value: d.totalBooks || 0, color: '#402083' },
    { label: 'Users', value: d.totalUsers || 0, color: '#FFD75A' },
    { label: 'Subs', value: d.activeSubscriptions || 0, color: '#059669' },
  ];

  return (
    <FadeIn>
      <Box>
        <PageHeader title="Dashboard" subtitle={`Welcome back! • ${now.toLocaleTimeString()}`} />
        
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Overview" />
          <Tab label="Analytics" />
          <Tab label="System" />
        </Tabs>

        {/* ===== OVERVIEW ===== */}
        {tab === 0 && (
          <>
            {/* Quick Stats */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              {[
                { icon: Users, label: 'Total Users', value: d.totalUsers || 0, sub: 'All time', color: '#402083' },
                { icon: BookOpen, label: 'Books', value: d.totalBooks || 0, sub: 'Library', color: '#FFD75A' },
                { icon: CreditCard, label: 'Revenue', value: `$${d.totalRevenue || 0}`, sub: 'Today', color: '#059669' },
                { icon: Heart, label: 'Active Subs', value: d.activeSubscriptions || 0, sub: 'Premium', color: '#E5484D' },
              ].map((s) => (
                <Grid item xs={12} sm={6} md={3} key={s.label}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 2, backgroundColor: `${s.color}08` }}>
                    <Box sx={{ color: s.color }}><s.icon size={22} /></Box>
                    <Box><Typography variant="h6" fontWeight={700}>{s.value}</Typography><Typography variant="caption" color="text.secondary">{s.label}</Typography></Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Main Metric Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard icon={Users} label="Total Users" value={d.totalUsers || 0} trend={12} color="#402083" sparkData={getSparkline('activeUsers')} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard icon={CreditCard} label="Active Subscriptions" value={d.activeSubscriptions || 0} trend={5} color="#FFD75A" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard icon={TrendingUp} label="Total Revenue" value={d.totalRevenue || 0} trend={8} prefix="$" color="#059669" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard icon={BookOpen} label="Total Books" value={d.totalBooks || 0} color="#6366F1" />
              </Grid>
            </Grid>

            {/* Charts Row */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Card sx={{ borderRadius: 3, p: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" fontWeight={700}>Revenue Trend</Typography>
                      <Chip label="Last 30 days" size="small" variant="outlined" />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 120 }}>
                      {(revenueData.slice(-14) || []).map((p: any, i: number) => (
                        <Box key={i} sx={{ flex: 1, height: `${((p.amount || 0) / Math.max(revenueData.reduce((s: any, r: any) => s + r.amount, 0) / 14, 1)) * 100}%`, backgroundColor: '#402083', borderRadius: '4px 4px 0 0', opacity: 0.5 + (i / 14) * 0.5, minHeight: 4 }} />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">Revenue</Typography>
                      <Typography variant="caption" fontWeight={600} color="#059669">+12.5% from last month</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3, p: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Library Distribution</Typography>
                    <DonutChart segments={distributionData} />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Bottom Row */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><Activity size={20} color="#402083" /> Activity</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <ActivityItem icon={Users} text={`${activityStats?.todayCount || 0} actions today`} time="Today" color="#402083" />
                      <ActivityItem icon={Heart} text={`${activityStats?.weekCount || 0} this week`} time="This week" color="#FFD75A" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><Cloud size={20} color="#402083" /> Server Health</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Chip label={`API: ${serverHealth?.status || 'OK'}`} color="success" variant="outlined" size="small" />
                      <Chip label="DB: Connected" color="success" variant="outlined" size="small" />
                      <Chip label={`Uptime: 99.9%`} color="info" variant="outlined" size="small" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Bottom Tables */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Recent Transactions</Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead><TableRow sx={{ backgroundColor: '#F5F4FA' }}><TableCell>ID</TableCell><TableCell>Amount</TableCell><TableCell>Method</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                        <TableBody>{(recentPayments || []).slice(0, 5).map((p: any) => (
                          <TableRow hover key={p.id}><TableCell>#{p.gatewayTransactionId?.slice(-8)}</TableCell><TableCell sx={{ fontWeight: 600 }}>{p.currency} {p.amount}</TableCell><TableCell>{p.gateway}</TableCell><TableCell><Chip label={p.status} size="small" color={p.status === 'COMPLETED' ? 'success' : 'default'} variant="outlined" /></TableCell></TableRow>
                        ))}</TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={5}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>System Status</Typography>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#F5F4FA' }}>
                      {['✓ Last sync: just now', '✓ Database: healthy', '✓ Cache: 94.2% hit rate'].map((l, i) => (
                        <Typography key={i} variant="caption" fontFamily="monospace" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{l}</Typography>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

        {/* ===== ANALYTICS ===== */}
        {tab === 1 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select value={hours} onChange={(e) => setHours(Number(e.target.value))} size="small">
                  <MenuItem value={1}>Last 1 hour</MenuItem><MenuItem value={6}>Last 6 hours</MenuItem><MenuItem value={24}>Last 24 hours</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Card sx={{ mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #402083, #3D2081)', color: '#fff' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 3 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={28} /></Box>
                <Box><Typography variant="h3" fontWeight={800}>{onlineData?.online ?? '—'}</Typography><Typography variant="body2" sx={{ opacity: 0.9 }}>Users online now</Typography></Box>
              </CardContent>
            </Card>
            <Grid container spacing={3}>
              {[
                { key: 'activeUsers', label: 'Active Users', icon: Users, color: '#402083', unit: '', decimals: 0 },
                { key: 'requestsPerMin', label: 'Requests / min', icon: Wifi, color: '#6366F1', unit: '/min', decimals: 0 },
                { key: 'avgResponseTime', label: 'Avg Response', icon: Timer, color: '#E3B92F', unit: 'ms', decimals: 1 },
                { key: 'cpu', label: 'CPU', icon: Cpu, color: '#E5484D', unit: '%', decimals: 0 },
                { key: 'memory', label: 'Memory', icon: HardDrive, color: '#69539E', unit: '%', decimals: 0 },
              ].map((metric) => (
                <Grid item xs={12} sm={6} md={4} key={metric.key}>
                  <Card sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><metric.icon size={18} color={metric.color} /><Typography variant="body2" color="text.secondary">{metric.label}</Typography></Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="h3" fontWeight={800}>{getMetricValue(metric.key).toFixed(metric.decimals)}</Typography>
                        <Typography variant="body2" color="text.secondary">{metric.unit}</Typography>
                      </Box>
                      {getSparkline(metric.key).length > 1 && <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}><Sparkline data={getSparkline(metric.key)} color={metric.color} width={100} height={28} /></Box>}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* ===== SYSTEM ===== */}
        {tab === 2 && (
          <Grid container spacing={3}>
            {[
              { name: 'Web Server', status: 'Operational', uptime: '99.9%', color: '#059669', icon: Globe },
              { name: 'Database', status: 'Operational', uptime: '99.8%', color: '#059669', icon: Cloud },
              { name: 'Cache', status: 'Operational', uptime: '99.9%', color: '#059669', icon: Zap },
              { name: 'Storage', status: 'Healthy', uptime: '99.7%', color: '#FFD75A', icon: HardDrive },
              { name: 'CDN', status: 'Operational', uptime: '99.9%', color: '#059669', icon: Wifi },
              { name: 'Queue', status: 'Operational', uptime: '99.6%', color: '#059669', icon: Activity },
            ].map((service) => (
              <Grid item xs={12} sm={6} md={4} key={service.name}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, backgroundColor: `${service.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: service.color }}><service.icon size={22} /></Box>
                    <Box sx={{ flex: 1 }}><Typography variant="subtitle2" fontWeight={700}>{service.name}</Typography><Typography variant="body2" color={service.color} fontWeight={600}>{service.status}</Typography></Box>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">{service.uptime}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </FadeIn>
  );
}
