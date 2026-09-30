import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/models/models.dart';
import '../presentation/subscription_cubit.dart';
import '../domain/subscription_state.dart';

class PaymentHistoryScreen extends StatefulWidget {
  const PaymentHistoryScreen({super.key});

  @override
  State<PaymentHistoryScreen> createState() => _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState extends State<PaymentHistoryScreen> {
  @override
  void initState() {
    super.initState();
    context.read<SubscriptionCubit>().loadPaymentHistory();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'Payment History',
      ),
      body: BlocBuilder<SubscriptionCubit, SubscriptionState>(
        builder: (context, state) {
          if (state is SubscriptionLoading) {
            return const LoadingMascot(
              emoji: '⏳',
              message: 'Loading payments...',
            );
          }
          if (state is PaymentHistoryLoaded) {
            if (state.payments.isEmpty) {
              return const FunEmptyState(
                emoji: '📭',
                title: 'No payment history',
                subtitle: 'Your payments will show up here!',
              );
            }
            return RefreshIndicator(
              onRefresh: () async =>
                  context.read<SubscriptionCubit>().loadPaymentHistory(),
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: state.payments.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final payment = state.payments[index];
                  return _buildPaymentCard(payment);
                },
              ),
            );
          }
          if (state is SubscriptionError) {
            return FunErrorState(
              message: state.message,
              onRetry: () =>
                  context.read<SubscriptionCubit>().loadPaymentHistory(),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildPaymentCard(PaymentModel payment) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.cardDecoration(),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _statusColor(payment.status).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              _statusEmoji(payment.status),
              style: const TextStyle(fontSize: 28),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${payment.currency} ${payment.amount.toStringAsFixed(2)}',
                  style: AppStyles.nunito(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.creamText,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${payment.gateway.toUpperCase()} - ${_formatDate(payment.createdAt)}',
                  style: AppStyles.nunito(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.creamText,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: _statusColor(payment.status).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              payment.status.toUpperCase(),
              style: AppStyles.nunito(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: AppTheme.creamText,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'completed':
      case 'success':
        return AppTheme.freshGreen;
      case 'failed':
        return AppTheme.playfulRed;
      case 'pending':
        return AppTheme.sunnyYellow;
      case 'refunded':
        return AppTheme.skyBlue;
      default:
        return AppTheme.softGrey;
    }
  }

  String _statusEmoji(String status) {
    switch (status) {
      case 'completed':
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏳';
      case 'refunded':
        return '🔙';
      default:
        return '📄';
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
