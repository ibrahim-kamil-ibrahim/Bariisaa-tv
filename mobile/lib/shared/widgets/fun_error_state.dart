import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/styles.dart';

/// Kid-friendly error screen using Bariisaa brand palette.
///
/// Background: cream #FFF7EC · Title: navy #2B3A55 · Body: navy · Button: sunny yellow #FFC53D.
///
/// Shows a friendly mascot, a warm message, and an optional retry button.
/// The raw dio error string is never shown to the child.
class FunErrorState extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  final bool showLoginButton;

  const FunErrorState({
    super.key,
    required this.message,
    this.onRetry,
    this.showLoginButton = false,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 140,
                  height: 140,
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppTheme.creamBg,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 16,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Text('😅', style: TextStyle(fontSize: 72)),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                Text(
                  'Oops!',
                  style: AppStyles.baloo2(
                    fontSize: 32,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.darkNavy,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),

                Text(
                  message,
                  style: textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.darkNavy,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 28),

                if (onRetry != null)
                  Material(
                    color: AppTheme.sunnyYellow,
                    borderRadius: BorderRadius.circular(16),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: onRetry,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 28,
                          vertical: 14,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.refresh,
                              size: 22,
                              color: Color(0xFF2B3A55),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              "Let's try again!",
                              style: AppStyles.nunito(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.darkNavy,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
