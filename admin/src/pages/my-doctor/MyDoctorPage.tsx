import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Chip, IconButton, Button, Typography, Tabs, Tab, Switch, FormControlLabel,
  Card, CardContent, Grid, Skeleton, Paper, InputAdornment, Alert, TextField,
  Dialog, DialogContent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Lightbulb, Stethoscope, Search, X, Eye, Calendar, ListOrdered, UserRound } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FadeIn from '../../components/FadeIn';
import FormModal from '../../components/FormModal';
import FormTextField from '../../components/FormTextField';
import api from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';

interface HealthTip { id: string; title: string; content: string; emoji: string; category: string; order: number; createdAt?: string; updatedAt?: string; }
interface DoctorProfile { id: string; name: string; specialty: string; bio?: string; photoUrl?: string; available: boolean; order: number; createdAt?: string; updatedAt?: string; }

const categoryGradient = (cat?: string) => {
  switch ((cat || '').toLowerCase()) {
    case 'health': return 'linear-gradient(135deg, #16A34A 0%, #4ADE80 100%)';
    case 'fitness': return 'linear-gradient(135deg, #EA580C 0%, #FB923C 100%)';
    case 'mindfulness': return 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)';
    case 'productivity': return 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)';
    case 'learning': return 'linear-gradient(135deg, #0891B2 0%, #22D3EE 100%)';
    case 'nutrition': return 'linear-gradient(135deg, #CA8A04 0%, #FACC15 100%)';
    default: return 'linear-gradient(135deg, #402083 0%, #6B4EAB 100%)';
  }
};

const clampSx = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as const;

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function formatDateTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function HoverIcon({ title, children, onClick, danger }: { title: string; children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <IconButton
      size="small"
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      sx={{
        backgroundColor: 'rgba(255,255,255,0.95)', width: 34, height: 34, color: danger ? '#D32F2F' : '#402083',
        '&:hover': { backgroundColor: danger ? '#FDE8E8' : '#fff' },
      }}
    >
      {children}
    </IconButton>
  );
}

function StatBox({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <Box sx={{ flex: 1, minWidth: 100, p: 1.75, borderRadius: 2, backgroundColor: color, textAlign: 'center' }}>
      {children}
    </Box>
  );
}

function TipCard({ tip, onEdit, onDelete, onView }: { tip: HealthTip; onEdit: (t: HealthTip) => void; onDelete: (t: HealthTip) => void; onView: (t: HealthTip) => void }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden',
        border: '1px solid rgba(30,27,46,0.06)', transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 16px 40px rgba(30,27,46,0.12)', borderColor: 'rgba(64,32,131,0.15)' },
      }}
    >
      <Box sx={{ height: 130, position: 'relative', overflow: 'hidden', flexShrink: 0, background: categoryGradient(tip.category), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: 52, lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>{tip.emoji}</Typography>
        <Chip label={tip.category || 'general'} size="small" sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1, fontWeight: 700, fontSize: 10.5, height: 22, backgroundColor: 'rgba(255,255,255,0.92)', color: '#402083', textTransform: 'capitalize' }} />
        <Box
          sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1, p: 1.5,
            background: 'linear-gradient(transparent, rgba(30,27,46,0.7))', opacity: 0, transform: 'translateY(8px)',
            transition: 'all 250ms ease', '.MuiCard-root:hover &': { opacity: 1, transform: 'translateY(0)' },
          }}
        >
          <HoverIcon title="View Details" onClick={() => onView(tip)}><Eye size={16} color="#402083" /></HoverIcon>
          <HoverIcon title="Edit" onClick={() => onEdit(tip)}><EditIcon fontSize="small" /></HoverIcon>
          <HoverIcon title="Delete" danger onClick={() => onDelete(tip)}><DeleteIcon fontSize="small" /></HoverIcon>
        </Box>
      </Box>

      <CardContent sx={{ px: 2.5, pt: 2, pb: 1, flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.35, fontSize: 15 }}>{tip.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ...clampSx }}>{tip.content}</Typography>
      </CardContent>

      <Box sx={{ px: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Chip label={`Order ${tip.order}`} size="small" variant="outlined" sx={{ fontSize: 11, height: 24, color: '#402083', borderColor: 'rgba(64,32,131,0.2)' }} />
        <Button
          size="small"
          onClick={() => onView(tip)}
          sx={{ ml: 'auto', fontSize: 12, fontWeight: 600, color: '#402083', textTransform: 'none', '&:hover': { backgroundColor: '#EEE8FA' } }}
          endIcon={<Eye size={14} />}
        >
          Details
        </Button>
      </Box>
    </Card>
  );
}

function DoctorCard({ doc, onEdit, onDelete, onView }: { doc: DoctorProfile; onEdit: (d: DoctorProfile) => void; onDelete: (d: DoctorProfile) => void; onView: (d: DoctorProfile) => void }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden',
        border: '1px solid rgba(30,27,46,0.06)', transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 16px 40px rgba(30,27,46,0.12)', borderColor: 'rgba(64,32,131,0.15)' },
      }}
    >
      <Box sx={{ height: 150, position: 'relative', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, #402083 0%, #6B4EAB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {doc.photoUrl ? (
          <Box component="img" src={doc.photoUrl} alt={doc.name} sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 400ms ease', '.MuiCard-root:hover &': { transform: 'scale(1.05)' } }} />
        ) : (
          <Stethoscope size={44} color="rgba(255,255,255,0.85)" />
        )}
        <Chip
          label={doc.available ? 'AVAILABLE' : 'UNAVAILABLE'}
          size="small"
          sx={{
            position: 'absolute', top: 10, left: 10, zIndex: 1, fontWeight: 700, fontSize: 10.5, height: 22,
            backgroundColor: doc.available ? '#DCFCE7' : '#E5E7EB', color: doc.available ? '#15803D' : '#6B7280',
          }}
        />
        <Box
          sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1, p: 1.5,
            background: 'linear-gradient(transparent, rgba(30,27,46,0.7))', opacity: 0, transform: 'translateY(8px)',
            transition: 'all 250ms ease', '.MuiCard-root:hover &': { opacity: 1, transform: 'translateY(0)' },
          }}
        >
          <HoverIcon title="View Details" onClick={() => onView(doc)}><Eye size={16} color="#402083" /></HoverIcon>
          <HoverIcon title="Edit" onClick={() => onEdit(doc)}><EditIcon fontSize="small" /></HoverIcon>
          <HoverIcon title="Delete" danger onClick={() => onDelete(doc)}><DeleteIcon fontSize="small" /></HoverIcon>
        </Box>
      </Box>

      <CardContent sx={{ px: 2.5, pt: 2, pb: 1, flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.35, fontSize: 15 }}>{doc.name}</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
          <Chip label={doc.specialty} size="small" variant="outlined" sx={{ fontSize: 11, height: 22, color: '#402083', borderColor: 'rgba(64,32,131,0.3)' }} />
        </Box>
        {doc.bio && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ...clampSx }}>{doc.bio}</Typography>
        )}
      </CardContent>

      <Box sx={{ px: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Chip label={`Order ${doc.order}`} size="small" variant="outlined" sx={{ fontSize: 11, height: 24, color: '#402083', borderColor: 'rgba(64,32,131,0.2)' }} />
        <Button
          size="small"
          onClick={() => onView(doc)}
          sx={{ ml: 'auto', fontSize: 12, fontWeight: 600, color: '#402083', textTransform: 'none', '&:hover': { backgroundColor: '#EEE8FA' } }}
          endIcon={<Eye size={14} />}
        >
          Details
        </Button>
      </Box>
    </Card>
  );
}

function TipDetailDialog({ tip, onClose, onEdit }: { tip: HealthTip | null; onClose: () => void; onEdit: (t: HealthTip) => void }) {
  if (!tip) return null;
  return (
    <Dialog open={!!tip} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      <Box sx={{ position: 'relative', height: 170, overflow: 'hidden', background: categoryGradient(tip.category), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: 72, lineHeight: 1, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))' }}>{tip.emoji}</Typography>
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2, backgroundColor: 'rgba(30,27,46,0.55)', color: '#fff', width: 36, height: 36, '&:hover': { backgroundColor: 'rgba(30,27,46,0.75)' } }}>
          <X size={20} />
        </IconButton>
        <Chip label={tip.category || 'general'} size="small" sx={{ position: 'absolute', top: 14, left: 14, fontWeight: 700, fontSize: 11, backgroundColor: 'rgba(255,255,255,0.92)', color: '#402083', textTransform: 'capitalize' }} />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, background: 'linear-gradient(transparent, rgba(30,27,46,0.45))' }} />
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2, minWidth: 0 }}>{tip.title}</Typography>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => { onEdit(tip); onClose(); }} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flexShrink: 0, ml: 2 }}>
            Edit
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <StatBox color="#EEE8FA"><Lightbulb size={20} color="#402083" /><Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, fontSize: 14, textTransform: 'capitalize' }}>{tip.category || 'general'}</Typography><Typography variant="caption" color="text.secondary">Category</Typography></StatBox>
          <StatBox color="#F5F4FA"><ListOrdered size={20} color="#6E6A85" /><Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, fontSize: 14 }}>{tip.order}</Typography><Typography variant="caption" color="text.secondary">Order</Typography></StatBox>
          <StatBox color="#F5F4FA"><Calendar size={20} color="#6E6A85" /><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>Created</Typography><Typography variant="caption" color="text.secondary">{formatDate(tip.createdAt)}</Typography></StatBox>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Content</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>{tip.content}</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">Updated {formatDateTime(tip.updatedAt)}</Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function DoctorDetailDialog({ doc, onClose, onEdit }: { doc: DoctorProfile | null; onClose: () => void; onEdit: (d: DoctorProfile) => void }) {
  if (!doc) return null;
  return (
    <Dialog open={!!doc} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden', background: 'linear-gradient(135deg, #402083 0%, #6B4EAB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {doc.photoUrl ? (
          <Box component="img" src={doc.photoUrl} alt={doc.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Stethoscope size={64} color="rgba(255,255,255,0.85)" />
        )}
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2, backgroundColor: 'rgba(30,27,46,0.55)', color: '#fff', width: 36, height: 36, '&:hover': { backgroundColor: 'rgba(30,27,46,0.75)' } }}>
          <X size={20} />
        </IconButton>
        <Chip
          label={doc.available ? 'AVAILABLE' : 'UNAVAILABLE'}
          size="small"
          sx={{ position: 'absolute', top: 14, left: 14, fontWeight: 700, fontSize: 11, backgroundColor: doc.available ? '#DCFCE7' : '#E5E7EB', color: doc.available ? '#15803D' : '#6B7280' }}
        />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, rgba(30,27,46,0.45))' }} />
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>{doc.name}</Typography>
            <Chip label={doc.specialty} size="small" sx={{ mt: 1, backgroundColor: '#EEE8FA', color: '#402083', fontWeight: 600 }} />
          </Box>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => { onEdit(doc); onClose(); }} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flexShrink: 0, ml: 2 }}>
            Edit
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <StatBox color="#EEE8FA"><UserRound size={20} color="#402083" /><Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, fontSize: 14 }}>{doc.specialty}</Typography><Typography variant="caption" color="text.secondary">Specialty</Typography></StatBox>
          <StatBox color="#F5F4FA"><ListOrdered size={20} color="#6E6A85" /><Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, fontSize: 14 }}>{doc.order}</Typography><Typography variant="caption" color="text.secondary">Order</Typography></StatBox>
          <StatBox color={doc.available ? '#DCFCE7' : '#F5F4FA'}><Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, fontSize: 14, color: doc.available ? '#15803D' : undefined }}>{doc.available ? 'Yes' : 'No'}</Typography><Typography variant="caption" color="text.secondary">Available</Typography></StatBox>
          <StatBox color="#F5F4FA"><Calendar size={20} color="#6E6A85" /><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>Created</Typography><Typography variant="caption" color="text.secondary">{formatDate(doc.createdAt)}</Typography></StatBox>
        </Box>

        {doc.bio && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Bio</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>{doc.bio}</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">Updated {formatDateTime(doc.updatedAt)}</Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ icon, title, description, hasFilters, onClear, onAdd, addLabel }: {
  icon: React.ReactNode; title: string; description: string; hasFilters: boolean; onClear: () => void; onAdd: () => void; addLabel: string;
}) {
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Box sx={{ opacity: 0.4, display: 'flex', justifyContent: 'center' }}>{icon}</Box>
      <Typography variant="h6" fontWeight={700} sx={{ mt: 2, mb: 0.5 }}>{hasFilters ? title.replace('yet', 'found') : title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{hasFilters ? 'Try adjusting your search or filters' : description}</Typography>
      {hasFilters ? (
        <Button variant="outlined" onClick={onClear} sx={{ borderRadius: 2, textTransform: 'none' }}>Clear filters</Button>
      ) : (
        <Button variant="contained" onClick={onAdd} sx={{ borderRadius: 2, textTransform: 'none' }}>{addLabel}</Button>
      )}
    </Box>
  );
}

export default function MyDoctorPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [tabIndex, setTabIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [tipCategoryFilter, setTipCategoryFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formTip, setFormTip] = useState({ title: '', content: '', emoji: '💪', category: 'general', order: 0 });
  const [formDoctor, setFormDoctor] = useState({ name: '', specialty: '', bio: '', photoUrl: '', available: true, order: 0 });
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'tips' | 'profiles'>('tips');
  const [detailTip, setDetailTip] = useState<HealthTip | null>(null);
  const [detailDoctor, setDetailDoctor] = useState<DoctorProfile | null>(null);

  const tipsQuery = useQuery({
    queryKey: ['health-tips'],
    queryFn: () => api.get('/my-doctor/tips').then((r) => r.data),
  });
  const doctorsQuery = useQuery({
    queryKey: ['doctor-profiles'],
    queryFn: () => api.get('/my-doctor/profiles').then((r) => r.data),
  });

  const tips: HealthTip[] = tipsQuery.data?.data || [];
  const doctors: DoctorProfile[] = doctorsQuery.data?.data || [];

  const q = search.trim().toLowerCase();
  const tipCategories = Array.from(new Set(tips.map((t) => t.category).filter(Boolean)));
  const filteredTips = tips.filter((t) => {
    if (tipCategoryFilter !== 'ALL' && t.category !== tipCategoryFilter) return false;
    if (!q) return true;
    return (t.title || '').toLowerCase().includes(q) || (t.content || '').toLowerCase().includes(q);
  });
  const filteredDoctors = doctors.filter((d) => {
    if (availabilityFilter === 'AVAILABLE' && !d.available) return false;
    if (availabilityFilter === 'UNAVAILABLE' && d.available) return false;
    if (!q) return true;
    return (d.name || '').toLowerCase().includes(q) || (d.specialty || '').toLowerCase().includes(q);
  });

  const isLoading = tabIndex === 0 ? tipsQuery.isLoading : doctorsQuery.isLoading;
  const isError = tabIndex === 0 ? tipsQuery.isError : doctorsQuery.isError;
  const error = tabIndex === 0 ? tipsQuery.error : doctorsQuery.error;
  const hasFilters = !!search || (tabIndex === 0 ? tipCategoryFilter !== 'ALL' : availabilityFilter !== 'ALL');
  const activeItems = tabIndex === 0 ? filteredTips : filteredDoctors;

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post(`/my-doctor/${tabIndex === 0 ? 'tips' : 'profiles'}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['health-tips'] }); queryClient.invalidateQueries({ queryKey: ['doctor-profiles'] }); addNotification(tabIndex === 0 ? 'Health tip created' : 'Doctor created', 'success'); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/my-doctor/${tabIndex === 0 ? 'tips' : 'profiles'}/${body.id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['health-tips'] }); queryClient.invalidateQueries({ queryKey: ['doctor-profiles'] }); addNotification(tabIndex === 0 ? 'Health tip updated' : 'Doctor updated', 'success'); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/my-doctor/${deleteType}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-tips'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-profiles'] });
      setDeleteId(null);
      addNotification(deleteType === 'tips' ? 'Health tip deleted' : 'Doctor deleted', 'success');
    },
  });

  const handleOpen = (item?: any) => {
    if (tabIndex === 0) {
      setFormTip(item ? { title: item.title, content: item.content || '', emoji: item.emoji || '💪', category: item.category || 'general', order: item.order || 0 } : { title: '', content: '', emoji: '💪', category: 'general', order: 0 });
    } else {
      setFormDoctor(item ? { name: item.name, specialty: item.specialty, bio: item.bio || '', photoUrl: item.photoUrl || '', available: item.available ?? true, order: item.order || 0 } : { name: '', specialty: '', bio: '', photoUrl: '', available: true, order: 0 });
    }
    setEditItem(item || null);
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => { setDialogOpen(false); setEditItem(null); setFormError(''); };

  const handleSave = () => {
    if (tabIndex === 0) {
      if (!formTip.title.trim()) { setFormError('Title is required'); return; }
      if (editItem) updateMutation.mutate({ id: editItem.id, ...formTip });
      else createMutation.mutate(formTip);
    } else {
      if (!formDoctor.name.trim()) { setFormError('Name is required'); return; }
      if (editItem) updateMutation.mutate({ id: editItem.id, ...formDoctor });
      else createMutation.mutate(formDoctor);
    }
  };

  const clearFilters = () => { setSearch(''); setTipCategoryFilter('ALL'); setAvailabilityFilter('ALL'); };

  return (
    <FadeIn>
      <Box>
        <PageHeader
          title="My Doctor"
          subtitle={`${tips.length} health tips · ${doctors.length} doctors`}
          actionLabel={tabIndex === 0 ? 'Add Tip' : 'Add Doctor'}
          onAction={() => handleOpen()}
        />

        <Tabs
          value={tabIndex}
          onChange={(_, v) => { setTabIndex(v); clearFilters(); }}
          sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: 14, minHeight: 44 } }}
        >
          <Tab label={`Health Tips (${tips.length})`} />
          <Tab label={`Doctor Profiles (${doctors.length})`} />
        </Tabs>

        {/* Toolbar */}
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 3, borderRadius: 3, border: '1px solid rgba(30,27,46,0.06)', flexWrap: 'wrap' }}>
          <TextField
            placeholder={tabIndex === 0 ? 'Search health tips...' : 'Search doctors...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 180, maxWidth: 320 }}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><Search size={18} color="#6E6A85" /></InputAdornment>),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.5 }}><X size={16} color="#6E6A85" /></IconButton>
                </InputAdornment>
              ) : null,
              sx: { borderRadius: 2, fontSize: 14, backgroundColor: '#F5F4FA', '&:hover': { backgroundColor: '#F0EEF8' }, '&.Mui-focused': { backgroundColor: '#fff' } },
            }}
          />

          {tabIndex === 0 ? (
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {['ALL', ...tipCategories].map((cat) => (
                <Chip
                  key={cat}
                  label={cat === 'ALL' ? 'All' : cat}
                  onClick={() => setTipCategoryFilter(cat)}
                  color={tipCategoryFilter === cat ? 'primary' : 'default'}
                  variant={tipCategoryFilter === cat ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              {(['ALL', 'AVAILABLE', 'UNAVAILABLE'] as const).map((av) => (
                <Chip
                  key={av}
                  label={av === 'ALL' ? 'All' : av.charAt(0) + av.slice(1).toLowerCase()}
                  onClick={() => setAvailabilityFilter(av)}
                  color={availabilityFilter === av ? 'primary' : 'default'}
                  variant={availabilityFilter === av ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Box>
          )}
        </Paper>

        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load'}
          </Alert>
        )}

        {isLoading ? (
          <Grid container spacing={3}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : activeItems.length === 0 ? (
          tabIndex === 0 ? (
            <EmptyState
              icon={<Lightbulb size={56} color="#6E6A85" />}
              title="No health tips yet"
              description="Create your first health tip to get started"
              hasFilters={hasFilters}
              onClear={clearFilters}
              onAdd={() => handleOpen()}
              addLabel="Add Tip"
            />
          ) : (
            <EmptyState
              icon={<Stethoscope size={56} color="#6E6A85" />}
              title="No doctor profiles yet"
              description="Create your first doctor profile to get started"
              hasFilters={hasFilters}
              onClear={clearFilters}
              onAdd={() => handleOpen()}
              addLabel="Add Doctor"
            />
          )
        ) : (
          <Grid container spacing={3}>
            {tabIndex === 0
              ? filteredTips.map((tip) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={tip.id}>
                    <TipCard tip={tip} onEdit={(t) => handleOpen(t)} onDelete={(t) => { setDeleteType('tips'); setDeleteId(t.id); }} onView={(t) => setDetailTip(t)} />
                  </Grid>
                ))
              : filteredDoctors.map((doc) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
                    <DoctorCard doc={doc} onEdit={(d) => handleOpen(d)} onDelete={(d) => { setDeleteType('profiles'); setDeleteId(d.id); }} onView={(d) => setDetailDoctor(d)} />
                  </Grid>
                ))}
          </Grid>
        )}

        {/* Detail dialogs */}
        <TipDetailDialog tip={detailTip} onClose={() => setDetailTip(null)} onEdit={(t) => handleOpen(t)} />
        <DoctorDetailDialog doc={detailDoctor} onClose={() => setDetailDoctor(null)} onEdit={(d) => handleOpen(d)} />

        {/* Form Modal */}
        <FormModal
          open={dialogOpen}
          title={editItem ? `Edit ${tabIndex === 0 ? 'Health Tip' : 'Doctor'}` : `Add ${tabIndex === 0 ? 'Health Tip' : 'Doctor'}`}
          subtitle={tabIndex === 0 ? 'Shown in the My Doctor health tips list' : 'Shown in the My Doctor specialists list'}
          onClose={handleClose}
          onSubmit={handleSave}
          loading={createMutation.isPending || updateMutation.isPending}
          error={formError || null}
        >
          {tabIndex === 0 ? (
            <>
              <FormTextField required label="Title" value={formTip.title} onChange={(e) => setFormTip({ ...formTip, title: e.target.value })} autoFocus />
              <FormTextField label="Content" value={formTip.content} onChange={(e) => setFormTip({ ...formTip, content: e.target.value })} multiline rows={3} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormTextField label="Emoji" value={formTip.emoji} onChange={(e) => setFormTip({ ...formTip, emoji: e.target.value })} sx={{ mb: 0 }} />
                <FormTextField label="Order" type="number" value={formTip.order} onChange={(e) => setFormTip({ ...formTip, order: parseInt(e.target.value) || 0 })} sx={{ mb: 0 }} />
              </Box>
              <FormTextField label="Category" value={formTip.category} onChange={(e) => setFormTip({ ...formTip, category: e.target.value })} helperText="e.g. general, health, nutrition" />
            </>
          ) : (
            <>
              <FormTextField required label="Name" value={formDoctor.name} onChange={(e) => setFormDoctor({ ...formDoctor, name: e.target.value })} autoFocus />
              <FormTextField label="Specialty" value={formDoctor.specialty} onChange={(e) => setFormDoctor({ ...formDoctor, specialty: e.target.value })} helperText="e.g. Cardiology, Pediatrics" />
              <FormTextField label="Bio" value={formDoctor.bio} onChange={(e) => setFormDoctor({ ...formDoctor, bio: e.target.value })} multiline rows={3} />
              <FormTextField label="Photo URL" value={formDoctor.photoUrl} onChange={(e) => setFormDoctor({ ...formDoctor, photoUrl: e.target.value })} helperText="Paste an image URL for the doctor's photo" />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormTextField label="Order" type="number" value={formDoctor.order} onChange={(e) => setFormDoctor({ ...formDoctor, order: parseInt(e.target.value) || 0 })} sx={{ mb: 0 }} />
                <FormControlLabel control={<Switch checked={formDoctor.available} onChange={(e) => setFormDoctor({ ...formDoctor, available: e.target.checked })} />} label="Available" />
              </Box>
            </>
          )}
        </FormModal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteId}
          title={`Delete ${deleteType === 'tips' ? 'Health Tip' : 'Doctor'}`}
          message="Are you sure you want to delete this item? This action cannot be undone."
          confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
          loading={deleteMutation.isPending}
          destructive
        />
      </Box>
    </FadeIn>
  );
}
