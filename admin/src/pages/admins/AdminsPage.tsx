import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Box, Button, Chip, MenuItem, TextField, Typography } from '@mui/material';
import { UserCog } from 'lucide-react';
import DataTable, { Column } from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import AssignRolesDialog, { AssignRolesTarget } from '../../components/AssignRolesDialog';
import api from '../../services/api';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: string;
  avatarUrl?: string | null;
  createdAt: string;
  roles: { role: { id: string; name: string; description?: string } }[];
}

const STATUS_OPTIONS = ['', 'ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED'];

function statusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'success' as const;
    case 'SUSPENDED': return 'warning' as const;
    case 'BLOCKED': return 'error' as const;
    default: return 'default' as const;
  }
}

export default function AdminsPage() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [rolesTarget, setRolesTarget] = useState<AssignRolesTarget | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-users', page, limit, search, status],
    queryFn: () =>
      api
        .get('/users', {
          params: { page: page + 1, limit, search: search || undefined, status: status || undefined },
        })
        .then((r) => r.data),
  });

  const users: AdminUser[] = data?.data || [];

  const columns: Column<AdminUser>[] = [
    {
      id: 'user',
      label: 'User',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={row.avatarUrl || ''} sx={{ width: 36, height: 36 }}>
            {(row.name || row.email || '?').charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
            <Typography variant="caption" color="text.secondary">{row.email}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'roles',
      label: 'Roles',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {row.roles.length === 0 ? (
            <Typography variant="caption" color="text.secondary">No roles</Typography>
          ) : (
            row.roles.map((ur) => <Chip key={ur.role.id} label={ur.role.name} size="small" variant="outlined" />)
          )}
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <Chip label={row.status} size="small" color={statusColor(row.status)} variant="outlined" />,
    },
    { id: 'createdAt', label: 'Joined', render: (row) => <Typography variant="body2">{new Date(row.createdAt).toLocaleDateString()}</Typography> },
    {
      id: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<UserCog size={16} />}
          onClick={() =>
            setRolesTarget({
              id: row.id,
              name: row.name,
              roleIds: row.roles.map((ur) => ur.role.id),
            })
          }
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Assign roles
        </Button>
      ),
    },
  ];

  return (
    <FadeIn>
      <Box>
        <PageHeader title="Admins" subtitle="Manage admin panel access and role assignments" />

        <DataTable
          columns={columns}
          rows={users}
          total={data?.meta?.total || 0}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(0);
          }}
          loading={isLoading}
          error={isError ? (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load users' : null}
          getRowId={(row) => row.id}
          actions={
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 170 }}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option || 'all'} value={option}>
                  {option || 'All Statuses'}
                </MenuItem>
              ))}
            </TextField>
          }
        />

        <AssignRolesDialog user={rolesTarget} onClose={() => setRolesTarget(null)} />
      </Box>
    </FadeIn>
  );
}
