import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Chip, TextField, MenuItem, Grid, Typography } from '@mui/material';
import DataTable, { Column } from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';

const STATUSES = ['All', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];

export default function InvoicesPage() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState('All');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['invoices', page, limit, status],
    queryFn: () => api.get('/invoices', { params: { page: page + 1, limit, status: status === 'All' ? undefined : status } }).then((r) => r.data),
  });

  const invoices = data?.data || [];
  const total = data?.meta?.total || 0;

  const columns: Column<any>[] = [
    { id: 'invoiceNumber', label: 'Invoice #', render: (row) => <Typography variant="body2" fontWeight={500}>{row.invoiceNumber}</Typography> },
    { id: 'user', label: 'User', render: (row) => row.user?.name || '—' },
    { id: 'amount', label: 'Amount', render: (row) => `${row.currency} ${row.amount}` },
    {
      id: 'status',
      label: 'Status',
      render: (row) => (
        <Chip label={row.status} size="small" color={
          row.status === 'PAID' ? 'success' : row.status === 'OVERDUE' ? 'error' : row.status === 'CANCELLED' ? 'default' : 'warning'
        } />
      ),
    },
    { id: 'dueDate', label: 'Due Date', render: (row) => new Date(row.dueDate).toLocaleDateString() },
    { id: 'paidAt', label: 'Paid', render: (row) => row.paidAt ? new Date(row.paidAt).toLocaleDateString() : '—' },
  ];

  const filterBar = (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </Grid>
    </Grid>
  );

  return (
    <FadeIn>
      <Box>
        <PageHeader title="Invoices" subtitle={`${total} total invoices`} />
        {filterBar}
        <DataTable
          columns={columns}
          rows={invoices}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          loading={isLoading}
          error={isError ? (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load invoices' : null}
          getRowId={(r) => r.id}
        />
      </Box>
    </FadeIn>
  );
}
