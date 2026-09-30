import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Chip,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Tabs,
  Tab,
  Avatar,
  AvatarGroup,
  Card,
  CardContent,
} from '@mui/material';
import { Clock, Globe, Monitor, MapPin, User } from 'lucide-react';
import DataTable, { Column } from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';
import { AuditLog } from '../../types';

const ACTION_OPTIONS = ['All', 'create', 'update', 'delete', 'login', 'logout', 'status_change'];
const RESOURCE_OPTIONS = ['All', 'book', 'user', 'category', 'author', 'subscription', 'payment', 'role'];
const ACTIVITY_MODULES = ['All', 'books', 'users', 'payments', 'categories', 'authors', 'notifications', 'settings'];

function getActionColor(a: string) {
  switch (a) {
    case 'create': return 'success' as const;
    case 'update': return 'info' as const;
    case 'delete': return 'error' as const;
    case 'login': return 'primary' as const;
    case 'logout': return 'default' as const;
    case 'bulk': return 'warning' as const;
    default: return 'default' as const;
  }
}

export default function AuditLogsPage() {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activityModule, setActivityModule] = useState('');
  const [activityAction, setActivityAction] = useState('');

  const auditParams: Record<string, any> = { page: page + 1, limit };
  if (actionFilter && actionFilter !== 'All') auditParams.action = actionFilter;
  if (resourceFilter && resourceFilter !== 'All') auditParams.resource = resourceFilter;
  if (fromDate) auditParams.fromDate = fromDate;
  if (toDate) auditParams.toDate = toDate;

  const activityParams: Record<string, any> = { page: page + 1, limit };
  if (activityModule && activityModule !== 'All') activityParams.module = activityModule;
  if (activityAction && activityAction !== 'All') activityParams.action = activityAction;

  const { data: auditData, isLoading: auditLoading, isError: auditError, error: auditErr } = useQuery({
    queryKey: ['audit-logs', page, limit, actionFilter, resourceFilter, fromDate, toDate],
    queryFn: () => api.get('/audit-logs', { params: auditParams }).then((r) => r.data.data || r.data),
    enabled: tab === 0,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['activity-timeline', page, activityModule, activityAction],
    queryFn: () => api.get('/activity', { params: activityParams }).then((r) => r.data),
    enabled: tab === 1,
  });

  const auditLogs: AuditLog[] = auditData?.logs || auditData?.auditLogs || auditData || [];
  const activities = activityData?.data || [];
  const activityTotal = activityData?.meta?.total || 0;

  const auditColumns: Column<AuditLog>[] = [
    {
      id: 'user',
      label: 'User',
      render: (row) => (
        <Typography variant="body2" fontWeight={500}>
          {row.user?.name || row.userId || 'System'}
        </Typography>
      ),
    },
    {
      id: 'action',
      label: 'Action',
      render: (row) => (
        <Chip label={row.action} size="small" color={getActionColor(row.action)} variant="outlined" />
      ),
    },
    { id: 'resource', label: 'Resource', render: (row) => row.resource },
    { id: 'resourceId', label: 'Resource ID', render: (row) => row.resourceId ? <Typography variant="body2" sx={{ fontFamily: 'mono', fontSize: 12 }}>{row.resourceId}</Typography> : '-' },
    { id: 'ip', label: 'IP', render: (row) => row.ip || '-' },
    {
      id: 'date',
      label: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
  ];

  const handleTabChange = (_: any, v: number) => {
    setTab(v);
    setPage(0);
  };

  return (
    <FadeIn>
    <Box>
      <PageHeader title="Audit & Activity" subtitle="Track all system activities and changes" />

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Audit Table" />
        <Tab label="Activity Timeline" />
      </Tabs>

      {tab === 0 && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth size="small" label="Action" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}>
                {ACTION_OPTIONS.map((a) => <MenuItem key={a} value={a === 'All' ? '' : a}>All Actions</MenuItem>)}
                {ACTION_OPTIONS.filter(a => a !== 'All').map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth size="small" label="Resource" value={resourceFilter} onChange={(e) => { setResourceFilter(e.target.value); setPage(0); }}>
                {RESOURCE_OPTIONS.map((r) => <MenuItem key={r} value={r === 'All' ? '' : r}>{r}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="From" type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="To" type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>

          <DataTable
            columns={auditColumns}
            rows={auditLogs}
            total={auditData?.meta?.total ?? auditData?.pagination?.total ?? auditLogs.length}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            loading={auditLoading}
            error={auditError ? (auditErr as any)?.response?.data?.message || (auditErr as any)?.message || 'Failed to load audit logs' : null}
            getRowId={(r) => r.id}
          />
        </>
      )}

      {tab === 1 && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Module" value={activityModule} onChange={(e) => { setActivityModule(e.target.value); setPage(0); }}>
                {ACTIVITY_MODULES.map((m) => <MenuItem key={m} value={m === 'All' ? '' : m}>{m}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Action" value={activityAction} onChange={(e) => { setActivityAction(e.target.value); setPage(0); }}>
                <MenuItem value="">All Actions</MenuItem>
                {['create', 'update', 'delete', 'login', 'logout', 'bulk'].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>

          {activityLoading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}><CardContent><Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}><Avatar sx={{ bgcolor: 'grey.300' }} /> <Box sx={{ flex: 1 }}><Typography color="text.secondary">Loading...</Typography></Box></Box></CardContent></Card>
              ))}
            </Box>
          )}

          {!activityLoading && activities.map((activity: any) => (
            <Card key={activity.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}><User size={20} /></Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1">
                      <strong>{activity.user?.name || 'System'}</strong> {activity.action} {activity.module}
                      {activity.resourceId && <Chip label={activity.resourceId.slice(0, 8)} size="small" sx={{ ml: 1 }} />}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Clock size={12} /> {new Date(activity.createdAt).toLocaleString()}
                      </Typography>
                      {activity.ipAddress && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Globe size={12} /> {activity.ipAddress}
                        </Typography>
                      )}
                      {activity.browser && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Monitor size={12} /> {activity.browser}
                        </Typography>
                      )}
                      {activity.location && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MapPin size={12} /> {activity.location}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Chip label={activity.action} size="small" color={getActionColor(activity.action)} />
                </Box>
              </CardContent>
            </Card>
          ))}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Page {page + 1} of {Math.ceil(activityTotal / limit)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label="Previous" clickable onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} />
              <Chip label="Next" clickable onClick={() => setPage(Math.min(Math.ceil(activityTotal / limit) - 1, page + 1))} disabled={page >= Math.ceil(activityTotal / limit) - 1} />
            </Box>
          </Box>
        </>
      )}
    </Box>
    </FadeIn>
  );
}
