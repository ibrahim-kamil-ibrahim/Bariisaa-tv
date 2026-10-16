import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/styles.dart';
import '../domain/auth_state.dart';
import 'auth_cubit.dart';

/// Shows a bottom sheet asking the guest to authenticate.
/// Returns true if the user became authenticated (after signup/login).
Future<bool> requireAuthentication(BuildContext context) async {
  final authState = context.read<AuthCubit>().state;
  if (authState is AuthAuthenticated) return true;

  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _AuthChoiceSheet(),
  );

  return result == true;
}

class _AuthChoiceSheet extends StatelessWidget {
  const _AuthChoiceSheet();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.offWhite,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppTheme.softGrey,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppTheme.sunnyYellow,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.sunnyYellow.withValues(alpha: 0.45),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: const Center(
              child: Text('🔐', style: TextStyle(fontSize: 30)),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Sign in to continue',
            style: AppStyles.baloo2(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppTheme.darkNavy,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            'Create an account to access this feature',
            style: AppStyles.nunito(fontSize: 14, color: AppTheme.charcoal),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.sunnyYellow,
                foregroundColor: AppTheme.deepNavy,
                elevation: 0,
                shadowColor: AppTheme.sunnyYellow.withValues(alpha: 0.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              onPressed: () {
                Navigator.pop(context);
                context.push(AppRoutes.signup);
              },
              child: Text(
                'Create Account',
                style: AppStyles.baloo2(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.deepNavy,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.darkNavy,
                side: const BorderSide(color: AppTheme.darkNavy, width: 1.5),
                backgroundColor: AppTheme.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              onPressed: () {
                Navigator.pop(context);
                context.push(AppRoutes.login);
              },
              child: Text(
                'Sign In',
                style: AppStyles.baloo2(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.darkNavy,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Maybe Later',
              style: AppStyles.nunito(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.silver,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
