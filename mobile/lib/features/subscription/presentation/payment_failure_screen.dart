import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../core/navigation/app_router.dart';

class PaymentFailureScreen extends StatelessWidget {
  final String? errorMessage;

  const PaymentFailureScreen({super.key, this.errorMessage});

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
          'Payment Failed',
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
              const Text('😅', style: TextStyle(fontSize: 100)),
              const SizedBox(height: 24),
              Text(
                errorMessage ?? 'Something went wrong. Please try again.',
                style: AppStyles.nunito(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.creamText,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 36),
              BigTapButton(
                onPressed: () => context.pop(),
                color: AppTheme.playfulRed,
                child: Text(
                  'Try Again',
                  style: AppStyles.nunito(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.white,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              BigTapButton(
                onPressed: () => context.go(AppRoutes.discovery),
                color: AppTheme.softGrey,
                child: Text(
                  'Go to Menu',
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
