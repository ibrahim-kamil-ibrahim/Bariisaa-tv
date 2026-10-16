import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../domain/subscription_state.dart';
import 'subscription_cubit.dart';

/// Dedicated payment screen with 3 methods:
///  1. Manual  — bank transfer / mobile money (user submits reference, admin approves)
///  2. Sheet   — Telebirr / Chapa mobile-money checkout sheet
///  3. Stripe  — Stripe Checkout (card)
class PaymentScreen extends StatefulWidget {
  final SubscriptionPlanModel plan;

  const PaymentScreen({super.key, required this.plan});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  int _methodIndex = 0; // 0=Manual, 1=Sheet, 2=Stripe
  String _manualChannel = 'BANK'; // BANK | MOBILE_MONEY
  String _sheetProvider = 'TELEBIRR'; // TELEBIRR | CHAPA
  final _referenceController = TextEditingController();
  final _accountNameController = TextEditingController();
  final _couponController = TextEditingController();

  @override
  void dispose() {
    _referenceController.dispose();
    _accountNameController.dispose();
    _couponController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final plan = widget.plan;

    return BlocConsumer<SubscriptionCubit, SubscriptionState>(
      listener: _onStateChanged,
      builder: (context, state) {
        final isLoading = state is SubscriptionLoading;
        return Scaffold(
          backgroundColor: AppTheme.offWhite,
          appBar: AppBar(
            title: const Text('Payment'),
            backgroundColor: AppTheme.deepNavy,
            foregroundColor: AppTheme.white,
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _PlanSummaryCard(plan: plan),
                const SizedBox(height: 20),
                Text('Choose Payment Method', style: AppStyles.baloo2(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.darkNavy)),
                const SizedBox(height: 12),
                _MethodSelector(selected: _methodIndex, onTap: (i) => setState(() => _methodIndex = i)),
                const SizedBox(height: 16),
                if (_methodIndex == 0) _buildManualSection(),
                if (_methodIndex == 1) _buildSheetSection(),
                if (_methodIndex == 2) _buildStripeSection(),
                const SizedBox(height: 16),
                _buildCouponField(),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isLoading ? null : () => _pay(plan),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.sunnyYellow,
                      foregroundColor: AppTheme.darkNavy,
                      disabledBackgroundColor: AppTheme.sunnyYellow.withValues(alpha: 0.5),
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    ),
                    child: isLoading
                        ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: AppTheme.darkNavy))
                        : Text(
                            'Pay ${plan.currency} ${plan.price.toStringAsFixed(0)}',
                            style: AppStyles.nunito(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.darkNavy),
                          ),
                  ),
                ),
                const SizedBox(height: 12),
                Center(
                  child: Text(
                    'Ask a grown-up before you pay.',
                    style: AppStyles.nunito(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.charcoal),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── Manual section ──────────────────────────────────────────────
  Widget _buildManualSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Send payment to:', style: AppStyles.nunito(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.darkNavy)),
        const SizedBox(height: 10),
        // Channel dropdown
        DropdownButtonFormField<String>(
          initialValue: _manualChannel,
          decoration: InputDecoration(
            labelText: 'Payment channel',
            labelStyle: AppStyles.nunito(fontSize: 13, color: AppTheme.charcoal),
            filled: true,
            fillColor: AppTheme.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.softGrey)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.softGrey)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
          items: const [
            DropdownMenuItem(value: 'BANK', child: Text('Bank Transfer')),
            DropdownMenuItem(value: 'MOBILE_MONEY', child: Text('Mobile Money')),
          ],
          onChanged: (v) => setState(() => _manualChannel = v ?? 'BANK'),
        ),
        const SizedBox(height: 12),
        // Account instructions card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.softGrey),
          ),
          child: _manualChannel == 'BANK'
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _infoRow('Bank', 'CBE Bank'),
                    _infoRow('Account', '1000123456789'),
                    _infoRow('Name', 'Bariisaa TV PLC'),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _infoRow('Provider', 'Telebirr'),
                    _infoRow('Number', '0911000000'),
                    _infoRow('Name', 'Bariisaa TV PLC'),
                  ],
                ),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _accountNameController,
          decoration: InputDecoration(
            labelText: 'Your account name (optional)',
            labelStyle: AppStyles.nunito(fontSize: 13, color: AppTheme.charcoal),
            filled: true,
            fillColor: AppTheme.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.softGrey)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.softGrey)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
          style: AppStyles.nunito(fontSize: 14, color: AppTheme.darkNavy),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _referenceController,
          decoration: InputDecoration(
            labelText: 'Transaction reference / ID',
            hintText: 'e.g. 1234567890',
            labelStyle: AppStyles.nunito(fontSize: 13, color: AppTheme.charcoal),
            hintStyle: AppStyles.nunito(fontSize: 13, color: AppTheme.charcoal),
            filled: true,
            fillColor: AppTheme.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.softGrey)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.softGrey)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
          style: AppStyles.nunito(fontSize: 14, color: AppTheme.darkNavy),
        ),
        const SizedBox(height: 8),
        Text(
          'After sending, enter the reference above. An admin will verify and activate your subscription.',
          style: AppStyles.nunito(fontSize: 12, color: AppTheme.charcoal),
        ),
      ],
    );
  }

  // ── Sheet section (Telebirr / Chapa) ────────────────────────────
  Widget _buildSheetSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Mobile money provider', style: AppStyles.nunito(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.darkNavy)),
        const SizedBox(height: 10),
        Row(
          children: [
            _ProviderChip(
              'Telebirr',
              Icons.phone_android_rounded,
              'TELEBIRR',
              selected: _sheetProvider == 'TELEBIRR',
              onTap: () => setState(() => _sheetProvider = 'TELEBIRR'),
            ),
            const SizedBox(width: 10),
            _ProviderChip(
              'Chapa',
              Icons.account_balance_wallet_rounded,
              'CHAPA',
              selected: _sheetProvider == 'CHAPA',
              onTap: () => setState(() => _sheetProvider = 'CHAPA'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.skyBlue.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.skyBlue.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline_rounded, size: 20, color: AppTheme.skyBlue),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'You will be redirected to the $_sheetProvider checkout page to complete payment.',
                  style: AppStyles.nunito(fontSize: 13, color: AppTheme.darkNavy),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Stripe section ──────────────────────────────────────────────
  Widget _buildStripeSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.softGrey),
      ),
      child: Column(
        children: [
          Icon(Icons.credit_card_rounded, size: 36, color: AppTheme.skyBlue),
          const SizedBox(height: 10),
          Text('Pay with Card via Stripe', style: AppStyles.baloo2(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.darkNavy)),
          const SizedBox(height: 6),
          Text(
            'You will be redirected to Stripe\'s secure checkout to enter your card details.',
            textAlign: TextAlign.center,
            style: AppStyles.nunito(fontSize: 13, color: AppTheme.charcoal),
          ),
        ],
      ),
    );
  }

  // ── Coupon field ────────────────────────────────────────────────
  Widget _buildCouponField() {
    return TextFormField(
      controller: _couponController,
      decoration: InputDecoration(
        labelText: 'Coupon code (optional)',
        labelStyle: AppStyles.nunito(fontSize: 13, color: AppTheme.charcoal),
        prefixIcon: const Icon(Icons.local_offer_rounded, color: AppTheme.sunnyYellow, size: 20),
        filled: true,
        fillColor: AppTheme.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.softGrey)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.softGrey)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      style: AppStyles.nunito(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.darkNavy),
    );
  }

  // ── Pay action ──────────────────────────────────────────────────
  void _pay(SubscriptionPlanModel plan) {
    final cubit = context.read<SubscriptionCubit>();
    final coupon = _couponController.text.trim();

    String gateway;
    switch (_methodIndex) {
      case 0:
        gateway = 'MANUAL';
        break;
      case 1:
        gateway = _sheetProvider;
        break;
      default:
        gateway = 'STRIPE';
    }

    cubit.createSubscription(
      planId: plan.id,
      paymentGateway: gateway,
      couponCode: coupon.isNotEmpty ? coupon : null,
      channel: _methodIndex == 0 ? _manualChannel : null,
      accountName: _methodIndex == 0 && _accountNameController.text.trim().isNotEmpty
          ? _accountNameController.text.trim()
          : null,
      reference: _methodIndex == 0 && _referenceController.text.trim().isNotEmpty
          ? _referenceController.text.trim()
          : null,
    );
  }

  // ── State listener ──────────────────────────────────────────────
  void _onStateChanged(BuildContext context, SubscriptionState state) {
    if (state is PaymentInitiated) {
      if (state.needsWebRedirect) {
        _launchUrl(state.paymentUrl!);
      } else if (state.isManual) {
        _showManualSubmittedDialog();
      }
    } else if (state is SubscriptionError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(state.message), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _showManualSubmittedDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Payment Submitted', style: AppStyles.baloo2(fontSize: 20, fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle_rounded, size: 56, color: AppTheme.mintGreen),
            const SizedBox(height: 12),
            Text(
              'We received your payment reference. An admin will verify it shortly and activate your subscription.',
              textAlign: TextAlign.center,
              style: AppStyles.nunito(fontSize: 14, color: AppTheme.charcoal),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context); // back to paywall
            },
            child: Text('OK', style: AppStyles.nunito(fontWeight: FontWeight.w700, color: AppTheme.skyBlue)),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppStyles.nunito(fontSize: 13, color: AppTheme.charcoal)),
          Text(value, style: AppStyles.nunito(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.darkNavy)),
        ],
      ),
    );
  }
}

// ── Plan summary card ─────────────────────────────────────────────
class _PlanSummaryCard extends StatelessWidget {
  final SubscriptionPlanModel plan;
  const _PlanSummaryCard({required this.plan});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.deepNavy, AppTheme.deepNavy.withValues(alpha: 0.85)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppTheme.gold.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(14)),
            child: Icon(Icons.workspace_premium_rounded, size: 32, color: AppTheme.gold),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(plan.name, style: AppStyles.baloo2(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.white)),
                const SizedBox(height: 2),
                Text(
                  '${plan.durationMonths} month${plan.durationMonths > 1 ? 's' : ''}',
                  style: AppStyles.nunito(fontSize: 13, color: AppTheme.white.withValues(alpha: 0.7)),
                ),
              ],
            ),
          ),
          Text(
            '${plan.currency} ${plan.price.toStringAsFixed(0)}',
            style: AppStyles.baloo2(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.gold),
          ),
        ],
      ),
    );
  }
}

// ── Method selector (Manual / Sheet / Stripe) ─────────────────────
class _MethodSelector extends StatelessWidget {
  final int selected;
  final ValueChanged<int> onTap;
  const _MethodSelector({required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _tab(0, 'Manual', Icons.account_balance_rounded),
        const SizedBox(width: 8),
        _tab(1, 'Sheet', Icons.phone_android_rounded),
        const SizedBox(width: 8),
        _tab(2, 'Stripe', Icons.credit_card_rounded),
      ],
    );
  }

  Widget _tab(int index, String label, IconData icon) {
    final isSelected = selected == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => onTap(index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.skyBlue.withValues(alpha: 0.1) : AppTheme.white,
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
}

// ── Provider chip (Telebirr / Chapa) ──────────────────────────────
class _ProviderChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final String value;
  final bool selected;
  final VoidCallback onTap;

  const _ProviderChip(this.label, this.icon, this.value, {required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? AppTheme.gold.withValues(alpha: 0.12) : AppTheme.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? AppTheme.gold : AppTheme.softGrey,
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, size: 22, color: selected ? AppTheme.gold : AppTheme.charcoal),
              const SizedBox(height: 4),
              Text(
                label,
                style: AppStyles.nunito(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: selected ? AppTheme.gold : AppTheme.charcoal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
