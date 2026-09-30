import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/styles.dart';

/// Debug-only error overlay for uncaught exceptions in debug builds.
/// Shows the raw exception for developer diagnosis.
/// In release builds, errors are routed to [FunErrorState] with a friendly message.
class DebugErrorScreen extends StatelessWidget {
  final Object error;
  const DebugErrorScreen({super.key, required this.error});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Color(0xFFFF6B6B),
                ),
                const SizedBox(height: 20),
                Text(
                  'Oops! Something went wrong.',
                  style: AppStyles.baloo2(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.darkNavy,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                SelectableText(
                  error.toString(),
                  style: AppStyles.nunito(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.darkNavy.withValues(alpha: 0.7),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
