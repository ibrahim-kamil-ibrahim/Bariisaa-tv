import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../domain/subscription_state.dart';
import 'subscription_cubit.dart';

class PaywallScreen extends StatelessWidget {
  const PaywallScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<SubscriptionCubit>().state;
    final isLocked = state.isLocked;
    final accessTier = state.accessTier;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Subscribe to Bariisaa TV'),
        backgroundColor: AppTheme.deepNavy,
        foregroundColor: AppTheme.white,
      ),
      body: isLocked
          ? _buildLockedState(context, accessTier)
          : _buildAccessGranted(context),
    );
  }

  Widget _buildLockedState(BuildContext context, String accessTier) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.lock_outline_rounded,
              size: 80,
              color: AppTheme.gold.withValues(alpha: 0.8),
            ),
            const SizedBox(height: 24),
            Text(
              'Limited Access',
              style: AppStyles.baloo2(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'To unlock $accessTier content, subscribe to a plan below.',
              style: AppStyles.nunito(
                fontSize: 15,
                color: AppTheme.charcoal,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            _BuildPlansList(),
          ],
        ),
      ),
    );
  }

  Widget _buildAccessGranted(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.check_circle_rounded,
            size: 80,
            color: AppTheme.mintGreen,
          ),
          const SizedBox(height: 24),
          Text(
            'Welcome Back!',
            style: AppStyles.baloo2(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: AppTheme.darkNavy,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'You have access to all available content.',
            style: AppStyles.nunito(
              fontSize: 15,
              color: AppTheme.charcoal,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _BuildPlansList extends StatefulWidget {
  @override
  State<_BuildPlansList> createState() => _BuildPlansListState();
}

class _BuildPlansListState extends State<_BuildPlansList> {
  @override
  void initState() {
    super.initState();
    context.read<SubscriptionCubit>().loadPlans();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SubscriptionCubit, SubscriptionState>(
      builder: (context, state) {
        final plans = state is PlansLoaded
            ? state.plans.cast<SubscriptionPlanModel>()
            : <SubscriptionPlanModel>[];
        if (plans.isEmpty) {
          return const Text('No plans available');
        }
        return Column(
          children: plans.map((plan) => _PlanCard(plan: plan)).toList(),
        );
      },
    );
  }
}

class _PlanCard extends StatelessWidget {
  final SubscriptionPlanModel plan;

  const _PlanCard({required this.plan});

  @override
  Widget build(BuildContext context) {
    final subState = context.watch<SubscriptionCubit>().state;
    final isCurrentlySubscribed = subState is ActiveSubscription &&
        subState.subscription?.plan?.id == plan.id;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        title: Text(
          plan.name,
          style: AppStyles.baloo2(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppTheme.darkNavy,
          ),
        ),
        subtitle: Text(
          '${plan.currency} ${plan.price.toStringAsFixed(0)}/${plan.durationMonths}mo',
          style: AppStyles.nunito(
            fontSize: 13,
            color: AppTheme.charcoal,
          ),
        ),
        trailing: isCurrentlySubscribed
            ? const Icon(Icons.check_circle_rounded, color: AppTheme.mintGreen)
            : ElevatedButton(
                onPressed: () => _subscribeToPlan(context, plan),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.skyBlue,
                  foregroundColor: AppTheme.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
                child: const Text('Subscribe'),
              ),
      ),
    );
  }

  void _subscribeToPlan(BuildContext context, SubscriptionPlanModel plan) {
    context.push(AppRoutes.payment, extra: plan);
  }
}
