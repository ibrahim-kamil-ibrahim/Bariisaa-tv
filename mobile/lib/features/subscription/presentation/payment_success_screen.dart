import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../core/navigation/app_router.dart';

class PaymentSuccessScreen extends StatelessWidget {
  final String? message;

  const PaymentSuccessScreen({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: AppBar(
        leading: KidsIconButton(
          onTap: () => context.go(AppRoutes.discovery),
          child: const Icon(Icons.arrow_back_rounded, color: AppTheme.darkNavy),
        ),
        title: Text(
          'Payment Successful',
          style: AppStyles.baloo2(
            fontSize: AppTheme.titleSize,
            fontWeight: FontWeight.w700,
            color: AppTheme.darkNavy,
          ),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('🎉', style: TextStyle(fontSize: 100)),
              const SizedBox(height: 24),
              Text(
                message ?? 'Your subscription is now active.',
                style: AppStyles.nunito(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.creamText,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 36),
              BigTapButton(
                onPressed: () => context.go(AppRoutes.discovery),
                color: AppTheme.freshGreen,
                child: Text(
                  'Continue Reading',
                  style: AppStyles.nunito(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
