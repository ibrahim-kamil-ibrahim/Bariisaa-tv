import { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Typography,
  Grid,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  RotateCcw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { palette, typography } from '../../theme';

interface PaymentUser {
  id: string;
  name: string;
  email: string;
}

interface PaymentPlan {
  name: string;
  durationMonths: number;
}

interface PaymentSubscription {
  plan: PaymentPlan;
}

interface PaymentCoupon {
  code: string;
  discountType: string;
  discountValue: number;
}

interface PaymentRecord {
  id: string;
  userId: string;
  user?: PaymentUser;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  method?: string;
  description?: string;
  metadata?: Record<string, unknown> | null;
  subscription?: PaymentSubscription | null;
  coupon?: PaymentCoupon | null;
  createdAt: string;
  updatedAt: string;
}

function formatAmount(amount: number, currency: string) {
  return `${currency} ${(amount || 0).toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [refundDialog, setRefundDialog] = useState<PaymentRecord | null>(null);
  const [approveDialog, setApproveDialog] = useState<PaymentRecord | null>(null);
  const [rejectDialog, setRejectDialog] = useState<PaymentRecord | null>(null);
  const [approveNote, setApproveNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payments', 'admin', page, limit],
    queryFn: () =>
      api.get('/payments/admin/all', { params: { page, limit } }).then((r) => r.data.data),
  });

  const payments: PaymentRecord[] = data?.payments || [];
  const totalPages = data?.totalPages || data?.pagination?.pages || 1;

  const approveMutation = useMutation({
    mutationFn: ({ paymentId, note }: { paymentId: string; note?: string }) =>
      api.post('/payments/admin/manual/approve', { paymentId, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setApproveDialog(null);
      setApproveNote('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason?: string }) =>
      api.post('/payments/admin/manual/reject', { paymentId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setRejectDialog(null);
      setRejectReason('');
    },
  });

  const handleRefund = async () => {
    if (!refundDialog) return;
    try {
      await api.post('/payments/admin/refund', { paymentId: refundDialog.id });
      refetch();
    } catch (err: any) {
      console.error('Refund failed:', err);
    }
    setRefundDialog(null);
  };

  const handleApprove = () => {
    if (!approveDialog) return;
    approveMutation.mutate({ paymentId: approveDialog.id, note: approveNote || undefined });
  };

  const handleReject = () => {
    if (!rejectDialog) return;
    rejectMutation.mutate({ paymentId: rejectDialog.id, reason: rejectReason || undefined });
  };

  return (
    <Box>
      <PageHeader
        title="Payments"
        subtitle="View and manage all payment transactions"
        actionLabel="Refresh"
        actionIcon={<RefreshCw size={18} />}
        onAction={() => refetch()}
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Box
              key={i}
              sx={{
                height: 52,
                borderRadius: 2,
                bgcolor: palette.warmGrayLight,
                animation: 'pulse 1.5s ease-in-out infinite',
                opacity: 0.6,
                '@keyframes pulse': { '0%, 100%': { opacity: 0.6 }, '50%': { opacity: 0.3 } },
              }}
            />
          ))}
        </Box>
      ) : payments.length === 0 ? (
        <EmptyState
          title="No payments found"
          message="Payment transactions will appear here once users start subscribing."
        />
      ) : (
        <TableContainer
          sx={{
            borderRadius: 2,
            border: `1px solid ${palette.warmGrayLight}`,
            bgcolor: palette.parchment,
            '& .MuiTable-root': { minWidth: 800 },
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={40} />
                <TableCell>User</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <>
                  <TableRow
                    key={payment.id}
                    hover
                    sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }}
                    onClick={() => setExpandedRow(expandedRow === payment.id ? null : payment.id)}
                  >
                    <TableCell>
                      <IconButton size="small" sx={{ color: palette.inkMuted }}>
                        {expandedRow === payment.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {payment.user?.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {payment.user?.email || payment.userId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} fontFamily={typography.mono}>
                        {formatAmount(payment.amount, payment.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={payment.gateway} />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={payment.status} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(payment.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" sx={{ color: palette.inkMuted }}>
                            <ExternalLink size={16} />
                          </IconButton>
                        </Tooltip>
                        {payment.gateway === 'MANUAL' && payment.status === 'PENDING' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                sx={{ color: palette.emerald }}
                                onClick={(e) => { e.stopPropagation(); setApproveDialog(payment); }}
                              >
                                <CheckCircle size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                sx={{ color: palette.coral }}
                                onClick={(e) => { e.stopPropagation(); setRejectDialog(payment); }}
                              >
                                <XCircle size={16} />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {payment.status === 'COMPLETED' && (
                          <Tooltip title="Refund">
                            <IconButton
                              size="small"
                              sx={{ color: palette.coral }}
                              onClick={(e) => { e.stopPropagation(); setRefundDialog(payment); }}
                            >
                              <RotateCcw size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow key={`${payment.id}-detail`}>
                    <TableCell colSpan={7} sx={{ py: 0, borderBottom: expandedRow === payment.id ? undefined : 'none' }}>
                      <Collapse in={expandedRow === payment.id} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 1 }}>
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>Payment ID</Typography>
                              <Typography variant="body2" fontFamily={typography.mono} fontSize={12}>{payment.id}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>Transaction ID</Typography>
                              <Typography variant="body2" fontFamily={typography.mono} fontSize={12}>
                                {payment.gateway === 'STRIPE' ? 'N/A' : payment.id.slice(0, 12)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>Plan</Typography>
                              <Typography variant="body2">
                                {payment.subscription?.plan?.name || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>Coupon</Typography>
                              <Typography variant="body2">
                                {payment.coupon?.code ? `${payment.coupon.code} (${payment.coupon.discountValue}${payment.coupon.discountType === 'PERCENTAGE' ? '%' : ' off'})` : 'None'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>Created</Typography>
                              <Typography variant="body2">{formatDateTime(payment.createdAt)}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>Updated</Typography>
                              <Typography variant="body2">{formatDateTime(payment.updatedAt)}</Typography>
                            </Grid>
                            {payment.gateway === 'MANUAL' && payment.metadata && (
                              <>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Channel</Typography>
                                  <Typography variant="body2">{String(payment.metadata.channel || 'N/A')}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Reference</Typography>
                                  <Typography variant="body2" fontFamily={typography.mono} fontSize={12}>
                                    {String(payment.metadata.reference || 'Not provided')}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Account Name</Typography>
                                  <Typography variant="body2">{String(payment.metadata.accountName || 'N/A')}</Typography>
                                </Grid>
                              </>
                            )}
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ConfirmDialog
        open={!!refundDialog}
        title="Refund Payment"
        message={`Are you sure you want to refund ${refundDialog ? formatAmount(refundDialog.amount, refundDialog.currency) : ''} from ${refundDialog?.user?.name || 'this user'}?`}
        confirmLabel="Refund"
        onConfirm={handleRefund}
        onCancel={() => setRefundDialog(null)}
        destructive
      />

      <Dialog open={!!approveDialog} onClose={() => setApproveDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Approve Manual Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Approving will mark this payment as completed and activate the subscription for{' '}
            <strong>{approveDialog?.user?.name || 'this user'}</strong> ({formatAmount(approveDialog?.amount || 0, approveDialog?.currency || 'USD')}).
          </Typography>
          {approveDialog?.metadata && (
            <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: palette.warmGrayLight }}>
              <Typography variant="caption" fontWeight={600}>Channel: {String(approveDialog.metadata.channel || 'N/A')}</Typography>
              <Typography variant="caption" display="block">Reference: {String(approveDialog.metadata.reference || 'Not provided')}</Typography>
              <Typography variant="caption" display="block">Account: {String(approveDialog.metadata.accountName || 'N/A')}</Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label="Admin note (optional)"
            value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)}
            margin="dense"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setApproveDialog(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            disabled={approveMutation.isPending}
            sx={{ textTransform: 'none', bgcolor: palette.emerald, '&:hover': { bgcolor: '#047857' } }}
          >
            {approveMutation.isPending ? 'Approving…' : 'Approve & Activate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!rejectDialog} onClose={() => setRejectDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Manual Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Rejecting will mark this payment as failed and cancel the pending subscription for{' '}
            <strong>{rejectDialog?.user?.name || 'this user'}</strong>.
          </Typography>
          <TextField
            fullWidth
            label="Rejection reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            margin="dense"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialog(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            disabled={rejectMutation.isPending}
            sx={{ textTransform: 'none', bgcolor: palette.coral, '&:hover': { bgcolor: '#d4553a' } }}
          >
            {rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
