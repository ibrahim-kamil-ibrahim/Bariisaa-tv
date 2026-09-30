import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, IconButton, Tooltip, Typography, Card, CardContent,
  Chip, Grid, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Skeleton,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationMonths: number;
  features: string[] | Record<string, any>;
  isActive: boolean;
}

function normalizeFeatures(features: any): string[] {
  if (!features) return [];
  if (Array.isArray(features)) return features.map((f: any) => typeof f === 'string' ? f : String(f));
  if (typeof features === 'string') return features.split(',').filter((f: string) => f.trim());
  if (typeof features === 'object') {
    return Object.entries(features).map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase());
      if (typeof value === 'boolean') return value ? label : '';
      if (value === null || value === undefined) return '';
      return `${label}: ${value}`;
    }).filter(Boolean);
  }
  return [];
}

function featuresToObject(features: string[]): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const f of features) {
    if (!f.trim()) continue;
    if (f.includes(':')) {
      const [key, ...rest] = f.split(':');
      const val = rest.join(':').trim();
      const camelKey = key.trim().replace(/\s+(.)/g, (_: string, c: string) => c.toUpperCase());
      if (val === 'true') obj[camelKey] = true;
      else if (val === 'false') obj[camelKey] = false;
      else if (!isNaN(Number(val))) obj[camelKey] = Number(val);
      else obj[camelKey] = val;
    } else {
      const camelKey = f.trim().replace(/\s+(.)/g, (_: string, c: string) => c.toUpperCase());
      obj[camelKey] = true;
    }
  }
  return obj;
}

export default function PlansPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [editItem, setEditItem] = useState<Plan | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCurrency, setFormCurrency] = useState('ETB');
  const [formDuration, setFormDuration] = useState('1');
  const [formFeatures, setFormFeatures] = useState('');
  const [formError, setFormError] = useState('');

  const { data: plans, isLoading, isError, error } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.get('/subscriptions/plans/all').then((r) => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/subscriptions/plans/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      addNotification('Plan updated', 'success');
    },
    onError: (err: any) => addNotification(err?.response?.data?.message || 'Failed', 'error'),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/subscriptions/plans', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      handleClose();
      addNotification('Plan created', 'success');
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/subscriptions/plans/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      handleClose();
      addNotification('Plan updated', 'success');
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subscriptions/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      addNotification('Plan deleted', 'success');
    },
    onError: (err: any) => {
      addNotification(err?.response?.data?.message || 'Failed to delete plan', 'error');
      setDeleteDialogOpen(false);
    },
  });

  const handleOpen = (item?: Plan) => {
    if (item) {
      setEditItem(item);
      setFormName(item.name);
      setFormDescription(item.description || '');
      setFormPrice(String(item.price));
      setFormCurrency(item.currency);
      setFormDuration(String(item.durationMonths));
      setFormFeatures(normalizeFeatures(item.features).join('\n'));
    } else {
      setEditItem(null);
      setFormName('');
      setFormDescription('');
      setFormPrice('');
      setFormCurrency('ETB');
      setFormDuration('1');
      setFormFeatures('');
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditItem(null);
    setFormError('');
  };

  const handleSave = () => {
    if (!formName.trim()) {
      setFormError('Name required');
      return;
    }
    const featureLines = formFeatures.split('\n').filter((f: string) => f.trim());
    const features = featuresToObject(featureLines);
    const body = { name: formName, description: formDescription, price: Number(formPrice), currency: formCurrency, durationMonths: Number(formDuration), features };
    if (editItem) updateMutation.mutate({ id: editItem.id, body });
    else createMutation.mutate(body);
  };

  const handleDeleteClick = (plan: Plan) => {
    setDeleteTarget(plan);
    setDeleteDialogOpen(true);
  };

  const plansList = plans?.map((plan: any) => {
    const features = normalizeFeatures(plan.features);
    return (
      <Grid item xs={12} sm={6} md={4} key={plan.id}>
        <Card elevation={0} sx={{ borderRadius: 3, position: 'relative', overflow: 'hidden', transition: 'all 300ms ease', '&:hover': { transform: 'translateY(-4px)' }, border: plan.isActive ? '2px solid #FFD75A' : '1px solid #E4E1F0' }}>
          {plan.isActive && <Box sx={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#FFD75A', color: '#1E1B2E', px: 2, py: 0.5, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Active</Box>}
          {!plan.isActive && <Box sx={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#E4E1F0', color: '#666', px: 2, py: 0.5, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Inactive</Box>}
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h5" fontWeight={800}>{plan.name}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{plan.description || 'No description'}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 2 }}>
              <Typography variant="h3" fontWeight={800}>{plan.currency} {plan.price}</Typography>
              <Typography variant="body2" color="text.secondary">/{plan.durationMonths} mo</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              {features.map((f: string, i: number) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography fontSize={12} color="#059669">✓</Typography>
                  </Box>
                  <Typography variant="body2">{f}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" fontWeight={600} color={plan.isActive ? '#059669' : 'text.secondary'}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </Typography>
              <Switch checked={plan.isActive} onChange={(_, checked) => toggleMutation.mutate({ id: plan.id, isActive: checked })} size="small" />
            </Box>
          </CardContent>
          <CardContent sx={{ pt: 0, display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            <IconButton size="small" onClick={() => handleOpen(plan)}><EditIcon size={18} /></IconButton>
            <IconButton size="small" color="error" onClick={() => handleDeleteClick(plan)}><DeleteIcon size={18} /></IconButton>
          </CardContent>
        </Card>
      </Grid>
    );
  }) || [];

  return (
    <FadeIn>
      <Box>
        <PageHeader title="Subscription Plans" subtitle="Manage pricing plans" actionLabel="Add Plan" onAction={() => handleOpen()} />
        {error && <Alert severity="error" sx={{ mb: 2 }}>{(error as any)?.response?.data?.message || 'Failed'}</Alert>}
        <Grid container spacing={3}>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ py: 4 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            : plansList}
          <Grid item xs={12} sm={6} md={4}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '2px dashed #E4E1F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, '&:hover': { borderColor: '#402083' } }} onClick={() => handleOpen()}>
              <CardContent><Typography variant="h6" fontWeight={700} color="text.secondary">+ Add Plan</Typography></CardContent>
            </Card>
          </Grid>
        </Grid>

        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>{editItem ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <TextField autoFocus margin="dense" label="Plan Name" fullWidth value={formName} onChange={(e) => setFormName(e.target.value)} sx={{ mb: 2 }} />
            <TextField margin="dense" label="Description" fullWidth multiline rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField label="Price" type="number" fullWidth value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
              <FormControl fullWidth sx={{ minWidth: 100 }}>
                <InputLabel>Currency</InputLabel>
                <Select value={formCurrency} label="Currency" onChange={(e) => setFormCurrency(e.target.value)}>
                  <MenuItem value="ETB">ETB</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Months" type="number" fullWidth value={formDuration} onChange={(e) => setFormDuration(e.target.value)} />
            </Box>
            <TextField margin="dense" label="Features (one per line, e.g. 'Unlimited Access: true')" fullWidth multiline rows={4} value={formFeatures} onChange={(e) => setFormFeatures(e.target.value)} helperText="Use 'Key: value' format. Boolean true/false values will be stored as JSON." />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} sx={{ borderRadius: 2 }}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete Plan</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?</Typography>
            {deleteTarget?.isActive && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This plan is currently active. Consider deactivating it first.
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} sx={{ borderRadius: 2 }}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </FadeIn>
  );
}
