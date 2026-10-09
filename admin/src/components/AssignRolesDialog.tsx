import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Skeleton,
  Typography,
} from '@mui/material';
import api from '../services/api';
import { useNotificationStore } from '../store/notificationStore';

interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface AssignRolesTarget {
  id: string;
  name: string;
  roleIds: string[];
}

interface AssignRolesDialogProps {
  user: AssignRolesTarget | null;
  onClose: () => void;
}

function extractErrorMessage(err: any): string {
  const data = err?.response?.data;
  const fieldErrors = data?.errors
    ? Object.values(data.errors as Record<string, string[]>)
        .flat()
        .join(' ')
    : '';
  return [data?.message, fieldErrors].filter(Boolean).join(' — ') || 'Failed to assign roles';
}

export default function AssignRolesDialog({ user, onClose }: AssignRolesDialogProps) {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [selected, setSelected] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  const open = !!user;

  const { data: roles, isLoading, isError, error } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then((r) => r.data.data),
    enabled: open,
  });

  useEffect(() => {
    if (user) {
      setSelected(user.roleIds);
      setFormError('');
    }
  }, [user]);

  const assignMutation = useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) => api.put(`/users/${id}/roles`, { roleIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      addNotification('Roles updated', 'success');
      onClose();
    },
    onError: (err: any) => {
      const message = extractErrorMessage(err);
      setFormError(message);
      addNotification(err?.response?.data?.message || 'Failed to assign roles', 'error');
    },
  });

  const toggleRole = (roleId: string) => {
    setSelected((prev) => (prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]));
  };

  const roleList: Role[] = roles || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{user ? `Assign Roles — ${user.name}` : 'Assign Roles'}</DialogTitle>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load roles'}
          </Alert>
        )}
        {isLoading ? (
          <Box sx={{ mt: 1 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="text" width="60%" />
            ))}
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            {roleList.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No roles available
              </Typography>
            )}
            {roleList.map((role) => (
              <FormControlLabel
                key={role.id}
                control={<Checkbox checked={selected.includes(role.id)} onChange={() => toggleRole(role.id)} />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {role.name}
                    </Typography>
                    {role.description && (
                      <Typography variant="caption" color="text.secondary">
                        {role.description}
                      </Typography>
                    )}
                  </Box>
                }
                sx={{ alignItems: 'flex-start', my: 0.5 }}
              />
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => user && assignMutation.mutate({ id: user.id, roleIds: selected })}
          disabled={assignMutation.isPending || isLoading}
          sx={{ borderRadius: 2 }}
        >
          {assignMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
