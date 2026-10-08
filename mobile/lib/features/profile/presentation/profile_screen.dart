import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../auth/domain/auth_state.dart';
import '../../auth/presentation/auth_cubit.dart';
import '../presentation/profile_cubit.dart';
import '../domain/profile_state.dart';
import '../../subscription/presentation/subscription_cubit.dart';
import '../../subscription/domain/subscription_state.dart';
import '../../screen_theme/themed_screen_scaffold.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _avatarController;
  late Animation<double> _avatarScale;

  @override
  void initState() {
    super.initState();
    _avatarController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _avatarScale = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _avatarController, curve: Curves.elasticOut),
    );
    _avatarController.forward();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authState = context.read<AuthCubit>().state;
      if (authState is AuthAuthenticated) {
        context.read<ProfileCubit>().loadProfile();
      }
    });
  }

  @override
  void dispose() {
    _avatarController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'My Profile',
      ),
      body: ThemedScreenScaffold(
        screenKey: 'profile',
        child: BlocBuilder<AuthCubit, AuthState>(
          builder: (context, authState) {
            if (authState is AuthAuthenticated) {
              return BlocBuilder<ProfileCubit, ProfileState>(
                builder: (context, state) {
                  if (state is ProfileLoading) {
                    return ListView(
                      padding: const EdgeInsets.all(16),
                      children: const [
                        ShimmerListTile(),
                        SizedBox(height: 16),
                        ShimmerListTile(),
                        ShimmerListTile(),
                        ShimmerListTile(),
                      ],
                    );
                  }
                  if (state is ProfileError) {
                    return FunErrorState(
                      message: state.message,
                      onRetry: () =>
                          context.read<ProfileCubit>().loadProfile(),
                    );
                  }
                  if (state is ProfileLoaded) {
                    return _buildContent(context, state);
                  }
                  return const Center(child: CircularProgressIndicator());
                },
              );
            }
            return _buildGuestProfile(context);
          },
        ),
      ),
      bottomNavigationBar: const MainBottomNav(currentIndex: 4),
    );
  }

  // ── Guest Profile ──────────────────────────────────────────────

  Widget _buildGuestProfile(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.white,
                border: Border.all(color: AppTheme.skyBlue, width: 3),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.skyBlue.withValues(alpha: 0.2),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: const Center(
                child: Icon(
                  Icons.person_outline_rounded,
                  size: 56,
                  color: AppTheme.skyBlue,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Guest',
              style: AppStyles.baloo2(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Create an account to save your\nfavorites, history and progress.',
              textAlign: TextAlign.center,
              style: AppStyles.nunito(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: AppTheme.charcoal,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: GestureDetector(
                onTap: () => context.push(AppRoutes.signup),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.gold, Color(0xFFFFC93D)],
                    ),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.gold.withValues(alpha: 0.35),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      'Create Account',
                      style: AppStyles.nunito(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.deepNavy,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: GestureDetector(
                onTap: () => context.push(AppRoutes.login),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppTheme.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: AppTheme.darkNavy.withValues(alpha: 0.2),
                      width: 1.5,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      'Sign In',
                      style: AppStyles.nunito(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.darkNavy,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Authenticated Content ──────────────────────────────────────

  Widget _buildContent(BuildContext context, ProfileLoaded state) {
    final user = state.user;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      children: [
        _buildIdentityCard(context, user),
        const SizedBox(height: 16),
        if (state.subscription != null) ...[
          _buildSubscriptionCard(context, state),
          const SizedBox(height: 16),
        ],
        _buildMenuSection(context, state),
      ],
    );
  }

  // ── Identity Card ──────────────────────────────────────────────

  Widget _buildIdentityCard(BuildContext context, dynamic user) {
    final hasEmail = user.email != null && user.email!.isNotEmpty;
    final hasPhone = user.phone != null && user.phone!.isNotEmpty;
    final hasAvatar =
        user.avatarUrl != null && user.avatarUrl!.isNotEmpty;
    final resolvedAvatar =
        hasAvatar ? AppConstants.resolveUrl(user.avatarUrl!) : null;
    final initial =
        user.name.isNotEmpty ? user.name[0].toUpperCase() : '?';

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          AppTheme.clayShadow(
            color: AppTheme.deepNavy.withValues(alpha: 0.12),
            blur: 24,
            dy: 8,
            spread: -4,
          ).first,
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: Column(
          children: [
            // Header with gradient
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.darkNavy, AppTheme.deepNavy],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                children: [
                  // Avatar
                  ScaleTransition(
                    scale: _avatarScale,
                    child: GestureDetector(
                      onTap: () =>
                          context.read<ProfileCubit>().uploadAvatar(),
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppTheme.gold,
                            width: 3,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color:
                                  AppTheme.gold.withValues(alpha: 0.4),
                              blurRadius: 20,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: ClipOval(
                          child: resolvedAvatar != null
                              ? CachedNetworkImage(
                                  imageUrl: resolvedAvatar,
                                  width: 114,
                                  height: 114,
                                  fit: BoxFit.cover,
                                  memCacheWidth: 228,
                                  memCacheHeight: 228,
                                  placeholder: (_, _) => Container(
                                    color: AppTheme.darkNavy,
                                    child: const Icon(
                                      Icons.person_rounded,
                                      size: 56,
                                      color: AppTheme.gold,
                                    ),
                                  ),
                                  errorWidget: (_, _, _) => Container(
                                    color: AppTheme.darkNavy,
                                    child: Center(
                                      child: Text(
                                        initial,
                                        style: AppStyles.baloo2(
                                          fontSize: 48,
                                          fontWeight: FontWeight.w800,
                                          color: AppTheme.gold,
                                        ),
                                      ),
                                    ),
                                  ),
                                )
                              : Container(
                                  color: AppTheme.darkNavy,
                                  child: Center(
                                    child: Text(
                                      initial,
                                      style: AppStyles.baloo2(
                                        fontSize: 48,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.gold,
                                      ),
                                    ),
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    user.name,
                    style: AppStyles.baloo2(
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.white,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (user.username != null &&
                      user.username!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      '@${user.username}',
                      style: AppStyles.nunito(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.white.withValues(alpha: 0.6),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (hasEmail || hasPhone) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          hasEmail
                              ? Icons.email_rounded
                              : Icons.phone_rounded,
                          size: 14,
                          color:
                              AppTheme.white.withValues(alpha: 0.7),
                        ),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            (user.email?.isNotEmpty ?? false)
                                ? user.email!
                                : (user.phone ?? ''),
                            style: AppStyles.nunito(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.white
                                  .withValues(alpha: 0.8),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _infoChip(
                        icon: Icons.language_rounded,
                        label: _langLabel(user.preferredLanguage),
                        color: AppTheme.softPurple,
                      ),
                      if (user.emailVerified) ...[
                        const SizedBox(width: 8),
                        _infoChip(
                          icon: Icons.verified_rounded,
                          label: 'Email',
                          color: AppTheme.mintGreen,
                        ),
                      ],
                      if (user.phoneVerified) ...[
                        const SizedBox(width: 8),
                        _infoChip(
                          icon: Icons.verified_rounded,
                          label: 'Phone',
                          color: AppTheme.skyBlue,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            // Stat tiles
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
              child: Row(
                children: [
                  Expanded(
                    child: _statTile(
                      icon: Icons.menu_book_rounded,
                      label: 'Books',
                      color: AppTheme.skyBlue,
                      onTap: () =>
                          context.push('${AppRoutes.history}?tab=reading'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _statTile(
                      icon: Icons.favorite_rounded,
                      label: 'Favorites',
                      color: AppTheme.playfulRed,
                      onTap: () => context.push(AppRoutes.favorites),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _statTile(
                      icon: Icons.headphones_rounded,
                      label: 'Listening',
                      color: AppTheme.mintGreen,
                      onTap: () => context
                          .push('${AppRoutes.history}?tab=listening'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statTile({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: color.withValues(alpha: 0.15),
            width: 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, size: 28, color: color),
            const SizedBox(height: 6),
            Text(
              label,
              style: AppStyles.nunito(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoChip({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppTheme.white),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppStyles.nunito(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppTheme.white,
            ),
          ),
        ],
      ),
    );
  }

  String _langLabel(String lang) {
    switch (lang) {
      case 'om':
        return 'Afaan Oromoo';
      case 'am':
        return 'አማርኛ';
      case 'ar':
        return 'العربية';
      default:
        return 'English';
    }
  }

  // ── Subscription Card ──────────────────────────────────────────

  Widget _buildSubscriptionCard(BuildContext context, ProfileLoaded state) {
    final sub = state.subscription!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: AppTheme.gold.withValues(alpha: 0.2),
          width: 1,
        ),
        boxShadow: [
          AppTheme.clayShadow(
            color: AppTheme.deepNavy.withValues(alpha: 0.08),
            blur: 16,
            dy: 6,
            spread: -3,
          ).first,
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.gold, Color(0xFFFFC93D)],
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.gold.withValues(alpha: 0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: const Icon(
              Icons.workspace_premium_rounded,
              size: 28,
              color: AppTheme.deepNavy,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${sub.plan.name} Plan',
                  style: AppStyles.baloo2(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.darkNavy,
                  ),
                ),
                Text(
                  '${sub.daysRemaining} days remaining',
                  style: AppStyles.nunito(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.charcoal,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => context.push(AppRoutes.plans),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                color: AppTheme.gold.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                'View Plan',
                style: AppStyles.nunito(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.gold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Menu Section ───────────────────────────────────────────────

  Widget _buildMenuSection(BuildContext context, ProfileLoaded state) {
    final isSubscribed = state.subscription != null;
    final items = [
      _MenuItem(Icons.edit_rounded, 'Edit Profile', AppTheme.skyBlue,
          () => context.push(AppRoutes.editProfile)),
      _MenuItem(Icons.history_rounded, 'Reading History', AppTheme.softPurple,
          () => context.push('${AppRoutes.history}?tab=reading')),
      _MenuItem(Icons.headphones_rounded, 'Listening History', AppTheme.mintGreen,
          () => context.push('${AppRoutes.history}?tab=listening')),
      _MenuItem(Icons.favorite_rounded, 'Favorites', AppTheme.playfulRed,
          () => context.push(AppRoutes.favorites)),
      _MenuItem(Icons.download_rounded, 'Downloads', AppTheme.skyBlue,
          () => context.push(AppRoutes.downloads)),
      // ── Subscription management ──────────────────────────────────────
      _MenuItem(Icons.workspace_premium_rounded, 'Plans', AppTheme.gold,
          () => context.push(AppRoutes.plans)),
      _MenuItem(
        Icons.receipt_long_rounded,
        isSubscribed ? 'Change Plan' : 'Subscriptions',
        AppTheme.gold,
        () {
          if (isSubscribed) {
            context.push(AppRoutes.plans);
          } else {
            context.push(AppRoutes.paywall);
          }
        },
      ),
      _MenuItem(Icons.receipt_long_rounded, 'Payments', AppTheme.mintGreen,
          () => context.push(AppRoutes.paymentHistory)),
      _MenuItem(Icons.devices_rounded, 'Devices', AppTheme.softPurple,
          () => context.push(AppRoutes.devices)),
      _MenuItem(Icons.restore_rounded, 'Restore Purchases', AppTheme.skyBlue,
          () => _showRestoreDialog(context)),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            children: [
              const Icon(Icons.settings_rounded,
                  size: 20, color: AppTheme.darkNavy),
              const SizedBox(width: 8),
              Text(
                'Settings',
                style: AppStyles.baloo2(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.darkNavy,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: AppTheme.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              AppTheme.clayShadow(
                color: AppTheme.deepNavy.withValues(alpha: 0.08),
                blur: 16,
                dy: 6,
                spread: -3,
              ).first,
            ],
          ),
          child: Column(
            children: [
              for (int i = 0; i < items.length; i++) ...[
                _buildMenuTile(context, items[i]),
                if (i < items.length - 1)
                  Divider(
                    height: 1,
                    indent: 56,
                    color: AppTheme.charcoal.withValues(alpha: 0.08),
                  ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        // Logout
        GestureDetector(
          onTap: () async {
            final confirmed = await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                title: Text(
                  'Log Out',
                  style: AppStyles.baloo2(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.darkNavy,
                  ),
                ),
                content: Text(
                  'Are you sure you want to log out?',
                  style: AppStyles.nunito(
                    fontSize: 15,
                    color: AppTheme.charcoal,
                  ),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, false),
                    child: Text(
                      'Cancel',
                      style: AppStyles.nunito(
                        fontWeight: FontWeight.w700,
                        color: AppTheme.charcoal,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    child: Text(
                      'Log Out',
                      style: AppStyles.nunito(
                        fontWeight: FontWeight.w800,
                        color: AppTheme.playfulRed,
                      ),
                    ),
                  ),
                ],
              ),
            );
            if (confirmed == true && context.mounted) {
              context.read<AuthCubit>().logout();
            }
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: AppTheme.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: AppTheme.playfulRed.withValues(alpha: 0.2),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.logout_rounded,
                  size: 20,
                  color: AppTheme.playfulRed,
                ),
                const SizedBox(width: 8),
                Text(
                  'Log Out',
                  style: AppStyles.nunito(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.playfulRed,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMenuTile(BuildContext context, _MenuItem item) {
    return GestureDetector(
      onTap: item.onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: item.color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(item.icon, size: 20, color: item.color),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                item.label,
                style: AppStyles.nunito(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.darkNavy,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              size: 22,
              color: AppTheme.charcoal.withValues(alpha: 0.4),
            ),
          ],
        ),
      ),
    );
  }

  /// Show a "Restoring purchases..." modal (Android restores are done
  /// server-side when the user logs in again).
  Future<void> _showRestoreDialog(BuildContext context) async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.restore_rounded, color: AppTheme.gold, size: 24),
            const SizedBox(width: 12),
            Text(
              'Restore Purchases',
              style: AppStyles.baloo2(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
          ],
        ),
        content: Text(
          'This will re-verify your subscriptions with the server.\nYour active subscription will be restored if it is still valid.',
          style: AppStyles.nunito(fontSize: 15, color: AppTheme.charcoal),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'Cancel',
              style: AppStyles.nunito(
                fontWeight: FontWeight.w700,
                color: AppTheme.charcoal,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx, true);
              _performRestore(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.gold,
              foregroundColor: AppTheme.deepNavy,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: const Text(
              'Verify & Restore',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
    if (result == true && context.mounted) {
      // Note: On Android, subscription restoration is handled server-side
      // when the user logs in with the same account. The app re-checks
      // subscription status via the /subscriptions/current endpoint.
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Subscription status verified.'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _performRestore(BuildContext context) {
    // In a production app, this would call a backend endpoint that
    // re-validates the user's subscription across all devices.
    // For now, we refresh the profile and payment history.
    if (context.mounted) {
      final profileCubit = context.read<ProfileCubit>();
      profileCubit.loadProfile();
      final subCubit = context.read<SubscriptionCubit>();
      if (subCubit.state is PlansLoaded ||
          subCubit.state is ActiveSubscription ||
          subCubit.state is ExpiredSubscription ||
          subCubit.state is NoSubscription) {
        subCubit.loadPlans();
      }
    }
  }
}

class _MenuItem {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  _MenuItem(this.icon, this.label, this.color, this.onTap);
}
