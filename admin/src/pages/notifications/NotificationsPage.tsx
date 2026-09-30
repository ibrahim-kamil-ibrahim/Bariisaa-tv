import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  TextField,
  Grid,
  MenuItem,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('info');
  const [target, setTarget] = useState('all');
  const [userIds, setUserIds] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: notifications, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => api.get('/notifications', { params: { limit: 50 } }).then((r) => r.data.data),
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) => api.post('/notifications/send', data),
    onSuccess: () => {
      setSuccess('Notification sent successfully!');
      setTitle('');
      setBody('');
      setType('info');
      setTarget('all');
      setUserIds('');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Failed to send'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
  });

  const handleSend = () => {
    setError('');
    setSuccess('');
    if (!title.trim() || !body.trim()) {
      setError('Title and Body are required');
      return;
    }
    const payload: any = { title, body, type, target };
    if (target === 'specific') {
      payload.userIds = userIds.split(',').map((s) => s.trim()).filter(Boolean);
      if (payload.userIds.length === 0) {
        setError('Enter at least one User ID');
        return;
      }
    }
    sendMutation.mutate(payload);
  };

  const notificationList: any[] =
    notifications?.notifications || notifications?.data || notifications || [];

  return (
    <Box>
      <PageHeader title="Notifications" subtitle="Send and manage push notifications" />

      <Grid container spacing={3}>
        <FadeIn delay={0}>
          <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Compose Notification
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}
              <TextField
                fullWidth
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                multiline
                rows={4}
                sx={{ mb: 2 }}
              />
              <TextField
                select
                fullWidth
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="promotion">Promotion</MenuItem>
                <MenuItem value="update">Update</MenuItem>
                <MenuItem value="alert">Alert</MenuItem>
              </TextField>
              <TextField
                select
                fullWidth
                label="Target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="all">All Users</MenuItem>
                <MenuItem value="premium">Premium Users</MenuItem>
                <MenuItem value="active">Active Users</MenuItem>
                <MenuItem value="specific">Specific Users</MenuItem>
              </TextField>
              {target === 'specific' && (
                <TextField
                  fullWidth
                  label="User IDs (comma-separated)"
                  value={userIds}
                  onChange={(e) => setUserIds(e.target.value)}
                  placeholder="user_id_1, user_id_2"
                  sx={{ mb: 2 }}
                />
              )}
              <Button
                variant="contained"
                fullWidth
                startIcon={<SendIcon />}
                onClick={handleSend}
                disabled={sendMutation.isPending}
                size="large"
              >
                {sendMutation.isPending ? <Skeleton variant="text" width={100} height={20} color="inherit" /> : 'Send Notification'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        </FadeIn>

        <FadeIn delay={100}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Sent Notifications
              </Typography>
              {isError ? (
                <Alert severity="error">
                  {(queryError as any)?.response?.data?.message || (queryError as any)?.message || 'Failed to load notifications'}
                </Alert>
              ) : isLoading ? (
                <Box>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                      <Skeleton variant="text" width="30%" height={28} />
                      <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 1 }} />
                      <Skeleton variant="text" width="15%" height={28} />
                      <Skeleton variant="text" width="20%" height={28} />
                    </Box>
                  ))}
                </Box>
              ) : notificationList.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No notifications sent yet
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Target</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {notificationList.map((n: any) => (
                        <TableRow key={n.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {n.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={n.type} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{n.target}</TableCell>
                          <TableCell>{new Date(n.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteMutation.mutate(n.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        </FadeIn>
      </Grid>
    </Box>
  );
}
