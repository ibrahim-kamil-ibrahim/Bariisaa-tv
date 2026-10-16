import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Chip, IconButton, Button, Typography, Tabs, Tab, Switch, FormControlLabel,
  Card, CardContent, Grid, Skeleton, Paper, InputAdornment, Alert, TextField,
  Dialog, DialogContent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Trophy, Medal, Search, X, Eye, Calendar, Star, ListOrdered, EyeOff } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FadeIn from '../../components/FadeIn';
import FormModal from '../../components/FormModal';
import FormTextField from '../../components/FormTextField';
import api from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';

interface Achievement { id: string; title: string; description?: string; emoji: string; iconUrl?: string; points: number; isHidden: boolean; order: number; createdAt?: string; updatedAt?: string; }
interface LeaderboardEntry { id: string; playerName: string; score: number; rank: number; avatarUrl?: string; createdAt?: string; updatedAt?: string; }

const ACHIEVEMENT_GRADIENT = 'linear-gradient(135deg, #402083 0%, #7C5DC7 60%, #B79AE8 100%)';

const rankColors = (rank: number) =>
  rank === 1 ? { bg: '#FEF3C7', fg: '#B45309' } :
  rank === 2 ? { bg: '#E5E7EB', fg: '#4B5563' } :
  rank === 3 ? { bg: '#FFEDD5', fg: '#C2410C' } :
  { bg: '#EEE8FA', fg: '#402083' };

const clampSx = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as const;

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function formatDateTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function initials(name: string) {
  return (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
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

function AchievementCard({ ach, onEdit, onDelete, onView }: { ach: Achievement; onEdit: (a: Achievement) => void; onDelete: (a: Achievement) => void; onView: (a: Achievement) => void }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden',
        border: '1px solid rgba(30,27,46,0.06)', transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 16px 40px rgba(30,27,46,0.12)', borderColor: 'rgba(64,32,131,0.15)' },
      }}
    >
      <Box sx={{ height: 140, position: 'relative', overflow: 'hidden', flexShrink: 0, background: ACHIEVEMENT_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {ach.iconUrl ? (
          <Box component="img" src={ach.iconUrl} alt={ach.title} sx={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }} />
        ) : (
          <Typography sx={{ fontSize: 52, lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>{ach.emoji}</Typography>
        )}
        {ach.isHidden && (
          <Chip icon={<EyeOff size={12} />} label="HIDDEN" size="small" sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1, fontWeight: 700, fontSize: 10.5, height: 22, backgroundColor: '#FEF3C7', color: '#B45309' }} />
        )}
        <Chip
          label={`${ach.points} pts`}
          size="small"
          sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1, backgroundColor: '#FFD75A', color: '#402083', fontWeight: 700, fontSize: 10.5, height: 22 }}
        />
        <Box
          sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1, p: 1.5,
            background: 'linear-gradient(transparent, rgba(30,27,46,0.7))', opacity: 0, transform: 'translateY(8px)',
            transition: 'all 250ms ease', '.MuiCard-root:hover &': { opacity: 1, transform: 'translateY(0)' },
          }}
        >
          <HoverIcon title="View Details" onClick={() => onView(ach)}><Eye size={16} color="#402083" /></HoverIcon>
          <HoverIcon title="Edit" onClick={() => onEdit(ach)}><EditIcon fontSize="small" /></HoverIcon>
          <HoverIcon title="Delete" danger onClick={() => onDelete(ach)}><DeleteIcon fontSize="small" /></HoverIcon>
        </Box>
      </Box>

      <CardContent sx={{ px: 2.5, pt: 2, pb: 1, flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.35, fontSize: 15 }}>{ach.title}</Typography>
        {ach.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ...clampSx }}>{ach.description}</Typography>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
          <Chip icon={<Star size={12} />} label={`${ach.points} pts`} size="small" variant="outlined" sx={{ fontSize: 11, height: 22, color: '#402083', borderColor: 'rgba(64,32,131,0.3)' }} />
          <Chip label={ach.isHidden ? 'Hidden' : 'Visible'} size="small" sx={{ fontSize: 11, height: 22, backgroundColor: ach.isHidden ? '#FEF3C7' : '#DCFCE7', color: ach.isHidden ? '#B45309' : '#15803D' }} />
        </Box>
      </CardContent>

      <Box sx={{ px: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Chip label={`Order ${ach.order}`} size="small" variant="outlined" sx={{ fontSize: 11, height: 24, color: '#402083', borderColor: 'rgba(64,32,131,0.2)' }} />
        <Button
          size="small"
          onClick={() => onView(ach)}
          sx={{ ml: 'auto', fontSize: 12, fontWeight: 600, color: '#402083', textTransform: 'none', '&:hover': { backgroundColor: '#EEE8FA' } }}
          endIcon={<Eye size={14} />}
        >
          Details
        </Button>
      </Box>
    </Card>
  );
}

function LeaderCard({ entry, onEdit, onDelete, onView }: { entry: LeaderboardEntry; onEdit: (e: LeaderboardEntry) => void; onDelete: (e: LeaderboardEntry) => void; onView: (e: LeaderboardEntry) => void }) {
  const rc = rankColors(entry.rank);
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden',
        border: '1px solid rgba(30,27,46,0.06)', transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 16px 40px rgba(30,27,46,0.12)', borderColor: 'rgba(64,32,131,0.15)' },
      }}
    >
      <Box sx={{ height: 130, position: 'relative', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, #402083 0%, #6B4EAB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {entry.avatarUrl ? (
          <Box component="img" src={entry.avatarUrl} alt={entry.playerName} sx={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.85)' }} />
        ) : (
          <Box sx={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
            <Typography fontWeight={800} sx={{ fontSize: 24, color: '#402083' }}>{initials(entry.playerName)}</Typography>
          </Box>
        )}
        <Chip
          icon={<Medal size={13} />}
          label={`#${entry.rank}`}
          size="small"
          sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1, fontWeight: 700, fontSize: 10.5, height: 22, backgroundColor: rc.bg, color: rc.fg }}
        />
        <Box
          sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1, p: 1.5,
            background: 'linear-gradient(transparent, rgba(30,27,46,0.7))', opacity: 0, transform: 'translateY(8px)',
            transition: 'all 250ms ease', '.MuiCard-root:hover &': { opacity: 1, transform: 'translateY(0)' },
          }}
        >
          <HoverIcon title="View Details" onClick={() => onView(entry)}><Eye size={16} color="#402083" /></HoverIcon>
          <HoverIcon title="Edit" onClick={() => onEdit(entry)}><EditIcon fontSize="small" /></HoverIcon>
          <HoverIcon title="Delete" danger onClick={() => onDelete(entry)}><DeleteIcon fontSize="small" /></HoverIcon>
        </Box>
      </Box>

      <CardContent sx={{ px: 2.5, pt: 2, pb: 1, flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.35, fontSize: 15 }}>{entry.playerName}</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
          <Chip icon={<Trophy size={12} />} label={`${entry.score.toLocaleString()} pts`} size="small" sx={{ fontSize: 11, height: 22, backgroundColor: '#FFF7E0', color: '#B45309' }} />
          <Chip label={`Rank ${entry.rank}`} size="small" variant="outlined" sx={{ fontSize: 11, height: 22, color: '#402083', borderColor: 'rgba(64,32,131,0.3)' }} />
        </Box>
      </CardContent>

      <Box sx={{ px: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Chip label={`#${entry.rank}`} size="small" variant="outlined" sx={{ fontSize: 11, height: 24, color: '#402083', borderColor: 'rgba(64,32,131,0.2)' }} />
        <Button
          size="small"
          onClick={() => onView(entry)}
          sx={{ ml: 'auto', fontSize: 12, fontWeight: 600, color: '#402083', textTransform: 'none', '&:hover': { backgroundColor: '#EEE8FA' } }}
          endIcon={<Eye size={14} />}
        >
          Details
        </Button>
      </Box>
    </Card>
  );
}

function AchievementDetailDialog({ ach, onClose, onEdit }: { ach: Achievement | null; onClose: () => void; onEdit: (a: Achievement) => void }) {
  if (!ach) return null;
  return (
    <Dialog open={!!ach} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      <Box sx={{ position: 'relative', height: 170, overflow: 'hidden', background: ACHIEVEMENT_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {ach.iconUrl ? (
          <Box component="img" src={ach.iconUrl} alt={ach.title} sx={{ width: 88, height: 88, objectFit: 'contain', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))' }} />
        ) : (
          <Typography sx={{ fontSize: 72, lineHeight: 1, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))' }}>{ach.emoji}</Typography>
        )}
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2, backgroundColor: 'rgba(30,27,46,0.55)', color: '#fff', width: 36, height: 36, '&:hover': { backgroundColor: 'rgba(30,27,46,0.75)' } }}>
          <X size={20} />
        </IconButton>
        <Chip
          label={`${ach.points} pts`}
          size="small"
          sx={{ position: 'absolute', top: 14, left: 14, fontWeight: 700, fontSize: 11, backgroundColor: '#FFD75A', color: '#402083' }}
        />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, background: 'linear-gradient(transparent, rgba(30,27,46,0.45))' }} />
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>{ach.title}</Typography>
            <Chip label={ach.isHidden ? 'Hidden' : 'Visible'} size="small" sx={{ mt: 1, backgroundColor: ach.isHidden ? '#FEF3C7' : '#DCFCE7', color: ach.isHidden ? '#B45309' : '#15803D', fontWeight: 600 }} />
          </Box>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => { onEdit(ach); onClose(); }} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flexShrink: 0, ml: 2 }}>
            Edit
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <StatBox color="#EEE8FA"><Star size={20} color="#402083" /><Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{ach.points}</Typography><Typography variant="caption" color="text.secondary">Points</Typography></StatBox>
          <StatBox color="#F5F4FA"><ListOrdered size={20} color="#6E6A85" /><Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, fontSize: 14 }}>{ach.order}</Typography><Typography variant="caption" color="text.secondary">Order</Typography></StatBox>
          <StatBox color="#F5F4FA"><Trophy size={20} color="#6E6A85" /><Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, fontSize: 14, color: ach.isHidden ? '#B45309' : '#15803D' }}>{ach.isHidden ? 'Hidden' : 'Visible'}</Typography><Typography variant="caption" color="text.secondary">Status</Typography></StatBox>
          <StatBox color="#F5F4FA"><Calendar size={20} color="#6E6A85" /><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>Created</Typography><Typography variant="caption" color="text.secondary">{formatDate(ach.createdAt)}</Typography></StatBox>
        </Box>

        {ach.description && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Description</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>{ach.description}</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">Updated {formatDateTime(ach.updatedAt)}</Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function LeaderDetailDialog({ entry, onClose, onEdit }: { entry: LeaderboardEntry | null; onClose: () => void; onEdit: (e: LeaderboardEntry) => void }) {
  if (!entry) return null;
  const rc = rankColors(entry.rank);
  return (
    <Dialog open={!!entry} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      <Box sx={{ position: 'relative', height: 170, overflow: 'hidden', background: 'linear-gradient(135deg, #402083 0%, #6B4EAB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {entry.avatarUrl ? (
          <Box component="img" src={entry.avatarUrl} alt={entry.playerName} sx={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.9)' }} />
        ) : (
          <Box sx={{ width: 96, height: 96, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,0,0,0.3)' }}>
            <Typography fontWeight={800} sx={{ fontSize: 34, color: '#402083' }}>{initials(entry.playerName)}</Typography>
          </Box>
        )}
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2, backgroundColor: 'rgba(30,27,46,0.55)', color: '#fff', width: 36, height: 36, '&:hover': { backgroundColor: 'rgba(30,27,46,0.75)' } }}>
          <X size={20} />
        </IconButton>
        <Chip icon={<Medal size={13} />} label={`Rank #${entry.rank}`} size="small" sx={{ position: 'absolute', top: 14, left: 14, fontWeight: 700, fontSize: 11, backgroundColor: rc.bg, color: rc.fg }} />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, background: 'linear-gradient(transparent, rgba(30,27,46,0.45))' }} />
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2, minWidth: 0 }}>{entry.playerName}</Typography>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => { onEdit(entry); onClose(); }} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flexShrink: 0, ml: 2 }}>
            Edit
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <StatBox color="#EEE8FA"><Medal size={20} color="#402083" /><Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>#{entry.rank}</Typography><Typography variant="caption" color="text.secondary">Rank</Typography></StatBox>
          <StatBox color="#FFF7E0"><Trophy size={20} color="#B45309" /><Typography variant="h6" fontWeight={700} sx={{ mt: 0.5, color: '#B45309' }}>{entry.score.toLocaleString()}</Typography><Typography variant="caption" color="text.secondary">Score</Typography></StatBox>
          <StatBox color="#F5F4FA"><Calendar size={20} color="#6E6A85" /><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>Created</Typography><Typography variant="caption" color="text.secondary">{formatDate(entry.createdAt)}</Typography></StatBox>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">Updated {formatDateTime(entry.updatedAt)}</Typography>
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{hasFilters ? 'Try adjusting your search' : description}</Typography>
      {hasFilters ? (
        <Button variant="outlined" onClick={onClear} sx={{ borderRadius: 2, textTransform: 'none' }}>Clear search</Button>
      ) : (
        <Button variant="contained" onClick={onAdd} sx={{ borderRadius: 2, textTransform: 'none' }}>{addLabel}</Button>
      )}
    </Box>
  );
}

export default function MyCaptainPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [tabIndex, setTabIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formAchievement, setFormAchievement] = useState({ title: '', description: '', emoji: '⭐', iconUrl: '', points: 10, isHidden: false, order: 0 });
  const [formLeaderboard, setFormLeaderboard] = useState({ playerName: '', score: 0, rank: 0, avatarUrl: '' });
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'achievements' | 'leaderboard'>('achievements');
  const [detailAch, setDetailAch] = useState<Achievement | null>(null);
  const [detailEntry, setDetailEntry] = useState<LeaderboardEntry | null>(null);

  const achievementsQuery = useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get('/my-captain/achievements').then((r) => r.data),
  });
  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/my-captain/leaderboard').then((r) => r.data),
  });

  const achievements: Achievement[] = achievementsQuery.data?.data || [];
  const entries: LeaderboardEntry[] = leaderboardQuery.data?.data || [];

  const q = search.trim().toLowerCase();
  const filteredAchievements = achievements.filter((a) => !q || (a.title || '').toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q));
  const filteredEntries = entries.filter((e) => !q || (e.playerName || '').toLowerCase().includes(q));

  const isLoading = tabIndex === 0 ? achievementsQuery.isLoading : leaderboardQuery.isLoading;
  const isError = tabIndex === 0 ? achievementsQuery.isError : leaderboardQuery.isError;
  const error = tabIndex === 0 ? achievementsQuery.error : leaderboardQuery.error;
  const hasFilters = !!search;
  const activeItems = tabIndex === 0 ? filteredAchievements : filteredEntries;

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post(`/my-captain/${tabIndex === 0 ? 'achievements' : 'leaderboard'}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['achievements'] }); queryClient.invalidateQueries({ queryKey: ['leaderboard'] }); addNotification(tabIndex === 0 ? 'Achievement created' : 'Leaderboard entry created', 'success'); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/my-captain/${tabIndex === 0 ? 'achievements' : 'leaderboard'}/${body.id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['achievements'] }); queryClient.invalidateQueries({ queryKey: ['leaderboard'] }); addNotification(tabIndex === 0 ? 'Achievement updated' : 'Leaderboard entry updated', 'success'); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/my-captain/${deleteType}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      setDeleteId(null);
      addNotification(deleteType === 'achievements' ? 'Achievement deleted' : 'Leaderboard entry deleted', 'success');
    },
  });

  const handleOpen = (item?: any) => {
    if (tabIndex === 0) {
      setFormAchievement(item ? { title: item.title, description: item.description || '', emoji: item.emoji || '⭐', iconUrl: item.iconUrl || '', points: item.points || 10, isHidden: item.isHidden || false, order: item.order || 0 } : { title: '', description: '', emoji: '⭐', iconUrl: '', points: 10, isHidden: false, order: 0 });
    } else {
      setFormLeaderboard(item ? { playerName: item.playerName, score: item.score, rank: item.rank, avatarUrl: item.avatarUrl || '' } : { playerName: '', score: 0, rank: 0, avatarUrl: '' });
    }
    setEditItem(item || null);
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => { setDialogOpen(false); setEditItem(null); setFormError(''); };

  const handleSave = () => {
    if (tabIndex === 0) {
      if (!formAchievement.title.trim()) { setFormError('Title is required'); return; }
      if (editItem) updateMutation.mutate({ id: editItem.id, ...formAchievement });
      else createMutation.mutate(formAchievement);
    } else {
      if (!formLeaderboard.playerName.trim()) { setFormError('Player name is required'); return; }
      if (editItem) updateMutation.mutate({ id: editItem.id, ...formLeaderboard });
      else createMutation.mutate(formLeaderboard);
    }
  };

  return (
    <FadeIn>
      <Box>
        <PageHeader
          title="My Captain"
          subtitle={`${achievements.length} achievements · ${entries.length} leaderboard entries`}
          actionLabel={tabIndex === 0 ? 'Add Achievement' : 'Add Entry'}
          onAction={() => handleOpen()}
        />

        <Tabs
          value={tabIndex}
          onChange={(_, v) => { setTabIndex(v); setSearch(''); }}
          sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: 14, minHeight: 44 } }}
        >
          <Tab label={`Achievements (${achievements.length})`} />
          <Tab label={`Leaderboard (${entries.length})`} />
        </Tabs>

        {/* Toolbar */}
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 3, borderRadius: 3, border: '1px solid rgba(30,27,46,0.06)', flexWrap: 'wrap' }}>
          <TextField
            placeholder={tabIndex === 0 ? 'Search achievements...' : 'Search players...'}
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
              icon={<Trophy size={56} color="#6E6A85" />}
              title="No achievements yet"
              description="Create your first achievement to get started"
              hasFilters={hasFilters}
              onClear={() => setSearch('')}
              onAdd={() => handleOpen()}
              addLabel="Add Achievement"
            />
          ) : (
            <EmptyState
              icon={<Medal size={56} color="#6E6A85" />}
              title="No leaderboard entries yet"
              description="Add players to the leaderboard to get started"
              hasFilters={hasFilters}
              onClear={() => setSearch('')}
              onAdd={() => handleOpen()}
              addLabel="Add Entry"
            />
          )
        ) : (
          <Grid container spacing={3}>
            {tabIndex === 0
              ? filteredAchievements.map((ach) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={ach.id}>
                    <AchievementCard ach={ach} onEdit={(a) => handleOpen(a)} onDelete={(a) => { setDeleteType('achievements'); setDeleteId(a.id); }} onView={(a) => setDetailAch(a)} />
                  </Grid>
                ))
              : filteredEntries.map((entry) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={entry.id}>
                    <LeaderCard entry={entry} onEdit={(e) => handleOpen(e)} onDelete={(e) => { setDeleteType('leaderboard'); setDeleteId(e.id); }} onView={(e) => setDetailEntry(e)} />
                  </Grid>
                ))}
          </Grid>
        )}

        {/* Detail dialogs */}
        <AchievementDetailDialog ach={detailAch} onClose={() => setDetailAch(null)} onEdit={(a) => handleOpen(a)} />
        <LeaderDetailDialog entry={detailEntry} onClose={() => setDetailEntry(null)} onEdit={(e) => handleOpen(e)} />

        {/* Form Modal */}
        <FormModal
          open={dialogOpen}
          title={editItem ? `Edit ${tabIndex === 0 ? 'Achievement' : 'Entry'}` : `Add ${tabIndex === 0 ? 'Achievement' : 'Entry'}`}
          subtitle={tabIndex === 0 ? 'Rewards shown in the My Captain achievements list' : 'Players shown on the My Captain leaderboard'}
          onClose={handleClose}
          onSubmit={handleSave}
          loading={createMutation.isPending || updateMutation.isPending}
          error={formError || null}
        >
          {tabIndex === 0 ? (
            <>
              <FormTextField required label="Title" value={formAchievement.title} onChange={(e) => setFormAchievement({ ...formAchievement, title: e.target.value })} autoFocus />
              <FormTextField label="Description" value={formAchievement.description} onChange={(e) => setFormAchievement({ ...formAchievement, description: e.target.value })} multiline rows={2} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormTextField label="Emoji" value={formAchievement.emoji} onChange={(e) => setFormAchievement({ ...formAchievement, emoji: e.target.value })} helperText="Used when no icon URL" sx={{ mb: 0 }} />
                <FormTextField label="Points" type="number" value={formAchievement.points} onChange={(e) => setFormAchievement({ ...formAchievement, points: parseInt(e.target.value) || 0 })} sx={{ mb: 0 }} />
              </Box>
              <FormTextField label="Icon URL" value={formAchievement.iconUrl} onChange={(e) => setFormAchievement({ ...formAchievement, iconUrl: e.target.value })} helperText="Optional image URL for the achievement icon" />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormTextField label="Order" type="number" value={formAchievement.order} onChange={(e) => setFormAchievement({ ...formAchievement, order: parseInt(e.target.value) || 0 })} sx={{ mb: 0 }} />
                <FormControlLabel control={<Switch checked={formAchievement.isHidden} onChange={(e) => setFormAchievement({ ...formAchievement, isHidden: e.target.checked })} />} label="Hidden" />
              </Box>
            </>
          ) : (
            <>
              <FormTextField required label="Player Name" value={formLeaderboard.playerName} onChange={(e) => setFormLeaderboard({ ...formLeaderboard, playerName: e.target.value })} autoFocus />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormTextField label="Score" type="number" value={formLeaderboard.score} onChange={(e) => setFormLeaderboard({ ...formLeaderboard, score: parseInt(e.target.value) || 0 })} sx={{ mb: 0 }} />
                <FormTextField label="Rank" type="number" value={formLeaderboard.rank} onChange={(e) => setFormLeaderboard({ ...formLeaderboard, rank: parseInt(e.target.value) || 0 })} sx={{ mb: 0 }} />
              </Box>
              <FormTextField label="Avatar URL" value={formLeaderboard.avatarUrl} onChange={(e) => setFormLeaderboard({ ...formLeaderboard, avatarUrl: e.target.value })} helperText="Optional — a circular avatar image" />
            </>
          )}
        </FormModal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteId}
          title={`Delete ${deleteType === 'achievements' ? 'Achievement' : 'Entry'}`}
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
