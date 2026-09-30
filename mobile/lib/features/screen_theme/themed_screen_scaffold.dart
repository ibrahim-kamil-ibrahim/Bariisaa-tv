import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:naik_mobile/core/theme/app_theme.dart';
import 'package:naik_mobile/shared/widgets/app_background.dart';
import '../../core/constants/app_constants.dart';
import '../../core/di/injection.dart';
import 'screen_theme_cubit.dart';
import 'screen_theme_repository.dart';

/// Full-bleed themed background + contextual avatar, driven by `screenKey`.
///
/// Uses the warm kid-friendly cream → sky-blue gradient (code-rendered,
/// always available) as background. Avatar is loaded from the backend when
/// available.
class ThemedScreenScaffold extends StatelessWidget {
  final String screenKey;
  final Widget child;
  final bool showAvatar;

  const ThemedScreenScaffold({
    super.key,
    required this.screenKey,
    required this.child,
    this.showAvatar = true,
  });

  static const String fallbackAvatarAsset =
      'assets/images/theme_avatar_fallback.png';

  @override
  Widget build(BuildContext context) {
    ScreenThemeCubit? cubit;
    bool isWatched = false;
    try {
      cubit = context.watch<ScreenThemeCubit>();
      isWatched = true;
    } catch (_) {
      try {
        if (getIt.isRegistered<ScreenThemeCubit>()) {
          cubit = getIt<ScreenThemeCubit>();
        }
      } catch (_) {
        cubit = null;
      }
    }

    if (cubit != null && !isWatched) {
      return BlocBuilder<ScreenThemeCubit, Map<String, ScreenThemeModel>>(
        bloc: cubit,
        builder: (context, _) {
          final theme = cubit!.themeFor(screenKey);
          return _buildScaffold(theme);
        },
      );
    }

    final theme = cubit?.themeFor(screenKey);
    return _buildScaffold(theme);
  }

  Widget _buildScaffold(ScreenThemeModel? theme) {
    final avatarUrl = theme?.avatarImageUrl;
    final avatarLabel = theme?.avatarLabel;

    return Stack(
      fit: StackFit.expand,
      children: [
        // Soft translucent scrim on
        // top keeps the kid-friendly cards readable over any photo.
        child,

        if (showAvatar)
          Positioned(
            top: 10,
            right: 14,
            child: _buildAvatar(avatarUrl, avatarLabel),
          ),
      ],
    );
  }

  Widget _buildAvatar(String? url, String? label) {
    final resolvedUrl = url != null && url.isNotEmpty
        ? AppConstants.resolveUrl(url)
        : null;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        ClipOval(
          child: SizedBox(
            width: 52,
            height: 52,
            child: resolvedUrl != null
                ? CachedNetworkImage(
                    imageUrl: resolvedUrl,
                    fit: BoxFit.cover,
                    memCacheWidth: 104,
                    memCacheHeight: 104,
                    errorWidget: (_, _, _) => _fallbackAvatar(),
                  )
                : _fallbackAvatar(),
          ),
        ),
        if (label != null && label.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 4),
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
            decoration: BoxDecoration(
              color: AppTheme.darkNavy,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
      ],
    );
  }

  Widget _fallbackAvatar() {
    return Image.asset(
      fallbackAvatarAsset,
      fit: BoxFit.cover,
      errorBuilder: (_, _, _) => Container(
        color: AppTheme.creamBg,
        alignment: Alignment.center,
        child: const Text('🦉', style: TextStyle(fontSize: 26)),
      ),
    );
  }
}
