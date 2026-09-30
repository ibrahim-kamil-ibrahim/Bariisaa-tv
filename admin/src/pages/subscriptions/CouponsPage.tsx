import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  MenuItem,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormModal from '../../components/FormModal';
import FormTextField from '../../components/FormTextField';
import api from '../../services/api';
import { Coupon } from '../../types';

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Coupon | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formDiscountPercent, setFormDiscountPercent] = useState('0');
  const [formDiscountAmount, setFormDiscountAmount] = useState('0');
  const [formDiscountType, setFormDiscountType] = useState('percent');
  const [formMaxUses, setFormMaxUses] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['coupons', page, limit, search],
    queryFn: () =>
      api.get('/coupons', { params: { page: page + 1, limit, search: search || undefined } }).then((r) => r.data),
  });

  const coupons: Coupon[] = data?.data || data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/coupons', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coupons'] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/coupons/${body.id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coupons'] }); handleClose(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coupons'] }); setDeleteId(null); },
  });

  const handleOpen = (item?: Coupon) => {
    if (item) {
      setEditItem(item);
      setFormCode(item.code);
      if (item.discountPercent > 0) {
        setFormDiscountType('percent');
        setFormDiscountPercent(item.discountPercent.toString());
        setFormDiscountAmount('0');
      } else {
        setFormDiscountType('amount');
        setFormDiscountAmount(item.discountAmount.toString());
        setFormDiscountPercent('0');
      }
      setFormMaxUses(item.maxUses?.toString() || '');
      setFormExpiresAt(item.expiresAt ? item.expiresAt.split('T')[0] : '');
      setFormIsActive(item.isActive);
    } else {
      setEditItem(null);
      setFormCode('');
      setFormDiscountPercent('10');
      setFormDiscountAmount('0');
      setFormDiscountType('percent');
      setFormMaxUses('');
      setFormExpiresAt('');
      setFormIsActive(true);
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditItem(null);
  };

  const handleSave = () => {
    if (!formCode.trim()) { setFormError('Code is required'); return; }
    const body: any = {
      code: formCode.toUpperCase(),
      maxUses: formMaxUses ? parseInt(formMaxUses) : undefined,
      expiresAt: formExpiresAt || undefined,
      isActive: formIsActive,
    };
    if (formDiscountType === 'percent') {
      body.discountPercent = parseInt(formDiscountPercent) || 0;
      body.discountAmount = 0;
    } else {
      body.discountAmount = parseFloat(formDiscountAmount) || 0;
      body.discountPercent = 0;
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, ...body });
    } else {
      createMutation.mutate(body);
    }
  };

  const columns: Column<Coupon>[] = [
    { id: 'code', label: 'Code', render: (row) => <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'mono' }}>{row.code}</Typography> },
    {
      id: 'discount',
      label: 'Discount',
      render: (row) =>
        row.discountPercent > 0 ? `${row.discountPercent}%` : `$${row.discountAmount.toFixed(2)}`,
    },
    { id: 'uses', label: 'Uses', render: (row) => `${row.currentUses || 0}${row.maxUses ? ` / ${row.maxUses}` : ''}` },
    {
      id: 'expires',
      label: 'Expires',
      render: (row) => (row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : 'Never'),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          size="small"
          color={row.isActive ? 'success' : 'default'}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Box>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Coupons"
        subtitle="Manage discount coupons"
        actionLabel="Add Coupon"
        onAction={() => handleOpen()}
      />

      <DataTable
        columns={columns}
        rows={coupons}
        total={data?.meta?.total ?? coupons.length}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        search={search}
        onSearchChange={setSearch}
        loading={isLoading}
        error={isError ? (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load coupons' : null}
        getRowId={(r) => r.id}
      />

      <FormModal
        open={dialogOpen}
        title={editItem ? 'Edit Coupon' : 'Add Coupon'}
        subtitle="Manage discount coupons"
        onClose={handleClose}
        onSubmit={handleSave}
        loading={createMutation.isPending || updateMutation.isPending}
        error={formError || null}
      >
        <FormTextField required label="Code" value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())} autoFocus />
        <FormTextField select label="Discount Type" value={formDiscountType} onChange={(e) => setFormDiscountType(e.target.value)}>
          <MenuItem value="percent">Percentage (%)</MenuItem>
          <MenuItem value="amount">Fixed Amount ($)</MenuItem>
        </FormTextField>
        {formDiscountType === 'percent' ? (
          <FormTextField label="Discount Percent" type="number" value={formDiscountPercent} onChange={(e) => setFormDiscountPercent(e.target.value)} inputProps={{ min: 0, max: 100 }} />
        ) : (
          <FormTextField label="Discount Amount" type="number" value={formDiscountAmount} onChange={(e) => setFormDiscountAmount(e.target.value)} inputProps={{ step: 0.01, min: 0 }} />
        )}
        <FormTextField label="Max Uses" type="number" value={formMaxUses} onChange={(e) => setFormMaxUses(e.target.value)} placeholder="Leave empty for unlimited" />
        <FormTextField label="Expires At" type="date" value={formExpiresAt} onChange={(e) => setFormExpiresAt(e.target.value)} InputLabelProps={{ shrink: true }} />
        <FormControlLabel control={<Switch checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} />} label="Active" />
      </FormModal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
        destructive
      />
    </Box>
  );
}
