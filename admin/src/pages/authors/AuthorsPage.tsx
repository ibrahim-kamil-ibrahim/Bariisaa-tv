import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, IconButton, Tooltip, Typography, Card, CardContent,
  Chip, Skeleton, Grid, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Checkbox, FormControlLabel, Paper, InputAdornment,
  Avatar,
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon,
  CheckSquare, Square, Trash2, Search, X,
  ChevronLeft, ChevronRight, User, ImagePlus, BookOpen, Eye, Maximize2,
  Calendar, Clock, Music, BookMarked, Loader2,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';
import { Author } from '../../types';

const getPhotoUrl = (photoUrl?: string | null) =>
  !photoUrl ? '' : photoUrl.startsWith('http') ? photoUrl : `${api.defaults.baseURL}/files/${photoUrl}`;

const getCounts = (a: Author) => ({
  books: a._count?.books ?? a.bookCount ?? 0,
  music: a._count?.musicTracks ?? a.musicTrackCount ?? 0,
  stories: a._count?.stories ?? a.storyCount ?? 0,
});

function AuthorCard({ author, onEdit, onDelete, onView, onViewImage, selectMode, selected, onToggleSelect }: {
  author: Author;
  onEdit: (a: Author) => void;
  onDelete: (a: Author) => void;
  onView: (a: Author) => void;
  onViewImage: (a: Author) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (a: Author) => void;
}) {
  const photoUrl = getPhotoUrl(author.photoUrl);
  const counts = getCounts(author);
  return (
    <Card
      elevation={0}
      onClick={selectMode && onToggleSelect ? () => onToggleSelect(author) : undefined}
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
      {/* Photo area */}
      <Box
        onClick={photoUrl ? (e) => { e.stopPropagation(); if (!selectMode) onViewImage(author); } : undefined}
        sx={{
          height: 160, position: 'relative', overflow: 'hidden', bgcolor: '#EEE8FA',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          cursor: photoUrl && !selectMode ? 'zoom-in' : 'default',
        }}
      >
        {photoUrl ? (
          <>
            <Box
              component="img"
              src={photoUrl}
              alt={author.name}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 400ms ease', '.MuiCard-root:hover &': { transform: 'scale(1.05)' } }}
            />
            {/* Fullscreen icon overlay on hover */}
            <Box
              onClick={(e) => { e.stopPropagation(); if (!selectMode) onViewImage(author); }}
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
          <Avatar sx={{ width: 72, height: 72, bgcolor: '#402083', fontSize: 28, fontWeight: 700 }}>
            {author.name?.charAt(0)?.toUpperCase()}
          </Avatar>
        )}

        {/* Selection checkbox */}
        {selectMode && (
          <Box
            onClick={(e) => { e.stopPropagation(); onToggleSelect?.(author); }}
            sx={{
              position: 'absolute', top: 10, left: 10, zIndex: 2,
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
              <IconButton size="small" onClick={() => onView(author)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#fff' }, width: 34, height: 34 }}>
                <Eye size={16} color="#402083" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(author)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#fff' }, width: 34, height: 34 }}><EditIcon size={16} /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => onDelete(author)} sx={{ backgroundColor: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: '#FDE8E8' }, width: 34, height: 34 }}><DeleteIcon size={16} /></IconButton></Tooltip>
          </Box>
        )}
      </Box>

      {/* Content */}
      <CardContent sx={{ px: 2.5, pt: 2, pb: 1, flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.35, fontSize: 15 }} noWrap>
          {author.name}
        </Typography>
        {author.bio && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.75, fontSize: 12.5, lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              minHeight: 38,
            }}
          >
            {author.bio}
          </Typography>
        )}
      </CardContent>

      {/* Footer */}
      <Box sx={{ px: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        <Chip
          icon={<BookOpen size={13} />}
          label={`${counts.books} books`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 11, height: 24, borderColor: 'rgba(64,32,131,0.2)', color: '#402083' }}
        />
        <Chip
          icon={<Music size={13} />}
          label={`${counts.music} music`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 11, height: 24, borderColor: 'rgba(255,152,0,0.35)', color: '#E65100' }}
        />
        <Chip
          icon={<BookMarked size={13} />}
          label={`${counts.stories} stories`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 11, height: 24, borderColor: 'rgba(0,150,136,0.35)', color: '#00695C' }}
        />
        {!selectMode && (
          <Button
            size="small"
            onClick={(e) => { e.stopPropagation(); onView(author); }}
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

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <Box sx={{ textAlign: 'center', py: 10, gridColumn: '1 / -1' }}>
      <User size={56} color="#6E6A85" style={{ opacity: 0.4 }} />
      <Typography variant="h6" fontWeight={700} sx={{ mt: 2, mb: 0.5 }}>No authors found</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Try adjusting your search or add a new author
      </Typography>
      <Button variant="outlined" onClick={onClear} sx={{ borderRadius: 2 }}>
        Clear search
      </Button>
    </Box>
  );
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function formatDateTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatDuration(sec?: number) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface AuthorDetail extends Author {
  books?: { id: string; title: string; coverUrl?: string | null; avgRating?: number | null }[];
  booksMeta?: { total: number };
  musicTracks?: { id: string; title: string; coverUrl?: string | null; durationSeconds?: number; genre?: string; playCount?: number }[];
  musicMeta?: { total: number };
  stories?: { id: string; title: string; coverUrl?: string | null; category?: string; viewCount?: number }[];
  storiesMeta?: { total: number };
}

function ContentRow({ coverUrl, title, meta }: { coverUrl?: string | null; title: string; meta?: string }) {
  const url = coverUrl ? getPhotoUrl(coverUrl) : '';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
      {url ? (
        <Box component="img" src={url} alt={title} sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0, bgcolor: '#EEE8FA' }} />
      ) : (
        <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: '#EEE8FA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen size={16} color="#402083" />
        </Box>
      )}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" fontWeight={600} noWrap>{title}</Typography>
        {meta && <Typography variant="caption" color="text.secondary">{meta}</Typography>}
      </Box>
    </Box>
  );
}

function ContentSection({ title, icon, total, items, emptyText }: {
  title: string;
  icon: React.ReactNode;
  total: number;
  items?: { id: string; title: string; coverUrl?: string | null; meta?: string }[];
  emptyText: string;
}) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {icon}
        <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
        <Chip label={total} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700, backgroundColor: '#EEE8FA', color: '#402083' }} />
      </Box>
      <Box sx={{ pl: 0.5 }}>
        {total === 0 && (
          <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ py: 0.5 }}>
            {emptyText}
          </Typography>
        )}
        {items && items.length > 0 && items.map((item) => (
          <ContentRow key={item.id} coverUrl={item.coverUrl} title={item.title} meta={item.meta} />
        ))}
        {total > (items?.length || 0) && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pt: 0.5 }}>
            + {total - (items?.length || 0)} more
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function AuthorDetailDialog({ author, onClose, onEdit }: { author: Author | null; onClose: () => void; onEdit: (a: Author) => void }) {
  const photoUrl = author ? getPhotoUrl(author.photoUrl) : '';

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['author-detail', author?.id],
    queryFn: () => api.get(`/authors/${author!.id}`).then((r) => r.data.data || r.data),
    enabled: !!author,
    staleTime: 30_000,
  });

  const d: AuthorDetail = detail || (author as AuthorDetail) || null;
  const counts = d ? getCounts(d as Author) : { books: 0, music: 0, stories: 0 };

  const bookItems = (d?.books || []).map((b) => ({
    id: b.id, title: b.title, coverUrl: b.coverUrl,
    meta: b.avgRating ? `★ ${b.avgRating.toFixed(1)}` : undefined,
  }));
  const musicItems = (d?.musicTracks || []).map((m) => ({
    id: m.id, title: m.title, coverUrl: m.coverUrl,
    meta: [m.genre, formatDuration(m.durationSeconds), m.playCount ? `${m.playCount} plays` : null].filter(Boolean).join(' · '),
  }));
  const storyItems = (d?.stories || []).map((s) => ({
    id: s.id, title: s.title, coverUrl: s.coverUrl,
    meta: [s.category, s.viewCount ? `${s.viewCount} views` : null].filter(Boolean).join(' · '),
  }));

  return (
    <Dialog open={!!author} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      {author && (
        <>
          {/* Cover photo banner */}
          <Box sx={{ position: 'relative', height: 220, bgcolor: '#EEE8FA', overflow: 'hidden' }}>
            {photoUrl ? (
              <Box
                component="img"
                src={photoUrl}
                alt={author.name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#EEE8FA' }}>
                <Avatar sx={{ width: 96, height: 96, bgcolor: '#402083', fontSize: 40, fontWeight: 700 }}>
                  {author.name?.charAt(0)?.toUpperCase()}
                </Avatar>
              </Box>
            )}
            {/* Close button */}
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
            {/* Gradient overlay */}
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, rgba(30,27,46,0.5))' }} />
          </Box>

          <DialogContent sx={{ pt: 3 }}>
            {/* Name and edit */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                  {author.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Author
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<EditIcon size={16} />}
                onClick={() => { onEdit(author); onClose(); }}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
              >
                Edit
              </Button>
            </Box>

            {/* Content stats row: Books / Music / Stories */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
              <Box sx={{ flex: 1, p: 1.75, borderRadius: 2, backgroundColor: '#EEE8FA', textAlign: 'center' }}>
                <BookOpen size={20} color="#402083" />
                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{counts.books}</Typography>
                <Typography variant="caption" color="text.secondary">Books</Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1.75, borderRadius: 2, backgroundColor: '#FFF4E0', textAlign: 'center' }}>
                <Music size={20} color="#E65100" />
                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{counts.music}</Typography>
                <Typography variant="caption" color="text.secondary">Music</Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1.75, borderRadius: 2, backgroundColor: '#E0F5F3', textAlign: 'center' }}>
                <BookMarked size={20} color="#00695C" />
                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{counts.stories}</Typography>
                <Typography variant="caption" color="text.secondary">Stories</Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1.75, borderRadius: 2, backgroundColor: '#F5F4FA', textAlign: 'center' }}>
                <Calendar size={20} color="#6E6A85" />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                  Created
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(author.createdAt)}
                </Typography>
              </Box>
            </Box>

            {/* Bio */}
            {author.bio && (
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Biography
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {author.bio}
                </Typography>
              </Box>
            )}

            {detailLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                <Loader2 size={16} className="spin" color="#402083" />
                <Typography variant="body2" color="text.secondary">Loading content…</Typography>
              </Box>
            )}

            {/* Content sections */}
            {!detailLoading && (
              <>
                <ContentSection
                  title="Books"
                  icon={<BookOpen size={16} color="#402083" />}
                  total={counts.books}
                  items={bookItems}
                  emptyText="No published books yet."
                />
                <ContentSection
                  title="Music"
                  icon={<Music size={16} color="#E65100" />}
                  total={counts.music}
                  items={musicItems}
                  emptyText="No music tracks yet."
                />
                <ContentSection
                  title="Storytelling"
                  icon={<BookMarked size={16} color="#00695C" />}
                  total={counts.stories}
                  items={storyItems}
                  emptyText="No storytelling content yet."
                />
              </>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Created {formatDate(author.createdAt)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Updated {formatDateTime(author.updatedAt)}
              </Typography>
            </Box>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}

function FullscreenImageDialog({ author, onClose }: { author: Author | null; onClose: () => void }) {
  const photoUrl = author ? getPhotoUrl(author.photoUrl) : '';
  if (!author || !photoUrl) return null;
  return (
    <Dialog
      open={!!author}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: 'transparent',
          boxShadow: 'none',
          overflow: 'visible',
        },
      }}
      BackdropProps={{
        sx: { backgroundColor: 'rgba(15,10,30,0.88)' },
      }}
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
          src={photoUrl}
          alt={author.name}
          sx={{
            width: '100%',
            maxHeight: '80vh',
            objectFit: 'contain',
            display: 'block',
            backgroundColor: '#0f0a1e',
          }}
        />
        {/* Author name label */}
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(15,10,30,0.85))',
          p: 2.5,
        }}>
          <Typography variant="h6" fontWeight={700} color="#fff">
            {author.name}
          </Typography>
          {author.bio && (
            <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 0.5, maxWidth: 500 }}>
              {author.bio.length > 120 ? author.bio.slice(0, 120) + '…' : author.bio}
            </Typography>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}

export default function AuthorsPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [page, setPage] = useState(0);
  const [limit] = useState(12);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Author | null>(null);
  const [formName, setFormName] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formPhotoFile, setFormPhotoFile] = useState<File | null>(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [detailAuthor, setDetailAuthor] = useState<Author | null>(null);
  const [fullscreenAuthor, setFullscreenAuthor] = useState<Author | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['authors', page, limit, search],
    queryFn: () => api.get('/authors', { params: { page: page + 1, limit, search: search || undefined } }).then((r) => r.data),
  });

  const authors: Author[] = data?.data || data || [];
  const total = data?.meta?.total || authors.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const allSelected = authors.length > 0 && selectedIds.length === authors.length;
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : authors.map((a) => a.id));

  const toggleSelect = (author: Author) => {
    setSelectedIds((prev) => prev.includes(author.id) ? prev.filter((id) => id !== author.id) : [...prev, author.id]);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds([]);
  };

  const createMutation = useMutation({
    mutationFn: (body: { name: string; bio?: string }) => api.post('/authors', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['authors'] }); addNotification('Author created', 'success'); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; name: string; bio?: string }) => api.put(`/authors/${id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['authors'] }); addNotification('Author updated', 'success'); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/authors/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['authors'] }); setDeleteId(null); addNotification('Author deleted', 'success'); },
    onError: (err: any) => { setFormError(err.response?.data?.message || 'Cannot delete author'); setDeleteId(null); },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api.delete(`/authors/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      setSelectedIds([]);
      setSelectMode(false);
      setBulkDeleteDialog(false);
      addNotification(`${selectedIds.length} authors deleted`, 'success');
    },
    onError: (err: any) => { addNotification(err?.response?.data?.message || 'Failed'); setBulkDeleteDialog(false); },
  });

  const handleOpen = (item?: Author) => {
    if (item) {
      setEditItem(item);
      setFormName(item.name);
      setFormBio(item.bio || '');
      setFormPhotoPreview(item.photoUrl || '');
    } else {
      setEditItem(null);
      setFormName('');
      setFormBio('');
      setFormPhotoPreview('');
    }
    setFormPhotoFile(null);
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditItem(null);
    setFormName('');
    setFormBio('');
    setFormPhotoPreview('');
    setFormPhotoFile(null);
    setFormError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormPhotoFile(file);
      setFormPhotoPreview(URL.createObjectURL(file));
    }
  };

  const createPhotoFormData = () => {
    const fd = new FormData();
    if (formPhotoFile) fd.append('image', formPhotoFile);
    return fd;
  };

  const handleSave = async () => {
    if (!formName.trim()) { setFormError('Name is required'); return; }
    setFormError('');
    try {
      if (editItem) {
        let photoUrl = formPhotoPreview;
        if (formPhotoFile) {
          const res = await api.put(`/authors/${editItem.id}/photo`, createPhotoFormData(), {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          photoUrl = res.data.data?.photoUrl || photoUrl;
        }
        await updateMutation.mutateAsync({ id: editItem.id, name: formName, bio: formBio });
        handleClose();
      } else {
        const res = await createMutation.mutateAsync({ name: formName, bio: formBio });
        const authorId = res.data.data?.id;
        if (formPhotoFile && authorId) {
          await api.put(`/authors/${authorId}/photo`, createPhotoFormData(), {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        handleClose();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Error saving author');
    }
  };

  if (isLoading) {
    return (
      <FadeIn>
        <Box>
          <PageHeader title="Authors" subtitle="Manage book and music authors" actionLabel="Add Author" onAction={() => handleOpen()} />
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
          title="Authors"
          subtitle={`${total.toLocaleString()} authors`}
          actionLabel="Add Author"
          onAction={() => handleOpen()}
        />

        {/* Toolbar */}
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 3, borderRadius: 3, border: '1px solid rgba(30,27,46,0.06)', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search authors..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small"
            sx={{ flex: 1, minWidth: 200, maxWidth: 400 }}
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
              {selectedIds.length} of {authors.length} selected
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

        {formError && !dialogOpen && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>
            {formError}
          </Alert>
        )}

        {/* Author grid */}
        {authors.length === 0 ? (
          <EmptyState onClear={() => setSearch('')} />
        ) : (
          <Grid container spacing={3}>
            {authors.map((author) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={author.id}>
                <AuthorCard
                  author={author}
                  onEdit={(a) => handleOpen(a)}
                  onDelete={(a) => setDeleteId(a.id)}
                  onView={(a) => setDetailAuthor(a)}
                  onViewImage={(a) => setFullscreenAuthor(a)}
                  selectMode={selectMode}
                  selected={selectedIds.includes(author.id)}
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
              disabled={authors.length < limit}
              sx={{ borderRadius: 2 }}
            >
              Next
            </Button>
          </Box>
        )}

        {/* Author Form Modal */}
        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editItem ? 'Edit Author' : 'Add Author'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              required
              fullWidth
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              sx={{ mb: 2.5 }}
            />
            <TextField
              margin="dense"
              label="Bio"
              fullWidth
              multiline
              rows={3}
              value={formBio}
              onChange={(e) => setFormBio(e.target.value)}
              sx={{ mb: 2.5 }}
            />
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                Photo <Typography component="span" variant="caption" color="text.secondary" fontWeight={400}>(image from folder)</Typography>
              </Typography>
              {formPhotoPreview && (
                <Box sx={{ mb: 1.5, textAlign: 'center' }}>
                  <Avatar
                    src={formPhotoPreview}
                    sx={{ width: 88, height: 88, mx: 'auto', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(30,27,46,0.12)' }}
                  />
                </Box>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ImagePlus size={18} />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ borderRadius: 2, textTransform: 'none', py: 1.25 }}
              >
                {formPhotoPreview ? 'Change Photo' : 'Upload Photo from Folder'}
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail dialog */}
        <AuthorDetailDialog
          author={detailAuthor}
          onClose={() => setDetailAuthor(null)}
          onEdit={(a) => handleOpen(a)}
        />

        {/* Fullscreen image dialog */}
        <FullscreenImageDialog
          author={fullscreenAuthor}
          onClose={() => setFullscreenAuthor(null)}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete Author?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteId(null)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} sx={{ borderRadius: 2, textTransform: 'none' }}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk delete dialog */}
        <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete {selectedIds.length} Authors?</DialogTitle>
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
