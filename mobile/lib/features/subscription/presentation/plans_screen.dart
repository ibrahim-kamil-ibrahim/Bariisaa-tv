import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../presentation/subscription_cubit.dart';
import '../domain/subscription_state.dart';

class PlansScreen extends StatefulWidget {
  const PlansScreen({super.key});

  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  final _couponController = TextEditingController();
  String _selectedGateway = 'telebirr';

  @override
  void initState() {
    super.initState();
    context.read<SubscriptionCubit>().loadPlans();
  }

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      body: BlocConsumer<SubscriptionCubit, SubscriptionState>(
        listener: (context, state) {
          if (state is SubscriptionSuccess) {
            context.push(AppRoutes.paymentSuccess);
          }
          if (state is SubscriptionError) {
            if (state.message.contains('Failed to load')) return;
            context.push(AppRoutes.paymentFailure);
          }
        },
        builder: (context, state) {
          if (state is SubscriptionLoading && state is! PlansLoaded) {
            return const LoadingMascot(message: 'Loading plans...');
          }
          if (state is PlansLoaded) {
            if (state.plans.isEmpty) {
              return FunEmptyState(
                emoji: '📋',
                title: 'No plans available',
                subtitle: 'Check back later for subscription plans',
                action: BigTapButton(
                  onPressed: () => context.read<SubscriptionCubit>().loadPlans(),
                  color: AppTheme.skyBlue,
                  child: Text(
                    'Refresh',
                    style: AppStyles.nunito(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.white,
                    ),
                  ),
                ),
              );
            }
            return RefreshIndicator(
              onRefresh: () async => context.read<SubscriptionCubit>().loadPlans(),
              child: CustomScrollView(
                slivers: [
                  SliverAppBar(
                    pinned: true,
                    expandedHeight: 220,
                    backgroundColor: AppTheme.deepNavy,
                    leading: Padding(
                      padding: const EdgeInsets.all(8),
                      child: GestureDetector(
                        onTap: () => context.pop(),
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: AppTheme.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(
                            Icons.arrow_back_rounded,
                            size: 24,
                            color: AppTheme.white,
                          ),
                        ),
                      ),
                    ),
                    flexibleSpace: FlexibleSpaceBar(
                      background: Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [AppTheme.deepNavy, AppTheme.darkNavy, Color(0xFF2A3A6A)],
                          ),
                        ),
                        child: SafeArea(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(24, 56, 24, 24),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppTheme.sunnyYellow.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: AppTheme.sunnyYellow.withValues(alpha: 0.4)),
                                  ),
                                  child: Text(
                                    'PREMIUM',
                                    style: AppStyles.nunito(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.sunnyYellow,
                                      letterSpacing: 1.5,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'Choose Your Plan',
                                  style: AppStyles.baloo2(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.white,
                                    height: 1.1,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Unlock unlimited access to all audiobooks and e-books',
                                  style: AppStyles.nunito(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.white.withValues(alpha: 0.7),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (state.currentSubscription != null)
                            _buildCurrentSubscription(state.currentSubscription!),
                          ...state.plans.map((plan) => _buildPlanCard(plan, state.currentSubscription)),
                          const SizedBox(height: 16),
                          _buildPaymentSection(),
                          const SizedBox(height: 32),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          }
          if (state is SubscriptionError) {
            return FunErrorState(
              message: state.message,
              onRetry: () => context.read<SubscriptionCubit>().loadPlans(),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildCurrentSubscription(SubscriptionModel sub) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.sunnyYellow, width: 2),
        boxShadow: [
          BoxShadow(
            color: AppTheme.sunnyYellow.withValues(alpha: 0.2),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppTheme.sunnyYellow, AppTheme.softAmber],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.workspace_premium_rounded, color: AppTheme.white, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Current Plan',
                      style: AppStyles.nunito(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.charcoal,
                      ),
                    ),
                    Text(
                      sub.plan.name,
                      style: AppStyles.baloo2(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.darkNavy,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Icon(Icons.access_time_rounded, size: 16, color: AppTheme.charcoal),
              const SizedBox(width: 6),
              Text(
                '${sub.daysRemaining} days remaining',
                style: AppStyles.nunito(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.charcoal,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: sub.daysRemaining / 30.0,
              backgroundColor: AppTheme.softGrey,
              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.sunnyYellow),
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => _showCancelDialog(),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.playfulRed, width: 2),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(
                'Cancel Subscription',
                style: AppStyles.nunito(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.playfulRed,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Cancel Subscription?', style: AppStyles.baloo2(fontSize: 20, fontWeight: FontWeight.w700, color: AppTheme.darkNavy)),
        content: Text('You will lose access to premium features at the end of your billing period.', style: AppStyles.nunito(fontSize: 15, color: AppTheme.charcoal)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Keep Plan', style: AppStyles.nunito(fontWeight: FontWeight.w700, color: AppTheme.charcoal))),
          TextButton(
            onPressed: () { Navigator.pop(ctx); context.read<SubscriptionCubit>().cancelSubscription(); },
            child: Text('Cancel', style: AppStyles.nunito(fontWeight: FontWeight.w700, color: AppTheme.playfulRed)),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCard(SubscriptionPlanModel plan, SubscriptionModel? current) {
    final isSelected = plan.id == current?.plan.id;
    final isPopular = plan.price >= 100;
    final features = _getDisplayFeatures(plan);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isPopular ? AppTheme.sunnyYellow : AppTheme.softGrey,
          width: isPopular ? 2.5 : 1,
        ),
        boxShadow: [
          if (isPopular)
            BoxShadow(
              color: AppTheme.sunnyYellow.withValues(alpha: 0.25),
              blurRadius: 16,
              offset: const Offset(0, 6),
            )
          else
            BoxShadow(
              color: AppTheme.darkNavy.withValues(alpha: 0.06),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
        ],
      ),
      child: Stack(
        children: [
          if (isPopular)
            Positioned(
              top: 0,
              right: 24,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: const BoxDecoration(
                  color: AppTheme.sunnyYellow,
                  borderRadius: BorderRadius.only(bottomLeft: Radius.circular(12), bottomRight: Radius.circular(12)),
                ),
                child: Text(
                  'BEST VALUE',
                  style: AppStyles.nunito(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.darkNavy, letterSpacing: 1),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: isPopular
                            ? const LinearGradient(colors: [AppTheme.sunnyYellow, AppTheme.softAmber])
                            : const LinearGradient(colors: [AppTheme.skyBlue, AppTheme.skyBlueLight]),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Icon(
                        isPopular ? Icons.diamond_rounded : Icons.star_rounded,
                        color: AppTheme.white,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            plan.name,
                            style: AppStyles.baloo2(
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.darkNavy,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${plan.durationMonths} month${plan.durationMonths > 1 ? 's' : ''}',
                            style: AppStyles.nunito(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.charcoal,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          plan.currency,
                          style: AppStyles.nunito(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.charcoal,
                          ),
                        ),
                        Text(
                          plan.price.toStringAsFixed(0),
                          style: AppStyles.baloo2(
                            fontSize: 32,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.darkNavy,
                            height: 1,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const Divider(height: 1, color: AppTheme.softGrey),
                const SizedBox(height: 16),
                ...features.map((f) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          color: f['included'] ? AppTheme.mintGreen.withValues(alpha: 0.15) : AppTheme.playfulRed.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(7),
                        ),
                        child: Icon(
                          f['included'] ? Icons.check_rounded : Icons.close_rounded,
                          size: 14,
                          color: f['included'] ? AppTheme.mintGreen : AppTheme.playfulRed.withValues(alpha: 0.5),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          f['label'],
                          style: AppStyles.nunito(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: f['included'] ? AppTheme.darkNavy : AppTheme.charcoal.withValues(alpha: 0.5),
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: isSelected
                      ? Container(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          decoration: BoxDecoration(
                            color: AppTheme.mintGreen.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: AppTheme.mintGreen, width: 2),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.check_circle_rounded, color: AppTheme.mintGreen, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                'Current Plan',
                                style: AppStyles.nunito(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.mintGreen,
                                ),
                              ),
                            ],
                          ),
                        )
                      : ElevatedButton(
                          onPressed: () => _showSubscribeSheet(plan),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isPopular ? AppTheme.sunnyYellow : AppTheme.skyBlue,
                            foregroundColor: isPopular ? AppTheme.darkNavy : AppTheme.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                          ),
                          child: Text(
                            'Subscribe Now',
                            style: AppStyles.nunito(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: isPopular ? AppTheme.darkNavy : AppTheme.white,
                            ),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Map<String, dynamic>> _getDisplayFeatures(SubscriptionPlanModel plan) {
    final features = <Map<String, dynamic>>[];
    features.add({'label': 'Unlimited access to all content', 'included': true});

    for (final f in plan.features) {
      final lower = f.toLowerCase();
      if (lower == 'unlimited access' || lower == 'unlimitedaccess') continue;
      if (lower.contains('offline')) {
        features.add({'label': 'Offline downloads', 'included': f.toLowerCase().contains('true') || !f.toLowerCase().contains('false')});
      } else if (lower.contains('device')) {
        features.add({'label': f, 'included': true});
      } else if (lower.contains('ad') || lower.contains('free')) {
        features.add({'label': 'Ad-free experience', 'included': f.toLowerCase().contains('true') || !f.toLowerCase().contains('false')});
      } else {
        features.add({'label': f, 'included': true});
      }
    }

    if (!features.any((f) => f['label'].toString().toLowerCase().contains('device'))) {
      features.add({'label': 'Access on multiple devices', 'included': true});
    }

    return features;
  }

  void _showSubscribeSheet(SubscriptionPlanModel plan) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
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
                  _buildGatewayChip('TeleBirr', Icons.phone_android_rounded, 'telebirr', setModalState),
                  const SizedBox(width: 8),
                  _buildGatewayChip('Chapa', Icons.account_balance_wallet_rounded, 'chapa', setModalState),
                  const SizedBox(width: 8),
                  _buildGatewayChip('Stripe', Icons.credit_card_rounded, 'stripe', setModalState),
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
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.sunnyYellow.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline_rounded, size: 18, color: AppTheme.darkNavy),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Ask a grown-up before you pay.',
                        style: AppStyles.nunito(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.darkNavy),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    context.read<SubscriptionCubit>().createSubscription(
                      planId: plan.id,
                      paymentGateway: _selectedGateway,
                      couponCode: _couponController.text.trim().isNotEmpty ? _couponController.text.trim() : null,
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
        ),
      ),
    );
  }

  Widget _buildGatewayChip(String label, IconData icon, String value, StateSetter setModalState) {
    final isSelected = _selectedGateway == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() => _selectedGateway = value);
          setModalState(() => _selectedGateway = value);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.skyBlue.withValues(alpha: 0.1) : AppTheme.offWhite,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? AppTheme.skyBlue : AppTheme.softGrey,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, size: 22, color: isSelected ? AppTheme.skyBlue : AppTheme.charcoal),
              const SizedBox(height: 4),
              Text(
                label,
                style: AppStyles.nunito(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: isSelected ? AppTheme.skyBlue : AppTheme.charcoal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.darkNavy.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppTheme.mintGreen.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.shield_rounded, size: 20, color: AppTheme.mintGreen),
              ),
              const SizedBox(width: 12),
              Text(
                'Secure Payments',
                style: AppStyles.baloo2(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.darkNavy,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'All payments are processed securely. You can cancel anytime.',
            style: AppStyles.nunito(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppTheme.charcoal,
            ),
          ),
        ],
      ),
    );
  }
}
