import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Chip, IconButton, Button, Typography, MenuItem, Switch, FormControlLabel,
  Card, CardContent, Grid, Skeleton, Paper, InputAdornment, Alert, TextField,
  Dialog, DialogContent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Repeat, Search, X, ChevronLeft, ChevronRight, Eye, Star, Calendar, ListOrdered } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FadeIn from '../../components/FadeIn';
import FormModal from '../../components/FormModal';
import FormTextField from '../../components/FormTextField';
import api from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';

interface Habit {
  id: string;
  title: string;
  description?: string;
  emoji: string;
  category?: string;
  points: number;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

const CATEGORY_OPTIONS = ['health', 'productivity', 'mindfulness', 'fitness', 'learning'];

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

function HabitCard({ habit, onEdit, onDelete, onView }: {
  habit: Habit;
  onEdit: (h: Habit) => void;
  onDelete: (h: Habit) => void;
  onView: (h: Habit) => void;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden',
        border: '1px solid rgba(30,27,46,0.06)', transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 16px 40px rgba(30,27,46,0.12)', borderColor: 'rgba(64,32,131,0.15)' },
      }}
    >
      <Box sx={{ height: 130, position: 'relative', overflow: 'hidden', flexShrink: 0, background: categoryGradient(habit.category), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: 52, lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>{habit.emoji}</Typography>
        <Chip
          label={habit.isActive ? 'ACTIVE' : 'INACTIVE'}
          size="small"
          sx={{
            position: 'absolute', top: 10, left: 10, zIndex: 1, fontWeight: 700, fontSize: 10.5, height: 22,
            backgroundColor: habit.isActive ? '#DCFCE7' : '#E5E7EB', color: habit.isActive ? '#15803D' : '#6B7280',
          }}
        />
        <Box
          sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1, p: 1.5,
            background: 'linear-gradient(transparent, rgba(30,27,46,0.7))', opacity: 0, transform: 'translateY(8px)',
            transition: 'all 250ms ease', '.MuiCard-root:hover &': { opacity: 1, transform: 'translateY(0)' },
          }}
        >
          <TooltipIcon title="View Details" onClick={() => onView(habit)}><Eye size={16} color="#402083" /></TooltipIcon>
          <TooltipIcon title="Edit" onClick={() => onEdit(habit)}><EditIcon fontSize="small" /></TooltipIcon>
          <TooltipIcon title="Delete" danger onClick={() => onDelete(habit)}><DeleteIcon fontSize="small" /></TooltipIcon>
        </Box>
      </Box>

      <CardContent sx={{ px: 2.5, pt: 2, pb: 1, flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.35, fontSize: 15 }}>{habit.title}</Typography>
        {habit.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ...clampSx }}>{habit.description}</Typography>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
          <Chip label={habit.category || 'general'} size="small" variant="outlined" sx={{ fontSize: 11, height: 22, textTransform: 'capitalize' }} />
          <Chip icon={<Star size={12} />} label={`${habit.points} pts`} size="small" sx={{ fontSize: 11, height: 22, backgroundColor: '#FFF7E0', color: '#B45309' }} />
        </Box>
      </CardContent>

      <Box sx={{ px: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Chip label={`Order ${habit.order}`} size="small" variant="outlined" sx={{ fontSize: 11, height: 24, color: '#402083', borderColor: 'rgba(64,32,131,0.2)' }} />
        <Button
          size="small"
          onClick={() => onView(habit)}
          sx={{ ml: 'auto', fontSize: 12, fontWeight: 600, color: '#402083', textTransform: 'none', '&:hover': { backgroundColor: '#EEE8FA' } }}
          endIcon={<Eye size={14} />}
        >
          Details
        </Button>
      </Box>
    </Card>
  );
}

function TooltipIcon({ title, children, onClick, danger }: { title: string; children: React.ReactNode; onClick: () => void; danger?: boolean }) {
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

function HabitDetailDialog({ habit, onClose, onEdit }: { habit: Habit | null; onClose: () => void; onEdit: (h: Habit) => void }) {
  if (!habit) return null;
  return (
    <Dialog open={!!habit} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      <Box sx={{ position: 'relative', height: 170, overflow: 'hidden', background: categoryGradient(habit.category), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: 72, lineHeight: 1, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))' }}>{habit.emoji}</Typography>
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2, backgroundColor: 'rgba(30,27,46,0.55)', color: '#fff', width: 36, height: 36, '&:hover': { backgroundColor: 'rgba(30,27,46,0.75)' } }}>
          <X size={20} />
        </IconButton>
        <Chip
          label={habit.isActive ? 'ACTIVE' : 'INACTIVE'}
          size="small"
          sx={{ position: 'absolute', top: 14, left: 14, fontWeight: 700, fontSize: 11, backgroundColor: habit.isActive ? '#DCFCE7' : '#E5E7EB', color: habit.isActive ? '#15803D' : '#6B7280' }}
        />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, background: 'linear-gradient(transparent, rgba(30,27,46,0.45))' }} />
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2, minWidth: 0 }}>{habit.title}</Typography>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => { onEdit(habit); onClose(); }} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flexShrink: 0, ml: 2 }}>
            Edit
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <StatBox color="#EEE8FA"><Star size={20} color="#402083" /><Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{habit.points}</Typography><Typography variant="caption" color="text.secondary">Points</Typography></StatBox>
          <StatBox color="#F5F4FA"><Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, fontSize: 14, textTransform: 'capitalize' }}>{habit.category || 'general'}</Typography><Typography variant="caption" color="text.secondary">Category</Typography></StatBox>
          <StatBox color="#F5F4FA"><ListOrdered size={20} color="#6E6A85" /><Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, fontSize: 14 }}>{habit.order}</Typography><Typography variant="caption" color="text.secondary">Order</Typography></StatBox>
          <StatBox color="#F5F4FA"><Calendar size={20} color="#6E6A85" /><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>Created</Typography><Typography variant="caption" color="text.secondary">{formatDate(habit.createdAt)}</Typography></StatBox>
        </Box>

        {habit.description && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Description</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>{habit.description}</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">Updated {formatDateTime(habit.updatedAt)}</Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <Box sx={{ flex: 1, minWidth: 100, p: 1.75, borderRadius: 2, backgroundColor: color, textAlign: 'center' }}>
      {children}
    </Box>
  );
}

function EmptyState({ hasFilters, onClear, onAdd }: { hasFilters: boolean; onClear: () => void; onAdd: () => void }) {
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Repeat size={56} color="#6E6A85" style={{ opacity: 0.4 }} />
      <Typography variant="h6" fontWeight={700} sx={{ mt: 2, mb: 0.5 }}>
        {hasFilters ? 'No habits found' : 'No habits yet'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {hasFilters ? 'Try adjusting your search or filters' : 'Create your first habit to get started'}
      </Typography>
      {hasFilters ? (
        <Button variant="outlined" onClick={onClear} sx={{ borderRadius: 2, textTransform: 'none' }}>Clear filters</Button>
      ) : (
        <Button variant="contained" onClick={onAdd} sx={{ borderRadius: 2, textTransform: 'none' }}>Add Habit</Button>
      )}
    </Box>
  );
}

export default function HabitsPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [page, setPage] = useState(0);
  const [limit] = useState(12);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Habit | null>(null);
  const [form, setForm] = useState({ title: '', description: '', emoji: '⭐', category: 'health', points: 10, isActive: true, order: 0 });
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['habits', page, limit, search, categoryFilter],
    queryFn: () => api.get('/habits', { params: { page: page + 1, limit, search: search || undefined, category: categoryFilter === 'ALL' ? undefined : categoryFilter } }).then((r) => r.data),
  });

  const habits: Habit[] = data?.data || [];
  const total = data?.meta?.total ?? habits.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilters = !!search || categoryFilter !== 'ALL';

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/habits', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); addNotification('Habit created', 'success'); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/habits/${body.id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); addNotification('Habit updated', 'success'); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/habits/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); setDeleteId(null); addNotification('Habit deleted', 'success'); },
  });

  const handleOpen = (item?: Habit) => {
    if (item) {
      setEditItem(item);
      setForm({ title: item.title, description: item.description || '', emoji: item.emoji, category: item.category || 'health', points: item.points, isActive: item.isActive, order: item.order });
    } else {
      setEditItem(null);
      setForm({ title: '', description: '', emoji: '⭐', category: 'health', points: 10, isActive: true, order: 0 });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => { setDialogOpen(false); setEditItem(null); setFormError(''); };

  const handleSave = () => {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (editItem) updateMutation.mutate({ id: editItem.id, ...form });
    else createMutation.mutate(form);
  };

  return (
    <FadeIn>
      <Box>
        <PageHeader title="Habits" subtitle={`${total.toLocaleString()} habits`} actionLabel="Add Habit" onAction={() => handleOpen()} />

        {/* Toolbar */}
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 3, borderRadius: 3, border: '1px solid rgba(30,27,46,0.06)', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search habits..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
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
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {(['ALL', ...CATEGORY_OPTIONS] as const).map((cat) => (
              <Chip
                key={cat}
                label={cat === 'ALL' ? 'All' : (cat as string).charAt(0).toUpperCase() + (cat as string).slice(1)}
                onClick={() => { setCategoryFilter(cat as string); setPage(0); }}
                color={categoryFilter === cat ? 'primary' : 'default'}
                variant={categoryFilter === cat ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Box>
        </Paper>

        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load habits'}
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
        ) : habits.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={() => { setSearch(''); setCategoryFilter('ALL'); }} onAdd={() => handleOpen()} />
        ) : (
          <Grid container spacing={3}>
            {habits.map((habit) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={habit.id}>
                <HabitCard
                  habit={habit}
                  onEdit={(h) => handleOpen(h)}
                  onDelete={(h) => setDeleteId(h.id)}
                  onView={(h) => setDetailHabit(h)}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {total > limit && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 4, gap: 2 }}>
            <Button variant="outlined" size="small" startIcon={<ChevronLeft size={16} />} onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Previous
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Page {page + 1} of {totalPages}</Typography>
            <Button variant="outlined" size="small" endIcon={<ChevronRight size={16} />} onClick={() => setPage(page + 1)} disabled={habits.length < limit} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Next
            </Button>
          </Box>
        )}

        {/* Detail dialog */}
        <HabitDetailDialog habit={detailHabit} onClose={() => setDetailHabit(null)} onEdit={(h) => handleOpen(h)} />

        {/* Form Modal */}
        <FormModal
          open={dialogOpen}
          title={editItem ? 'Edit Habit' : 'Add Habit'}
          subtitle="Daily habits shown in the Habits feature"
          onClose={handleClose}
          onSubmit={handleSave}
          loading={createMutation.isPending || updateMutation.isPending}
          error={formError || null}
        >
          <FormTextField required label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
          <FormTextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} />
          <FormTextField label="Emoji" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} helperText="Shown as the habit's icon" />
          <FormTextField select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORY_OPTIONS.map((c) => (
              <MenuItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</MenuItem>
            ))}
          </FormTextField>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormTextField label="Points" type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} sx={{ mb: 0 }} />
            <FormTextField label="Order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} sx={{ mb: 0 }} />
          </Box>
          <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Active" sx={{ mt: 1 }} />
        </FormModal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteId}
          title="Delete Habit"
          message="Are you sure you want to delete this habit? This action cannot be undone."
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
