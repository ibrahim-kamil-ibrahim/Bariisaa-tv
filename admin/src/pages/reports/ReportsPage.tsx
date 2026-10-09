import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Skeleton,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { BarChart3, Download, Edit3, Trash2, Plus, FileDown } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import PageHeader from '../../components/PageHeader';
import { palette, typography } from '../../theme';
import api, { BASE_URL } from '../../services/api';

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState(0);
  const [period, setPeriod] = useState('monthly');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Saved Reports state
  const [reportPage, setReportPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('revenue');
  const [exportType, setExportType] = useState('users');
  const [exportFormat, setExportFormat] = useState('csv');
  const [formError, setFormError] = useState('');

  const params: any = { period };
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ['reports', 'revenue', period, fromDate, toDate],
    queryFn: () => api.get('/reports/revenue', { params }).then((r) => r.data.data),
    enabled: mainTab === 0,
  });

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['reports', 'users', period, fromDate, toDate],
    queryFn: () => api.get('/reports/users', { params }).then((r) => r.data.data),
    enabled: mainTab === 0,
  });

  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['reports', 'subscriptions', period, fromDate, toDate],
    queryFn: () => api.get('/reports/subscriptions', { params }).then((r) => r.data.data),
    enabled: mainTab === 0,
  });

  const { data: engagementData, isLoading: engagementLoading } = useQuery({
    queryKey: ['reports', 'engagement', period, fromDate, toDate],
    queryFn: () => api.get('/reports/engagement', { params }).then((r) => r.data.data),
    enabled: mainTab === 0,
  });

  const { data: savedData, isLoading: savedLoading } = useQuery({
    queryKey: ['saved-reports', reportPage],
    queryFn: () => api.get('/report-builder', { params: { page: reportPage + 1, limit: 20 } }).then((r) => r.data),
    enabled: mainTab === 1,
  });

  const savedReports = savedData?.data || [];
  const savedTotal = savedData?.meta?.total || 0;
  const savedTotalPages = Math.ceil(savedTotal / 20);

  const createMutation = useMutation({
    mutationFn: (body: any) => editId ? api.put(`/report-builder/${editId}`, body) : api.post('/report-builder', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['saved-reports'] }); setDialogOpen(false); resetForm(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/report-builder/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-reports'] }),
  });

  const resetForm = () => { setEditId(null); setReportName(''); setReportType('revenue'); setFormError(''); };

  const handleExport = (type: 'revenue' | 'users') => {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.set('fromDate', fromDate);
    if (toDate) queryParams.set('toDate', toDate);
    queryParams.set('format', 'csv');
    window.open(`/api/v1/reports/export/${type}?${queryParams.toString()}`, '_blank');
  };

  return (
    <Box>
      <PageHeader title="Reports" subtitle="Analytics and insights for your platform" />

      <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} sx={{ mb: 3 }}>
        <Tab label="Dashboard" />
        <Tab label="Saved Reports" />
      </Tabs>

      {mainTab === 0 && (
        <>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
            <TextField label="From" type="date" size="small" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="To" type="date" size="small" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <Tabs value={period} onChange={(_, v) => setPeriod(v)}>
              <Tab label="Daily" value="daily" />
              <Tab label="Weekly" value="weekly" />
              <Tab label="Monthly" value="monthly" />
              <Tab label="Yearly" value="yearly" />
            </Tabs>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('revenue')}>Export Revenue</Button>
              <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('users')}>Export Users</Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontFamily={typography.serif} fontWeight={700} mb={2}>Revenue {revenueData?.totalRevenue ? `(Total: $${revenueData.totalRevenue.toFixed(2)})` : ''}</Typography>
                  {revLoading ? <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} /> : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData?.periodRevenue || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke={palette.warmGrayLight} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke={palette.inkMuted} />
                        <YAxis tick={{ fontSize: 12 }} stroke={palette.inkMuted} />
                        <RechartsTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${palette.warmGrayLight}` }} />
                        <Legend />
                        <Line type="monotone" dataKey="amount" stroke={palette.deepTeal} strokeWidth={2} name="Revenue" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontFamily={typography.serif} fontWeight={700} mb={2}>New Users (Total: {userData?.total || 0})</Typography>
                  {userLoading ? <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} /> : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={userData?.signups || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke={palette.warmGrayLight} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke={palette.inkMuted} />
                        <YAxis tick={{ fontSize: 12 }} stroke={palette.inkMuted} />
                        <RechartsTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${palette.warmGrayLight}` }} />
                        <Bar dataKey="count" fill={palette.coral} radius={[4, 4, 0, 0]} name="Signups" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontFamily={typography.serif} fontWeight={700} mb={2}>Subscriptions</Typography>
                  {subLoading ? <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} /> : (
                    <Box>
                      <Grid container spacing={2} mb={2}>
                        <Grid item xs={3}><Typography variant="body2" color="text.secondary">Active</Typography><Typography variant="h6">{subData?.active || 0}</Typography></Grid>
                        <Grid item xs={3}><Typography variant="body2" color="text.secondary">Canceled</Typography><Typography variant="h6">{subData?.canceled || 0}</Typography></Grid>
                        <Grid item xs={3}><Typography variant="body2" color="text.secondary">Expired</Typography><Typography variant="h6">{subData?.expired || 0}</Typography></Grid>
                        <Grid item xs={3}><Typography variant="body2" color="text.secondary">Churn Rate</Typography><Typography variant="h6">{subData?.churnRate || 0}%</Typography></Grid>
                      </Grid>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={subData?.trend || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke={palette.warmGrayLight} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke={palette.inkMuted} />
                          <YAxis stroke={palette.inkMuted} />
                          <RechartsTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${palette.warmGrayLight}` }} />
                          <Legend />
                          <Bar dataKey="newSubscriptions" fill={palette.deepTeal} name="New" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="cancellations" fill={palette.coral} name="Cancelled" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontFamily={typography.serif} fontWeight={700} mb={2}>Engagement</Typography>
                  {engagementLoading ? <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} /> : (
                    <Box>
                      <Grid container spacing={2} mb={2}>
                        <Grid item xs={3}><Typography variant="body2" color="text.secondary">Reading Sessions</Typography><Typography variant="h6">{engagementData?.totalReadingSessions || 0}</Typography></Grid>
                        <Grid item xs={3}><Typography variant="body2" color="text.secondary">Listening Sessions</Typography><Typography variant="h6">{engagementData?.totalListeningSessions || 0}</Typography></Grid>
                        <Grid item xs={3}><Typography variant="body2" color="text.secondary">Avg Reading</Typography><Typography variant="h6">{engagementData?.avgReadingTimeMinutes || 0}m</Typography></Grid>
                        <Grid item xs={3}><Typography variant="body2" color="text.secondary">Avg Listening</Typography><Typography variant="h6">{engagementData?.avgListeningTimeMinutes || 0}m</Typography></Grid>
                      </Grid>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={engagementData?.dailyActivity || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke={palette.warmGrayLight} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke={palette.inkMuted} />
                          <YAxis stroke={palette.inkMuted} />
                          <RechartsTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${palette.warmGrayLight}` }} />
                          <Legend />
                          <Bar dataKey="readers" fill={palette.deepTeal} name="Readers" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="listeners" fill={palette.amber} name="Listeners" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {mainTab === 1 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><FileDown size={20} /> Quick Export</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <TextField select label="Data Type" value={exportType} onChange={(e) => setExportType(e.target.value)} size="small" sx={{ minWidth: 180 }}>
                  <MenuItem value="users">Users</MenuItem>
                  <MenuItem value="revenue">Revenue</MenuItem>
                  <MenuItem value="subscriptions">Subscriptions</MenuItem>
                </TextField>
                <TextField select label="Format" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} size="small" sx={{ minWidth: 120 }}>
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                </TextField>
                <Button startIcon={<Download size={16} />} variant="outlined" onClick={() => window.open(`${BASE_URL}/api/v1/report-builder/export/${exportType}?format=${exportFormat}`, '_blank')}>Export</Button>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>{savedTotal} saved reports</Typography>
            <Button startIcon={<Plus size={16} />} variant="contained" size="small" onClick={() => { resetForm(); setDialogOpen(true); }}>New Report</Button>
          </Box>

          {savedLoading ? <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={60} />)}</Box> : (
            <>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Updated</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                  <TableBody>
                    {savedReports.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                        <TableCell><Chip label={r.type} size="small" /></TableCell>
                        <TableCell>{new Date(r.updatedAt).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditId(r.id); setReportName(r.name); setReportType(r.type); setDialogOpen(true); }}><Edit3 size={16} /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => deleteMutation.mutate(r.id)}><Trash2 size={16} /></IconButton></Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">Page {reportPage + 1} of {savedTotalPages}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label="Previous" clickable onClick={() => setReportPage(Math.max(0, reportPage - 1))} disabled={reportPage === 0} />
                  <Chip label="Next" clickable onClick={() => setReportPage(Math.min(savedTotalPages - 1, reportPage + 1))} disabled={reportPage >= savedTotalPages - 1} />
                </Box>
              </Box>
            </>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Report' : 'New Report'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <TextField fullWidth label="Report Name" value={reportName} onChange={(e) => setReportName(e.target.value)} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth select label="Type" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <MenuItem value="revenue">Revenue</MenuItem>
            <MenuItem value="users">Users</MenuItem>
            <MenuItem value="engagement">Engagement</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => createMutation.mutate({ name: reportName, type: reportType, config: {} })} variant="contained" disabled={!reportName.trim()}>{editId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
