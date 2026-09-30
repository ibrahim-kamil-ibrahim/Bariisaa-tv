import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Chip, IconButton, Tooltip, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Typography, Switch, FormControlLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';

interface Achievement { id: string; title: string; description?: string; emoji: string; iconUrl?: string; points: number; isHidden: boolean; order: number; }
interface LeaderboardEntry { id: string; playerName: string; score: number; rank: number; avatarUrl?: string; }

export default function MyCaptainPage() {
  const queryClient = useQueryClient();
  const [tabIndex, setTabIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formAchievement, setFormAchievement] = useState({ title: '', description: '', emoji: '⭐', iconUrl: '', points: 10, isHidden: false, order: 0 });
  const [formLeaderboard, setFormLeaderboard] = useState({ playerName: '', score: 0, rank: 0, avatarUrl: '' });
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'achievements' | 'leaderboard'>('achievements');

  const tab = tabIndex === 0 ? 'achievements' : 'leaderboard';
  const queryKey = tabIndex === 0 ? 'achievements' : 'leaderboard';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [queryKey],
    queryFn: () => api.get(`/my-captain/${tab}`).then((r) => r.data),
  });

  const items: any[] = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post(`/my-captain/${tab}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [queryKey] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/my-captain/${tab}/${body.id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [queryKey] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/my-captain/${deleteType}/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['achievements', 'leaderboard'] }); setDeleteId(null); },
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

  const handleDelete = (id: string, type: 'achievements' | 'leaderboard') => {
    setDeleteType(type);
    setDeleteId(id);
  };

  const achievementColumns: Column<Achievement>[] = [
    { id: 'emoji', label: '', render: (row) => <Typography variant="h5">{row.emoji}</Typography> },
    { id: 'title', label: 'Title', sortable: true, render: (row) => <Typography variant="body2" fontWeight={500}>{row.title}</Typography> },
    { id: 'points', label: 'Points', render: (row) => <Chip label={row.points} size="small" color="primary" /> },
    { id: 'isHidden', label: 'Hidden', render: (row) => row.isHidden ? <Chip label="Yes" size="small" color="warning" /> : <Chip label="No" size="small" color="default" /> },
    { id: 'order', label: 'Order', render: (row) => row.order },
    { id: 'actions', label: 'Actions', align: 'right' as const, render: (row: any) => (
      <Box>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(row.id, 'achievements')}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
      </Box>
    )},
  ];

  const leaderboardColumns: Column<LeaderboardEntry>[] = [
    { id: 'rank', label: 'Rank', render: (row) => <Typography variant="body2" fontWeight={700}>#{row.rank}</Typography> },
    { id: 'playerName', label: 'Player', sortable: true, render: (row) => <Typography variant="body2" fontWeight={500}>{row.playerName}</Typography> },
    { id: 'score', label: 'Score', render: (row) => <Chip label={row.score} size="small" color="success" /> },
    { id: 'actions', label: 'Actions', align: 'right' as const, render: (row: any) => (
      <Box>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(row.id, 'leaderboard')}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
      </Box>
    )},
  ];

  const columns = (tabIndex === 0 ? achievementColumns : leaderboardColumns) as Column<any>[];

  return (
    <FadeIn>
    <Box>
      <PageHeader title="My Captain" subtitle="Manage achievements and leaderboard" actionLabel={tabIndex === 0 ? 'Add Achievement' : 'Add Entry'} onAction={() => handleOpen()} />
      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 2 }}>
        <Tab label="Achievements" />
        <Tab label="Leaderboard" />
      </Tabs>
      <DataTable
        columns={columns}
        rows={items}
        total={items.length}
        page={0} limit={50}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        loading={isLoading}
        error={isError ? (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load' : null}
        getRowId={(r) => r.id}
      />
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? `Edit ${tabIndex === 0 ? 'Achievement' : 'Entry'}` : `Add ${tabIndex === 0 ? 'Achievement' : 'Entry'}`}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {tabIndex === 0 ? (
            <>
              <TextField fullWidth label="Title" value={formAchievement.title} onChange={(e) => setFormAchievement({ ...formAchievement, title: e.target.value })} sx={{ mb: 2, mt: 1 }} />
              <TextField fullWidth label="Description" value={formAchievement.description} onChange={(e) => setFormAchievement({ ...formAchievement, description: e.target.value })} multiline rows={2} sx={{ mb: 2 }} />
              <TextField fullWidth label="Emoji" value={formAchievement.emoji} onChange={(e) => setFormAchievement({ ...formAchievement, emoji: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Icon URL" value={formAchievement.iconUrl} onChange={(e) => setFormAchievement({ ...formAchievement, iconUrl: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Points" type="number" value={formAchievement.points} onChange={(e) => setFormAchievement({ ...formAchievement, points: parseInt(e.target.value) || 0 })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Order" type="number" value={formAchievement.order} onChange={(e) => setFormAchievement({ ...formAchievement, order: parseInt(e.target.value) || 0 })} sx={{ mb: 2 }} />
              <FormControlLabel control={<Switch checked={formAchievement.isHidden} onChange={(e) => setFormAchievement({ ...formAchievement, isHidden: e.target.checked })} />} label="Hidden" />
            </>
          ) : (
            <>
              <TextField fullWidth label="Player Name" value={formLeaderboard.playerName} onChange={(e) => setFormLeaderboard({ ...formLeaderboard, playerName: e.target.value })} sx={{ mb: 2, mt: 1 }} />
              <TextField fullWidth label="Score" type="number" value={formLeaderboard.score} onChange={(e) => setFormLeaderboard({ ...formLeaderboard, score: parseInt(e.target.value) || 0 })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Rank" type="number" value={formLeaderboard.rank} onChange={(e) => setFormLeaderboard({ ...formLeaderboard, rank: parseInt(e.target.value) || 0 })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Avatar URL" value={formLeaderboard.avatarUrl} onChange={(e) => setFormLeaderboard({ ...formLeaderboard, avatarUrl: e.target.value })} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!deleteId} title={`Delete ${deleteType === 'achievements' ? 'Achievement' : 'Entry'}`} message="Are you sure?" confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} loading={deleteMutation.isPending} destructive />
    </Box>
    </FadeIn>
  );
}
