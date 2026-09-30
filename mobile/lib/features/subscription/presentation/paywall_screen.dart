import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naik_mobile/shared/styles.dart';
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
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _SubscribeSheet(plan: plan),
    );
  }
}

class _SubscribeSheet extends StatefulWidget {
  final SubscriptionPlanModel plan;

  const _SubscribeSheet({required this.plan});

  @override
  State<_SubscribeSheet> createState() => _SubscribeSheetState();
}

class _SubscribeSheetState extends State<_SubscribeSheet> {
  String _selectedGateway = 'telebirr';
  final _couponController = TextEditingController();

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<SubscriptionCubit>();
    final plan = widget.plan;

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
      decoration: const BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.softGrey,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Subscribe to ${plan.name}',
            style: AppStyles.baloo2(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppTheme.darkNavy,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${plan.currency} ${plan.price.toStringAsFixed(0)}/${plan.durationMonths}mo',
            style: AppStyles.nunito(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppTheme.charcoal,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Payment Method',
            style: AppStyles.baloo2(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.darkNavy,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _GatewayChip(
                'TeleBirr',
                Icons.phone_android_rounded,
                'telebirr',
                selected: _selectedGateway == 'telebirr',
                onTap: () => setState(() => _selectedGateway = 'telebirr'),
              ),
              const SizedBox(width: 8),
              _GatewayChip(
                'Chapa',
                Icons.account_balance_wallet_rounded,
                'chapa',
                selected: _selectedGateway == 'chapa',
                onTap: () => setState(() => _selectedGateway = 'chapa'),
              ),
              const SizedBox(width: 8),
              _GatewayChip(
                'Stripe',
                Icons.credit_card_rounded,
                'stripe',
                selected: _selectedGateway == 'stripe',
                onTap: () => setState(() => _selectedGateway = 'stripe'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Coupon Code (optional)',
            style: AppStyles.nunito(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppTheme.darkNavy,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _couponController,
            decoration: InputDecoration(
              hintText: 'Enter coupon code',
              hintStyle: AppStyles.nunito(fontSize: 14, color: AppTheme.charcoal),
              prefixIcon: const Icon(Icons.local_offer_rounded, color: AppTheme.sunnyYellow, size: 20),
              filled: true,
              fillColor: AppTheme.offWhite,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: AppTheme.softGrey),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: AppTheme.softGrey),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppTheme.skyBlue, width: 2),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
            style: AppStyles.nunito(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.darkNavy),
          ),
          const SizedBox(height: 20),
          Text(
            'Ask a grown-up before you pay.',
            style: AppStyles.nunito(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.darkNavy),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                final coupon = _couponController.text.trim();
                cubit.createSubscription(
                  planId: plan.id,
                  paymentGateway: _selectedGateway,
                  couponCode: coupon.isNotEmpty ? coupon : null,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.sunnyYellow,
                foregroundColor: AppTheme.darkNavy,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
              ),
              child: Text(
                'Pay ${plan.currency} ${plan.price.toStringAsFixed(0)}',
                style: AppStyles.nunito(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.darkNavy,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GatewayChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final String value;
  final bool selected;
  final VoidCallback onTap;

  const _GatewayChip(
    this.label,
    this.icon,
    this.value, {
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected
                ? AppTheme.skyBlue.withValues(alpha: 0.1)
                : AppTheme.offWhite,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? AppTheme.skyBlue : AppTheme.softGrey,
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 22,
                color: selected ? AppTheme.skyBlue : AppTheme.charcoal,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: AppStyles.nunito(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: selected ? AppTheme.skyBlue : AppTheme.charcoal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}