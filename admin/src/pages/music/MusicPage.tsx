import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Chip, IconButton, Tooltip, Button, Typography, MenuItem, Switch, FormControlLabel,
  Card, CardContent, Grid, Skeleton, Paper, InputAdornment, Checkbox, Alert, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  CheckSquare, Square, Trash2, Search, X, ChevronLeft, ChevronRight,
  Eye, Star, Music, Headphones, FileText, Calendar, Play,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FadeIn from '../../components/FadeIn';
import FormModal from '../../components/FormModal';
import FormTextField from '../../components/FormTextField';
import AccessTierFields, { AccessTierValue, validateAccessTier } from '../../components/AccessTierFields';
import api from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';

interface Track {
  id: string;
  title: string;
  artist?: string;
  artistId?: string;
  artistAuthor?: { id: string; name: string };
  album?: string;
  coverUrl?: string;
  audioUrl: string;
  pdfUrl?: string;
  genre?: string;
  price: number;
  durationSeconds?: number;
  status: string;
  isFeatured: boolean;
  playCount: number;
  accessTier?: 'FREE' | 'PAID';
  requiredPlanId?: string | null;
  isLocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const statusColor = (s: string) =>
  s === 'PUBLISHED' ? { bg: '#DCFCE7', fg: '#15803D' } :
  s === 'DRAFT' ? { bg: '#FEF3C7', fg: '#B45309' } :
  { bg: '#E5E7EB', fg: '#6B7280' };

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function formatDateTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function TrackCard({ track, onEdit, onDelete, onView, selectMode, selected, onToggleSelect }: {
  track: Track;
  onEdit: (t: Track) => void;
  onDelete: (t: Track) => void;
  onView: (t: Track) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (t: Track) => void;
}) {
  const coverUrl = track.coverUrl || '';
  const st = statusColor(track.status);
  return (
    <Card
      elevation={0}
      onClick={selectMode && onToggleSelect ? () => onToggleSelect(track) : undefined}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        cursor: selectMode ? 'pointer' : 'default',
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        border: selected ? '2px solid #402083' : '1px solid rgba(30,27,46,0.06)',
        boxShadow: selected ? '0 8px 24px rgba(64,32,131,0.15)' : 'none',
        '&:hover': selectMode
          ? { boxShadow: selected ? '0 8px 24px rgba(64,32,131,0.15)' : '0 4px 12px rgba(30,27,46,0.08)' }
          : { transform: 'translateY(-6px)', boxShadow: '0 16px 40px rgba(30,27,46,0.12)', borderColor: 'rgba(64,32,131,0.15)' },
      }}
    >
      {/* Cover area */}
      <Box
        sx={{
          height: 150, position: 'relative', overflow: 'hidden', flexShrink: 0,
          background: 'linear-gradient(135deg, #402083 0%, #6B4EAB 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {coverUrl ? (
          <Box
            component="img"
            src={coverUrl}
            alt={track.title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 400ms ease', '.MuiCard-root:hover &': { transform: 'scale(1.05)' } }}
          />
        ) : (
          <Music size={44} color="rgba(255,255,255,0.85)" />
        )}

        {/* Status badge */}
        <Chip
          label={track.status}
          size="small"
          sx={{
            position: 'absolute', top: 10, left: 10, zIndex: 1,
            backgroundColor: st.bg, color: st.fg, fontWeight: 700, fontSize: 10.5, height: 22,
          }}
        />
        {/* Paid badge */}
        {track.accessTier === 'PAID' && (
          <Chip
            label="PAID"
            size="small"
            sx={{
              position: 'absolute', top: 10, right: 10, zIndex: 1,
              backgroundColor: '#402083', color: '#FFD75A', fontWeight: 700, fontSize: 10.5, height: 22,
            }}
          />
        )}

        {/* Selection checkbox */}
        {selectMode && (
          <Box
            onClick={(e) => { e.stopPropagation(); onToggleSelect?.(track); }}
            sx={{
              position: 'absolute', bottom: 10, left: 10, zIndex: 2,
              backgroundColor: selected ? '#402083' : 'rgba(255,255,255,0.95)',
              borderRadius: 1.5, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'pointer', transition: 'all 150ms ease',
            }}
          >
            {selected ? <CheckSquare size={20} color="#fff" /> : <Square size={20} color="#6E6A85" />}
          </Box>
        )}

        {/* Hover actions */}
        {!selectMode && (
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', gap: 1, p: 1.5,
              background: 'linear-gradient(transparent, rgba(30,27,46,0.7))',
              opacity: 0, transform: 'translateY(8px)',
              transition: 'all 250ms ease',
              '.MuiCard-root:hover &': { opacity: 1, transform: 'translateY(0)' },
            }}
          >
            <Tooltip title="View Details">
              <IconButton size="small" onClick={() => onView(track)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#fff' }, width: 34, height: 34 }}>
                <Eye size={16} color="#402083" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(track)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#fff' }, width: 34, height: 34 }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => onDelete(track)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#FDE8E8' }, width: 34, height: 34 }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Content */}
      <CardContent sx={{ px: 2.5, pt: 2, pb: 1, flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.35, fontSize: 15 }}>
          {track.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {track.artist ? `by ${track.artist}` : 'Unknown artist'}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
          {track.genre && (
            <Chip label={track.genre} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
          )}
          <Chip
            label={track.accessTier === 'PAID' ? 'Paid' : 'Free'}
            size="small"
            variant="outlined"
            sx={{
              fontSize: 11, height: 22,
              color: track.accessTier === 'PAID' ? '#402083' : '#15803D',
              borderColor: track.accessTier === 'PAID' ? 'rgba(64,32,131,0.3)' : 'rgba(21,128,61,0.3)',
            }}
          />
          {track.price > 0 && (
            <Chip label={`$${track.price.toFixed(2)}`} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
          )}
          {track.isFeatured && (
            <Chip icon={<Star size={12} />} label="Featured" size="small" sx={{ fontSize: 11, height: 22, backgroundColor: '#FFF7E0', color: '#B45309' }} />
          )}
        </Box>
      </CardContent>

      {/* Footer */}
      <Box sx={{ px: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Chip
          icon={<Play size={13} />}
          label={`${track.playCount || 0} plays`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 11, height: 24, borderColor: 'rgba(64,32,131,0.2)', color: '#402083' }}
        />
        {track.audioUrl && (
          <Tooltip title="Has audio">
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#E65100' }}><Headphones size={15} /></Box>
          </Tooltip>
        )}
        {track.pdfUrl && (
          <Tooltip title="Has PDF">
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#0284C7' }}><FileText size={15} /></Box>
          </Tooltip>
        )}
        {!selectMode && (
          <Button
            size="small"
            onClick={(e) => { e.stopPropagation(); onView(track); }}
            sx={{ ml: 'auto', fontSize: 12, fontWeight: 600, color: '#402083', textTransform: 'none', '&:hover': { backgroundColor: '#EEE8FA' } }}
            endIcon={<Eye size={14} />}
          >
            Details
          </Button>
        )}
      </Box>
    </Card>
  );
}

function TrackDetailDialog({ track, onClose, onEdit }: { track: Track | null; onClose: () => void; onEdit: (t: Track) => void }) {
  const coverUrl = track?.coverUrl || '';
  const st = track ? statusColor(track.status) : statusColor('DRAFT');
  if (!track) return null;
  return (
    <Dialog open={!!track} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      {/* Cover banner */}
      <Box sx={{ position: 'relative', height: 220, overflow: 'hidden', background: 'linear-gradient(135deg, #402083 0%, #6B4EAB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {coverUrl ? (
          <Box component="img" src={coverUrl} alt={track.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Music size={64} color="rgba(255,255,255,0.85)" />
        )}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute', top: 12, right: 12, zIndex: 2,
            backgroundColor: 'rgba(30,27,46,0.55)', color: '#fff', width: 36, height: 36,
            '&:hover': { backgroundColor: 'rgba(30,27,46,0.75)' },
          }}
        >
          <X size={20} />
        </IconButton>
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, rgba(30,27,46,0.5))' }} />
        <Chip label={track.status} size="small" sx={{ position: 'absolute', top: 14, left: 14, backgroundColor: st.bg, color: st.fg, fontWeight: 700, fontSize: 11 }} />
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        {/* Title and edit */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              {track.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {track.artist ? `by ${track.artist}` : 'Unknown artist'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => { onEdit(track); onClose(); }}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flexShrink: 0, ml: 2 }}
          >
            Edit
          </Button>
        </Box>

        {/* Stats row */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 100, p: 1.75, borderRadius: 2, backgroundColor: '#EEE8FA', textAlign: 'center' }}>
            <Play size={20} color="#402083" />
            <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{track.playCount || 0}</Typography>
            <Typography variant="caption" color="text.secondary">Plays</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 100, p: 1.75, borderRadius: 2, backgroundColor: track.accessTier === 'PAID' ? '#EEE8FA' : '#F5F4FA', textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5, fontSize: 22, color: track.accessTier === 'PAID' ? '#402083' : '#15803D' }}>
              {track.accessTier === 'PAID' ? 'Paid' : 'Free'}
            </Typography>
            <Typography variant="caption" color="text.secondary">Access</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 100, p: 1.75, borderRadius: 2, backgroundColor: '#F5F4FA', textAlign: 'center' }}>
            <Music size={20} color="#6E6A85" />
            <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, fontSize: 14 }}>{track.genre || '—'}</Typography>
            <Typography variant="caption" color="text.secondary">Genre</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 100, p: 1.75, borderRadius: 2, backgroundColor: '#F5F4FA', textAlign: 'center' }}>
            <Calendar size={20} color="#6E6A85" />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>Created</Typography>
            <Typography variant="caption" color="text.secondary">{formatDate(track.createdAt)}</Typography>
          </Box>
        </Box>

        {/* Media */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Media</Typography>
          {track.audioUrl ? (
            <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#FFF9F0', borderRadius: 2, border: '1px solid rgba(230,81,0,0.15)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <Headphones size={15} color="#E65100" />
                <Typography variant="caption" fontWeight={700} color="#E65100">Audio track</Typography>
              </Box>
              <audio controls src={track.audioUrl} style={{ width: '100%', height: 36 }} />
            </Box>
          ) : track.isLocked ? (
            <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ mb: 1.5 }}>
              Audio is hidden for this PAID track until entitlement.
            </Typography>
          ) : null}
          {track.pdfUrl && (
            <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#F0F9FF', borderRadius: 2, border: '1px solid rgba(2,132,199,0.15)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <FileText size={15} color="#0284C7" />
                <Typography variant="caption" fontWeight={700} color="#0284C7">Attached PDF</Typography>
              </Box>
              <Button size="small" href={track.pdfUrl} target="_blank" rel="noopener" sx={{ borderRadius: 2, textTransform: 'none' }}>
                Open PDF
              </Button>
            </Box>
          )}
          {!track.audioUrl && !track.pdfUrl && (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No audio or PDF attached.
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Created {formatDate(track.createdAt)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Updated {formatDateTime(track.updatedAt)}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Music size={56} color="#6E6A85" style={{ opacity: 0.4 }} />
      <Typography variant="h6" fontWeight={700} sx={{ mt: 2, mb: 0.5 }}>
        {hasFilters ? 'No tracks found' : 'No tracks yet'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {hasFilters ? 'Try adjusting your search or filters' : 'Create your first track to get started'}
      </Typography>
      {hasFilters && (
        <Button variant="outlined" onClick={onClear} sx={{ borderRadius: 2 }}>
          Clear filters
        </Button>
      )}
    </Box>
  );
}

export default function MusicPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [page, setPage] = useState(0);
  const [limit] = useState(12);
  const [search, setSearch] = useState('');
  const [accessTierFilter, setAccessTierFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Track | null>(null);
  const [form, setForm] = useState({ title: '', artist: '', artistId: '', genre: '', status: 'DRAFT', isFeatured: false, audioUrl: '', coverUrl: '', pdfUrl: '', price: 0 });
  const [accessTier, setAccessTier] = useState<AccessTierValue>({ accessTier: 'FREE', requiredPlanId: '' });
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [detailTrack, setDetailTrack] = useState<Track | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['tracks', page, limit, search, accessTierFilter],
    queryFn: () => api.get('/music', { params: { page: page + 1, limit, search: search || undefined, accessTier: accessTierFilter === 'ALL' ? undefined : accessTierFilter } }).then((r) => r.data),
  });

  const { data: authorsData } = useQuery({
    queryKey: ['authors'],
    queryFn: () => api.get('/authors', { params: { page: 1, limit: 100 } }).then((r) => r.data),
  });

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.get('/subscriptions/plans').then((r) => r.data.data),
  });
  const planCount = Array.isArray(plansData) ? plansData.length : 0;

  const tracks: Track[] = data?.data || [];
  const total = data?.meta?.total ?? tracks.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilters = !!search || accessTierFilter !== 'ALL';
  const allSelected = tracks.length > 0 && selectedIds.length === tracks.length;
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : tracks.map((t) => t.id));

  const authors: { id: string; name: string }[] = authorsData?.data || [];

  const toggleSelect = (track: Track) => {
    setSelectedIds((prev) => prev.includes(track.id) ? prev.filter((id) => id !== track.id) : [...prev, track.id]);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds([]);
  };

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/music', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tracks'] }); addNotification('Track created', 'success'); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/music/${body.id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tracks'] }); addNotification('Track updated', 'success'); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/music/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tracks'] }); setDeleteId(null); addNotification('Track deleted', 'success'); },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api.delete(`/music/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      setSelectedIds([]);
      setSelectMode(false);
      setBulkDeleteDialog(false);
      addNotification(`${selectedIds.length} tracks deleted`, 'success');
    },
    onError: () => { addNotification('Failed to delete tracks', 'error'); setBulkDeleteDialog(false); },
  });

  const handleOpen = (item?: Track) => {
    if (item) {
      setEditItem(item);
      setForm({ title: item.title, artist: item.artist || '', artistId: item.artistId || item.artistAuthor?.id || '', genre: item.genre || '', status: item.status, isFeatured: item.isFeatured, audioUrl: item.audioUrl, coverUrl: item.coverUrl || '', pdfUrl: item.pdfUrl || '', price: item.price ?? 0 });
      setAccessTier({ accessTier: item.accessTier === 'PAID' ? 'PAID' : 'FREE', requiredPlanId: item.requiredPlanId || '' });
    } else {
      setEditItem(null);
      setForm({ title: '', artist: '', artistId: '', genre: '', status: 'DRAFT', isFeatured: false, audioUrl: '', coverUrl: '', pdfUrl: '', price: 0 });
      setAccessTier({ accessTier: 'FREE', requiredPlanId: '' });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => { setDialogOpen(false); setEditItem(null); setFormError(''); };

  const handleSave = () => {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!form.audioUrl.trim()) { setFormError('Audio URL is required'); return; }
    const tierError = validateAccessTier(accessTier, planCount);
    if (tierError) { setFormError(tierError); return; }
    const body = {
      ...form,
      accessTier: accessTier.accessTier,
      requiredPlanId: accessTier.accessTier === 'PAID' && accessTier.requiredPlanId ? accessTier.requiredPlanId : null,
    };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, ...body });
    } else {
      createMutation.mutate(body);
    }
  };

  const handleAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioUploading(true);
    try {
      const fd = new FormData();
      fd.append('audio', file);
      const { data } = await api.post('/music/upload-audio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, audioUrl: data.data.audioUrl }));
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Audio upload failed');
    } finally {
      setAudioUploading(false);
      e.target.value = '';
    }
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append('cover', file);
      const { data } = await api.post('/music/upload-cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, coverUrl: data.data.coverUrl }));
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Cover upload failed');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const handlePdfFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploading(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      const { data } = await api.post('/music/upload-pdf', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, pdfUrl: data.data.pdfUrl }));
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'PDF upload failed');
    } finally {
      setPdfUploading(false);
      e.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <FadeIn>
        <Box>
          <PageHeader title="Music" subtitle="Manage music tracks for the Music tab" actionLabel="Add Track" onAction={() => handleOpen()} />
          <Grid container spacing={3}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <Box>
        <PageHeader
          title="Music"
          subtitle={`${total.toLocaleString()} tracks`}
          actionLabel="Add Track"
          onAction={() => handleOpen()}
        />

        {/* Toolbar */}
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 3, borderRadius: 3, border: '1px solid rgba(30,27,46,0.06)', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small"
            sx={{ flex: 1, minWidth: 180, maxWidth: 320 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#6E6A85" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.5 }}>
                    <X size={16} color="#6E6A85" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: { borderRadius: 2, fontSize: 14, backgroundColor: '#F5F4FA', '&:hover': { backgroundColor: '#F0EEF8' }, '&.Mui-focused': { backgroundColor: '#fff' } },
            }}
          />

          {/* Access tier filter */}
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {(['ALL', 'FREE', 'PAID'] as const).map((tier) => (
              <Chip
                key={tier}
                label={tier === 'ALL' ? 'All' : tier === 'FREE' ? 'Free' : 'Paid'}
                onClick={() => { setAccessTierFilter(tier); setPage(0); }}
                color={accessTierFilter === tier ? 'primary' : 'default'}
                variant={accessTierFilter === tier ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Box>

          {/* Select toggle */}
          <Box sx={{ ml: 'auto' }}>
            <Chip
              label={selectMode ? 'Cancel' : 'Select'}
              onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
              color={selectMode ? 'default' : 'primary'}
              variant={selectMode ? 'outlined' : 'filled'}
              size="small"
              icon={selectMode ? undefined : <Square size={14} />}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Paper>

        {/* Bulk action bar */}
        {selectMode && (
          <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <FormControlLabel
              control={<Checkbox checked={allSelected} onChange={toggleSelectAll} size="small" />}
              label={<Typography variant="body2" fontWeight={600}>Select all</Typography>}
            />
            <Typography variant="body2" color="text.secondary">
              {selectedIds.length} of {tracks.length} selected
            </Typography>
            {selectedIds.length > 0 && (
              <Button
                size="small"
                color="error"
                startIcon={<Trash2 size={16} />}
                onClick={() => setBulkDeleteDialog(true)}
                sx={{ ml: 'auto', borderRadius: 2 }}
              >
                Delete ({selectedIds.length})
              </Button>
            )}
          </Paper>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load tracks'}
          </Alert>
        )}

        {/* Track grid */}
        {tracks.length === 0 ? (
          <EmptyState onClear={() => { setSearch(''); setAccessTierFilter('ALL'); }} hasFilters={hasFilters} />
        ) : (
          <Grid container spacing={3}>
            {tracks.map((track) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={track.id}>
                <TrackCard
                  track={track}
                  onEdit={(t) => handleOpen(t)}
                  onDelete={(t) => setDeleteId(t.id)}
                  onView={(t) => setDetailTrack(t)}
                  selectMode={selectMode}
                  selected={selectedIds.includes(track.id)}
                  onToggleSelect={toggleSelect}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {total > limit && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 4, gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ChevronLeft size={16} />}
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Previous
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Page {page + 1} of {totalPages}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              endIcon={<ChevronRight size={16} />}
              onClick={() => setPage(page + 1)}
              disabled={tracks.length < limit}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Next
            </Button>
          </Box>
        )}

        {/* Detail dialog */}
        <TrackDetailDialog
          track={detailTrack}
          onClose={() => setDetailTrack(null)}
          onEdit={(t) => handleOpen(t)}
        />

        {/* Form Modal */}
        <FormModal
          open={dialogOpen}
          title={editItem ? 'Edit Track' : 'Add Track'}
          subtitle="Manage music tracks for the Music tab"
          onClose={handleClose}
          onSubmit={handleSave}
          loading={createMutation.isPending || updateMutation.isPending}
          error={formError || null}
        >
          <FormTextField required label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
          <FormTextField select label="Artist (from Authors)" value={form.artistId} onChange={(e) => setForm({ ...form, artistId: e.target.value })}>
            <MenuItem value="">— None —</MenuItem>
            {authors.map((a) => (
              <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
            ))}
          </FormTextField>
          <FormTextField label="Genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} helperText="e.g. pop, nasheed, lullaby" />
          <FormTextField label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} helperText="0 = Free" />
          <AccessTierFields
            value={accessTier}
            onChange={setAccessTier}
            error={validateAccessTier(accessTier, planCount) || undefined}
          />
          <FormTextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="PUBLISHED">Published</MenuItem>
          </FormTextField>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
            <FormTextField label="Audio URL" value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} helperText="Paste a URL or upload a file from your device" sx={{ mb: 0 }} />
            <Button variant="outlined" component="label" disabled={audioUploading} sx={{ minWidth: 120, flexShrink: 0 }}>
              {audioUploading ? 'Uploading…' : 'Upload audio'}
              <input type="file" hidden accept="audio/*" onChange={handleAudioFile} />
            </Button>
          </Box>
          {form.audioUrl && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Preview — play before saving
              </Typography>
              <audio controls src={form.audioUrl} style={{ width: '100%' }} />
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
            <FormTextField label="Cover URL" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} sx={{ mb: 0 }} />
            <Button variant="outlined" component="label" disabled={coverUploading} sx={{ minWidth: 120, flexShrink: 0 }}>
              {coverUploading ? 'Uploading…' : 'Upload cover'}
              <input type="file" hidden accept="image/*" onChange={handleCoverFile} />
            </Button>
          </Box>
          {form.coverUrl && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              <img src={form.coverUrl} alt="Cover preview" style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
            <FormTextField label="PDF URL" value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} helperText="Optional — attach a PDF/book for this track" sx={{ mb: 0 }} />
            <Button variant="outlined" component="label" disabled={pdfUploading} sx={{ minWidth: 120, flexShrink: 0 }}>
              {pdfUploading ? 'Uploading…' : 'Upload PDF'}
              <input type="file" hidden accept="application/pdf" onChange={handlePdfFile} />
            </Button>
          </Box>
          {form.pdfUrl && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Box component="iframe" src={form.pdfUrl} sx={{ width: '100%', height: 400, border: 'none', borderRadius: 1 }} />
              <Button size="small" href={form.pdfUrl} target="_blank" rel="noopener" sx={{ mt: 1 }}>
                Open in new tab
              </Button>
            </Box>
          )}
          <FormControlLabel control={<Switch checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />} label="Featured" />
        </FormModal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deleteId}
          title="Delete Track"
          message="Are you sure you want to delete this track? This action can be undone by an admin later."
          confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
          loading={deleteMutation.isPending}
          destructive
        />

        {/* Bulk delete dialog */}
        <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete {selectedIds.length} Tracks?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">This action can be undone by an admin later.</Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setBulkDeleteDialog(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => bulkDeleteMutation.mutate(selectedIds)} disabled={bulkDeleteMutation.isPending} sx={{ borderRadius: 2, textTransform: 'none' }}>
              {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </FadeIn>
  );
}
