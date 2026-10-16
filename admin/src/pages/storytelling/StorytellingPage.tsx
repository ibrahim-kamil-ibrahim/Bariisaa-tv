import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, Typography, MenuItem, Switch, FormControlLabel,
  Card, CardContent, Grid, Skeleton, Paper, InputAdornment, Checkbox, FormControlLabel as MuiFormControlLabel, Avatar, LinearProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  CheckSquare, Square, Trash2, Search, X, ChevronLeft, ChevronRight,
  Eye, Maximize2, Calendar, Clock, Headphones, Video as VideoIcon, Star,
  BookMarked, Loader2, Clapperboard,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FadeIn from '../../components/FadeIn';
import AccessTierFields, { AccessTierValue, validateAccessTier } from '../../components/AccessTierFields';
import VideoUpload from '../../components/VideoUpload/VideoUpload';
import api from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';

interface Story {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  audioUrl?: string;
  videoId?: string | null;
  category: string;
  status: string;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt?: string;
  accessTier?: 'FREE' | 'PAID';
  requiredPlanId?: string | null;
  authorId?: string | null;
  author?: { id: string; name: string; photoUrl?: string | null } | null;
}

const getCoverUrl = (url?: string | null) =>
  !url ? '' : url.startsWith('http') ? url : `${api.defaults.baseURL}/files/${url}`;

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

function StoryCard({ story, onEdit, onDelete, onView, onViewCover, selectMode, selected, onToggleSelect }: {
  story: Story;
  onEdit: (s: Story) => void;
  onDelete: (s: Story) => void;
  onView: (s: Story) => void;
  onViewCover: (s: Story) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (s: Story) => void;
}) {
  const coverUrl = getCoverUrl(story.coverUrl);
  const st = statusColor(story.status);
  return (
    <Card
      elevation={0}
      onClick={selectMode && onToggleSelect ? () => onToggleSelect(story) : undefined}
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
        onClick={coverUrl ? (e) => { e.stopPropagation(); if (!selectMode) onViewCover(story); } : undefined}
        sx={{
          height: 160, position: 'relative', overflow: 'hidden', flexShrink: 0,
          background: 'linear-gradient(135deg, #402083 0%, #6B4EAB 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: coverUrl && !selectMode ? 'zoom-in' : 'default',
        }}
      >
        {coverUrl ? (
          <>
            <Box
              component="img"
              src={coverUrl}
              alt={story.title}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 400ms ease', '.MuiCard-root:hover &': { transform: 'scale(1.05)' } }}
            />
            <Box
              onClick={(e) => { e.stopPropagation(); if (!selectMode) onViewCover(story); }}
              sx={{
                position: 'absolute', top: 8, right: 8, zIndex: 1,
                backgroundColor: 'rgba(30,27,46,0.55)', borderRadius: 1.5, width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 200ms ease',
                '.MuiCard-root:hover &': { opacity: 1 },
                cursor: 'zoom-in',
              }}
            >
              <Maximize2 size={15} color="#fff" />
            </Box>
          </>
        ) : (
          <BookMarked size={44} color="rgba(255,255,255,0.85)" />
        )}

        {/* Status badge */}
        <Chip
          label={story.status}
          size="small"
          sx={{
            position: 'absolute', top: 10, left: 10, zIndex: 1,
            backgroundColor: st.bg, color: st.fg, fontWeight: 700, fontSize: 10.5, height: 22,
          }}
        />
        {/* Paid badge */}
        {story.accessTier === 'PAID' && (
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
            onClick={(e) => { e.stopPropagation(); onToggleSelect?.(story); }}
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
              <IconButton size="small" onClick={() => onView(story)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#fff' }, width: 34, height: 34 }}>
                <Eye size={16} color="#402083" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(story)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#fff' }, width: 34, height: 34 }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => onDelete(story)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#FDE8E8' }, width: 34, height: 34 }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Content */}
      <CardContent sx={{ px: 2.5, pt: 2, pb: 1, flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.35, fontSize: 15 }}>
          {story.title}
        </Typography>
        {story.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.75, fontSize: 12.5, lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              minHeight: 38,
            }}
          >
            {story.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
          <Chip label={story.category} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
          {story.author && (
            <Chip label={story.author.name} size="small" variant="outlined" sx={{ fontSize: 11, height: 22, color: '#402083', borderColor: 'rgba(64,32,131,0.3)' }} />
          )}
          {story.isFeatured && (
            <Chip icon={<Star size={12} />} label="Featured" size="small" sx={{ fontSize: 11, height: 22, backgroundColor: '#FFF7E0', color: '#B45309' }} />
          )}
        </Box>
      </CardContent>

      {/* Footer */}
      <Box sx={{ px: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Chip
          icon={<Eye size={13} />}
          label={`${story.viewCount || 0} views`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 11, height: 24, borderColor: 'rgba(64,32,131,0.2)', color: '#402083' }}
        />
        {story.audioUrl && (
          <Tooltip title="Has audio">
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#E65100' }}><Headphones size={15} /></Box>
          </Tooltip>
        )}
        {story.videoId && (
          <Tooltip title="Has video">
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#0284C7' }}><Clapperboard size={15} /></Box>
          </Tooltip>
        )}
        {!selectMode && (
          <Button
            size="small"
            onClick={(e) => { e.stopPropagation(); onView(story); }}
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

function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  return (
    <Box sx={{ textAlign: 'center', py: 10, gridColumn: '1 / -1' }}>
      <BookMarked size={56} color="#6E6A85" style={{ opacity: 0.4 }} />
      <Typography variant="h6" fontWeight={700} sx={{ mt: 2, mb: 0.5 }}>
        {hasFilters ? 'No stories found' : 'No stories yet'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {hasFilters ? 'Try adjusting your search or filters' : 'Create your first story to get started'}
      </Typography>
      {hasFilters && (
        <Button variant="outlined" onClick={onClear} sx={{ borderRadius: 2 }}>
          Clear filters
        </Button>
      )}
    </Box>
  );
}

function StoryDetailDialog({ story, onClose, onEdit }: { story: Story | null; onClose: () => void; onEdit: (s: Story) => void }) {
  const coverUrl = story ? getCoverUrl(story.coverUrl) : '';
  const st = story ? statusColor(story.status) : statusColor('DRAFT');
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Resolve the playback URL when a story with a video opens.
  useEffect(() => {
    let cancelled = false;
    setVideoSrc(null);
    setVideoError(null);
    if (!story?.videoId) return;
    api
      .get(`/media/videos/${story.videoId}/play`)
      .then(({ data }) => {
        if (!cancelled) setVideoSrc(data.data?.url || null);
      })
      .catch((e) => {
        if (!cancelled) setVideoError(e?.response?.data?.message || 'Could not load video preview');
      });
    return () => {
      cancelled = true;
    };
  }, [story?.id, story?.videoId]);

  return (
    <Dialog open={!!story} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      {story && (
        <>
          {/* Cover banner */}
          <Box sx={{ position: 'relative', height: 220, overflow: 'hidden', background: 'linear-gradient(135deg, #402083 0%, #6B4EAB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {coverUrl ? (
              <Box component="img" src={coverUrl} alt={story.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <BookMarked size={64} color="rgba(255,255,255,0.85)" />
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
            <Chip label={story.status} size="small" sx={{ position: 'absolute', top: 14, left: 14, backgroundColor: st.bg, color: st.fg, fontWeight: 700, fontSize: 11 }} />
          </Box>

          <DialogContent sx={{ pt: 3 }}>
            {/* Title and edit */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                  {story.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {story.author ? `by ${story.author.name}` : 'Storytelling'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => { onEdit(story); onClose(); }}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flexShrink: 0, ml: 2 }}
              >
                Edit
              </Button>
            </Box>

            {/* Stats row */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 100, p: 1.75, borderRadius: 2, backgroundColor: '#EEE8FA', textAlign: 'center' }}>
                <Eye size={20} color="#402083" />
                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{story.viewCount || 0}</Typography>
                <Typography variant="caption" color="text.secondary">Views</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 100, p: 1.75, borderRadius: 2, backgroundColor: story.accessTier === 'PAID' ? '#EEE8FA' : '#F5F4FA', textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5, fontSize: 22, color: story.accessTier === 'PAID' ? '#402083' : '#15803D' }}>
                  {story.accessTier === 'PAID' ? 'Paid' : 'Free'}
                </Typography>
                <Typography variant="caption" color="text.secondary">Access</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 100, p: 1.75, borderRadius: 2, backgroundColor: '#F5F4FA', textAlign: 'center' }}>
                <BookMarked size={20} color="#6E6A85" />
                <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, fontSize: 14 }}>{story.category}</Typography>
                <Typography variant="caption" color="text.secondary">Category</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 100, p: 1.75, borderRadius: 2, backgroundColor: '#F5F4FA', textAlign: 'center' }}>
                <Calendar size={20} color="#6E6A85" />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>Created</Typography>
                <Typography variant="caption" color="text.secondary">{formatDate(story.createdAt)}</Typography>
              </Box>
            </Box>

            {/* Description */}
            {story.description && (
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Description</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {story.description}
                </Typography>
              </Box>
            )}

            {/* Media section */}
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Media</Typography>
              {story.audioUrl && (
                <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#FFF9F0', borderRadius: 2, border: '1px solid rgba(230,81,0,0.15)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <Headphones size={15} color="#E65100" />
                    <Typography variant="caption" fontWeight={700} color="#E65100">Narration audio</Typography>
                  </Box>
                  <audio controls src={story.audioUrl} style={{ width: '100%', height: 36 }} />
                </Box>
              )}
              {story.videoId ? (
                <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#F0F9FF', borderRadius: 2, border: '1px solid rgba(2,132,199,0.15)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <Clapperboard size={15} color="#0284C7" />
                    <Typography variant="caption" fontWeight={700} color="#0284C7">Video linked</Typography>
                  </Box>
                  {videoSrc ? (
                    <Box
                      component="video"
                      src={videoSrc}
                      controls
                      playsInline
                      sx={{ width: '100%', maxHeight: 260, borderRadius: 1.5, bgcolor: '#000', display: 'block' }}
                    />
                  ) : videoError ? (
                    <Typography variant="caption" color="text.secondary">{videoError}</Typography>
                  ) : (
                    <LinearProgress variant="indeterminate" sx={{ borderRadius: 1, height: 4 }} />
                  )}
                </Box>
              ) : null}
              {!story.audioUrl && !story.videoId && (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No audio or video attached.
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Created {formatDate(story.createdAt)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Updated {formatDateTime(story.updatedAt)}
              </Typography>
            </Box>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}

function FullscreenCoverDialog({ story, onClose }: { story: Story | null; onClose: () => void }) {
  const coverUrl = story ? getCoverUrl(story.coverUrl) : '';
  if (!story || !coverUrl) return null;
  return (
    <Dialog
      open={!!story}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, backgroundColor: 'transparent', boxShadow: 'none', overflow: 'visible' } }}
      BackdropProps={{ sx: { backgroundColor: 'rgba(15,10,30,0.88)' } }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute', top: 8, right: 8, zIndex: 2,
          backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', width: 40, height: 40,
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
        }}
      >
        <X size={22} />
      </IconButton>
      <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
        <Box
          component="img"
          src={coverUrl}
          alt={story.title}
          sx={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block', backgroundColor: '#0f0a1e' }}
        />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(15,10,30,0.85))', p: 2.5 }}>
          <Typography variant="h6" fontWeight={700} color="#fff">{story.title}</Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 0.5 }}>
            {[story.author?.name, story.category, story.accessTier === 'PAID' ? 'Paid' : 'Free'].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}

export default function StorytellingPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [page, setPage] = useState(0);
  const [limit] = useState(12);
  const [search, setSearch] = useState('');
  const [accessTierFilter, setAccessTierFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Story | null>(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'DRAFT', isFeatured: false, coverUrl: '', audioUrl: '', videoId: '', authorId: '' });
  const [accessTier, setAccessTier] = useState<AccessTierValue>({ accessTier: 'FREE', requiredPlanId: '' });
  const [formError, setFormError] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [detailStory, setDetailStory] = useState<Story | null>(null);
  const [fullscreenStory, setFullscreenStory] = useState<Story | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['stories', page, limit, search, accessTierFilter],
    queryFn: () => api.get('/storytelling', { params: { page: page + 1, limit, search: search || undefined, accessTier: accessTierFilter === 'ALL' ? undefined : accessTierFilter } }).then((r) => r.data),
  });

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.get('/subscriptions/plans').then((r) => r.data.data),
  });
  const planCount = Array.isArray(plansData) ? plansData.length : 0;

  const { data: authorsData } = useQuery({
    queryKey: ['authors-for-story'],
    queryFn: () => api.get('/authors', { params: { limit: 200 } }).then((r) => r.data),
  });
  const authorsList: { id: string; name: string }[] = authorsData?.data || authorsData || [];

  const stories: Story[] = data?.data || [];
  const total = data?.meta?.total ?? stories.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilters = !!search || accessTierFilter !== 'ALL';
  const allSelected = stories.length > 0 && selectedIds.length === stories.length;
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : stories.map((s) => s.id));

  const toggleSelect = (story: Story) => {
    setSelectedIds((prev) => prev.includes(story.id) ? prev.filter((id) => id !== story.id) : [...prev, story.id]);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds([]);
  };

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/storytelling', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stories'] }); addNotification('Story created', 'success'); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/storytelling/${body.id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stories'] }); addNotification('Story updated', 'success'); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/storytelling/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stories'] }); setDeleteId(null); addNotification('Story deleted', 'success'); },
    onError: (err: any) => { addNotification(err.response?.data?.message || 'Failed to delete story', 'error'); setDeleteId(null); },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api.delete(`/storytelling/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      setSelectedIds([]);
      setSelectMode(false);
      setBulkDeleteDialog(false);
      addNotification(`${selectedIds.length} stories deleted`, 'success');
    },
    onError: (err: any) => { addNotification(err?.response?.data?.message || 'Failed'); setBulkDeleteDialog(false); },
  });

  const handleOpen = (item?: Story) => {
    if (item) {
      setEditItem(item);
      setForm({ title: item.title, description: item.description || '', status: item.status, isFeatured: item.isFeatured, coverUrl: item.coverUrl || '', audioUrl: item.audioUrl || '', videoId: item.videoId || '', authorId: item.authorId || '' });
      setAccessTier({ accessTier: item.accessTier === 'PAID' ? 'PAID' : 'FREE', requiredPlanId: item.requiredPlanId || '' });
    } else {
      setEditItem(null);
      setForm({ title: '', description: '', status: 'DRAFT', isFeatured: false, coverUrl: '', audioUrl: '', videoId: '', authorId: '' });
      setAccessTier({ accessTier: 'FREE', requiredPlanId: '' });
    }
    setFormError('');
    setVideoUploading(false);
    setDialogOpen(true);
  };

  const handleClose = () => { setDialogOpen(false); setEditItem(null); setFormError(''); setVideoUploading(false); };

  const handleSave = () => {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (videoUploading) {
      setFormError('The video is still uploading — wait for "Upload completed ✓", then click Save again.');
      return;
    }
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

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append('cover', file);
      const { data } = await api.post('/storytelling/upload-cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, coverUrl: data.data.coverUrl }));
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Cover upload failed');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioUploading(true);
    try {
      const fd = new FormData();
      fd.append('audio', file);
      const { data } = await api.post('/storytelling/upload-audio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, audioUrl: data.data.audioUrl }));
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Audio upload failed');
    } finally {
      setAudioUploading(false);
      e.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <FadeIn>
        <Box>
          <PageHeader title="Storytelling" subtitle="Manage stories for the Storytelling tab" actionLabel="Add Story" onAction={() => handleOpen()} />
          <Grid container spacing={3}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
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
          title="Storytelling"
          subtitle={`${total.toLocaleString()} stories`}
          actionLabel="Add Story"
          onAction={() => handleOpen()}
        />

        {/* Toolbar */}
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 3, borderRadius: 3, border: '1px solid rgba(30,27,46,0.06)', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search stories..."
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
            <MuiFormControlLabel
              control={<Checkbox checked={allSelected} onChange={toggleSelectAll} size="small" />}
              label={<Typography variant="body2" fontWeight={600}>Select all</Typography>}
            />
            <Typography variant="body2" color="text.secondary">
              {selectedIds.length} of {stories.length} selected
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
            {(error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load stories'}
          </Alert>
        )}

        {/* Story grid */}
        {stories.length === 0 ? (
          <EmptyState onClear={() => { setSearch(''); setAccessTierFilter('ALL'); }} hasFilters={hasFilters} />
        ) : (
          <Grid container spacing={3}>
            {stories.map((story) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={story.id}>
                <StoryCard
                  story={story}
                  onEdit={(s) => handleOpen(s)}
                  onDelete={(s) => setDeleteId(s.id)}
                  onView={(s) => setDetailStory(s)}
                  onViewCover={(s) => setFullscreenStory(s)}
                  selectMode={selectMode}
                  selected={selectedIds.includes(story.id)}
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
              sx={{ borderRadius: 2 }}
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
              disabled={stories.length < limit}
              sx={{ borderRadius: 2 }}
            >
              Next
            </Button>
          </Box>
        )}

        {/* Detail dialog */}
        <StoryDetailDialog
          story={detailStory}
          onClose={() => setDetailStory(null)}
          onEdit={(s) => handleOpen(s)}
        />

        {/* Fullscreen cover dialog */}
        <FullscreenCoverDialog
          story={fullscreenStory}
          onClose={() => setFullscreenStory(null)}
        />

        {/* Story Form Modal */}
        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>{editItem ? 'Edit Story' : 'Add Story'}</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}
            <TextField fullWidth label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} sx={{ mb: 2, mt: 1 }} />
            <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={3} sx={{ mb: 2 }} />
            <TextField fullWidth select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} sx={{ mb: 2 }}>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="PUBLISHED">Published</MenuItem>
            </TextField>
            <TextField fullWidth select label="Author" value={form.authorId} onChange={(e) => setForm({ ...form, authorId: e.target.value })} sx={{ mb: 2 }}
              SelectProps={{ renderValue: (v) => (v ? authorsList.find((a) => a.id === v)?.name || 'Unknown' : 'None') }}>
              <MenuItem value="">None</MenuItem>
              {authorsList.map((a) => (
                <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
              <TextField fullWidth label="Cover URL" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} helperText="Paste a URL or upload a file from your folder" sx={{ mb: 0 }} />
              <Button variant="outlined" component="label" disabled={coverUploading} sx={{ minWidth: 130, flexShrink: 0 }}>
                {coverUploading ? 'Uploading…' : 'Upload cover'}
                <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleCoverFile} />
              </Button>
            </Box>
            {form.coverUrl && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <img src={form.coverUrl} alt="Cover preview" style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                <Button size="small" color="error" onClick={() => setForm({ ...form, coverUrl: '' })} sx={{ display: 'block', mx: 'auto', mt: 0.5 }}>Remove</Button>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
              <TextField fullWidth label="Audio URL" value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} helperText="Paste a URL or upload a file from your folder" sx={{ mb: 0 }} />
              <Button variant="outlined" component="label" disabled={audioUploading} sx={{ minWidth: 130, flexShrink: 0 }}>
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
                <Button size="small" color="error" onClick={() => setForm({ ...form, audioUrl: '' })}>Remove</Button>
              </Box>
            )}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Story video</Typography>
            {form.videoId ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip size="small" color="success" label="Video linked" />
                <Button size="small" color="error" onClick={() => setForm({ ...form, videoId: '' })}>Remove</Button>
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                No video yet. An uploaded video plays on the story detail screen.
              </Typography>
            )}
            <VideoUpload
              hideScopeField
              scope={editItem ? { type: 'story', id: editItem.id } : undefined}
              visibility={accessTier.accessTier === 'PAID' ? 'PREMIUM' : 'PUBLIC'}
              onUploadingChange={setVideoUploading}
              onUploaded={({ mediaId }) => setForm((prev) => ({ ...prev, videoId: mediaId }))}
            />
            <AccessTierFields
              value={accessTier}
              onChange={setAccessTier}
              error={validateAccessTier(accessTier, planCount) || undefined}
            />
            <FormControlLabel control={<Switch checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />} label="Featured" />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" disabled={createMutation.isPending || updateMutation.isPending} sx={{ borderRadius: 2, textTransform: 'none' }}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deleteId}
          title="Delete Story"
          message="Are you sure you want to delete this story? This action cannot be undone."
          confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
          loading={deleteMutation.isPending}
          destructive
        />

        {/* Bulk delete dialog */}
        <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete {selectedIds.length} Stories?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">This action cannot be undone.</Typography>
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
