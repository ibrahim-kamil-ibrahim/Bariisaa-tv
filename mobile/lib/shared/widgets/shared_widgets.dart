import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/constants/app_constants.dart';
import '../../core/navigation/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../features/auth/domain/auth_state.dart';
import '../../features/auth/presentation/auth_cubit.dart';
import '../../features/profile/domain/profile_state.dart';
import '../../features/profile/presentation/profile_cubit.dart';

// ═══════════════════════════════════════════════════════════════
//  EXISTING SHIMMER WIDGETS (kept for loading states)
// ═══════════════════════════════════════════════════════════════

class ShimmerLoading extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;
  const ShimmerLoading({
    super.key,
    this.width = double.infinity,
    this.height = 100,
    this.borderRadius = 8,
  });
  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    _animation = Tween<double>(begin: -1.0, end: 2.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) => Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(widget.borderRadius),
          gradient: LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: [
              AppTheme.skyBlue.withValues(alpha: 0.18),
              AppTheme.white,
              AppTheme.skyBlue.withValues(alpha: 0.18),
            ],
            stops: [0.0, _animation.value.clamp(0.0, 1.0), 1.0],
          ),
        ),
      ),
    );
  }
}

class ShimmerBookCard extends StatelessWidget {
  const ShimmerBookCard({super.key});
  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      width: 150,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerLoading(width: 150, height: 200, borderRadius: 20),
          SizedBox(height: 10),
          ShimmerLoading(width: 130, height: 18, borderRadius: 6),
          SizedBox(height: 6),
          ShimmerLoading(width: 90, height: 16, borderRadius: 6),
        ],
      ),
    );
  }
}

class ShimmerListTile extends StatelessWidget {
  const ShimmerListTile({super.key});
  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          ShimmerLoading(width: 64, height: 64, borderRadius: 16),
          SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerLoading(
                  width: double.infinity,
                  height: 20,
                  borderRadius: 6,
                ),
                SizedBox(height: 8),
                ShimmerLoading(width: 150, height: 16, borderRadius: 6),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  KIDS WIDGETS
// ═══════════════════════════════════════════════════════════════

// ── MASCOT ─────────────────────────────────────────────────────
class MascotBubble extends StatelessWidget {
  final String emoji;
  final double size;
  final String? label;
  final Color? backgroundColor;

  const MascotBubble({
    super.key,
    this.emoji = '🦉',
    this.size = 80,
    this.label,
    this.backgroundColor,
  });

  // Pre-set mascots for common states
  static const cheering = MascotBubble(
    emoji: '🎉',
    size: 100,
    label: 'Great job!',
  );
  static const waving = MascotBubble(emoji: '👋', size: 80, label: 'Hi there!');
  static const thinking = MascotBubble(emoji: '🤔', size: 80, label: 'Hmm...');
  static const sleeping = MascotBubble(emoji: '😴', size: 60);
  static const listening = MascotBubble(
    emoji: '🎧',
    size: 80,
    label: 'Listening...',
  );
  static const reading = MascotBubble(
    emoji: '📖',
    size: 80,
    label: 'Reading time!',
  );
  static const oops = MascotBubble(emoji: '😅', size: 90, label: 'Oops!');
  static const empty = MascotBubble(
    emoji: '📭',
    size: 90,
    label: 'Nothing here yet!',
  );
  static const loading = MascotBubble(emoji: '⏳', size: 60);

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size * 1.2,
          height: size * 1.2,
          decoration: BoxDecoration(
            color:
                backgroundColor ?? AppTheme.sunnyYellow.withValues(alpha: 0.2),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppTheme.sunnyYellow.withValues(alpha: 0.25),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Center(
            child: Text(emoji, style: TextStyle(fontSize: size * 0.7)),
          ),
        ),
        if (label != null) ...[
          const SizedBox(height: 12),
          Text(
            label!,
            style: AppStyles.nunito(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppTheme.darkNavy,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }
}

// ── CLAY AVATAR ────────────────────────────────────────────────
/// Clay-style mascot avatar. Resolution order:
///   1. Admin-uploaded avatar (`imageUrl` from ScreenTheme) — the admin
///      can change it from Screen Appearance without a new app release.
///   2. Bundled clay asset (`assets/images/mascot_avatar.png`).
///   3. Emoji mascot bubble (always available).
class ClayAvatar extends StatelessWidget {
  final double size;
  final String fallbackEmoji;
  final Color? backgroundColor;
  final String? imageUrl;

  const ClayAvatar({
    super.key,
    this.size = 140,
    this.fallbackEmoji = '🦉',
    this.backgroundColor,
    this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: AppConstants.resolveUrl(imageUrl!),
        width: size,
        height: size,
        fit: BoxFit.contain,
        memCacheWidth: size.toInt(),
        memCacheHeight: size.toInt(),
        maxWidthDiskCache: (size * 1.5).toInt(),
        fadeInDuration: Duration.zero,
        fadeOutDuration: Duration.zero,
        placeholder: (context, url) => _bundledAvatar(),
        errorWidget: (context, url, error) => _bundledAvatar(),
      );
    }
    return _bundledAvatar();
  }

  Widget _bundledAvatar() {
    return Image.asset(
      'assets/images/mascot_avatar.png',
      width: size,
      height: size,
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) => MascotBubble(
        emoji: fallbackEmoji,
        size: size * 0.75,
        backgroundColor: backgroundColor,
      ),
    );
  }
}

// ── ANIMATED LOGO (Flutter-native, no video dependency) ────────
/// Lightweight logo widget with a gentle scale+opacity pulse.
/// Replaces the previous VideoPlayerController-backed implementation
/// that caused repeated ExoPlayer failures and 540-frame startup jank.
class AnimatedLogo extends StatefulWidget {
  final double size;

  /// When true the pulse animation repeats indefinitely.
  final bool loop;
  final bool showFallback;

  const AnimatedLogo({
    super.key,
    this.size = 100,
    this.loop = false,
    this.showFallback = true,
  });

  @override
  State<AnimatedLogo> createState() => _AnimatedLogoState();
}

class _AnimatedLogoState extends State<AnimatedLogo>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    );

    _scale = Tween<double>(
      begin: 1.0,
      end: 1.08,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
    _opacity = Tween<double>(
      begin: 0.85,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

    if (widget.loop) {
      _controller.repeat(reverse: true);
    } else {
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) => Transform.scale(
        scale: _scale.value,
        child: Opacity(opacity: _opacity.value, child: child),
      ),
      child: Image.asset(
        'assets/images/logo.png',
        width: widget.size,
        height: widget.size,
        fit: BoxFit.contain,
        errorBuilder: (_, _, _) => Text(
          'B',
          style: TextStyle(
            fontSize: widget.size * 0.5,
            fontWeight: FontWeight.w700,
            color: AppTheme.gold,
          ),
        ),
      ),
    );
  }
}

// ── BIG TAP BUTTON ─────────────────────────────────────────────
class BigTapButton extends StatefulWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final Color color;
  final double height;
  final double borderRadius;
  final EdgeInsets padding;

  const BigTapButton({
    super.key,
    required this.child,
    this.onPressed,
    this.color = AppTheme.skyBlue,
    this.height = 64,
    this.borderRadius = 22,
    this.padding = const EdgeInsets.symmetric(horizontal: 32, vertical: 18),
  });

  @override
  State<BigTapButton> createState() => _BigTapButtonState();
}

class _BigTapButtonState extends State<BigTapButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.93,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => widget.onPressed != null ? _controller.forward() : null,
      onTapUp: (_) {
        if (widget.onPressed != null) {
          _controller.reverse();
          widget.onPressed!();
        }
      },
      onTapCancel: () => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            height: widget.height,
            padding: widget.padding,
            decoration: AppTheme.funButtonDecoration(
              widget.onPressed != null ? widget.color : AppTheme.softGrey,
            ),
            child: FittedBox(fit: BoxFit.scaleDown, child: widget.child),
          ),
        ),
      ),
    );
  }
}

// ── BOOK CARD (Kids version) ───────────────────────────────────
class KidsBookCard extends StatelessWidget {
  final String title;
  final String? coverUrl;
  final String? authorName;
  final double? rating;
  final double? progress;
  final VoidCallback onTap;
  final bool isAudio;

  const KidsBookCard({
    super.key,
    required this.title,
    this.coverUrl,
    this.authorName,
    this.rating,
    this.progress,
    required this.onTap,
    this.isAudio = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final w = constraints.hasBoundedWidth ? constraints.maxWidth : 150.0;
          return SizedBox(
            width: w,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 4,
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.textShadow,
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          CachedNetworkImage(
                            imageUrl: coverUrl != null ? AppConstants.resolveUrl(coverUrl!) : '',
                            fit: BoxFit.cover,
                            memCacheWidth: w.toInt(),
                            memCacheHeight: (w * 1.5).toInt(),
                            maxWidthDiskCache: (w * 2).toInt(),
                            fadeInDuration: Duration.zero,
                            fadeOutDuration: Duration.zero,
                            placeholder: (_, _) => Container(
                              color: AppTheme.textMuted,
                              child: Center(
                                child: Icon(
                                  Icons.auto_stories,
                                  size: 48,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                            ),
                            errorWidget: (_, _, _) => Container(
                              color: AppTheme.textMuted,
                              child: Center(
                                child: Icon(
                                  Icons.auto_stories,
                                  size: 48,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                            ),
                          ),
                          if (isAudio)
                            Positioned(
                              top: 8,
                              right: 8,
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: AppTheme.sunnyYellow,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black26,
                                      blurRadius: 4,
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.headphones,
                                  size: 20,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                            ),
                          if (progress != null && progress! > 0)
                            Positioned(
                              bottom: 0,
                              left: 0,
                              right: 0,
                              child: Container(
                                height: 4,
                                decoration: BoxDecoration(
                                  color: AppTheme.softGrey.withValues(
                                    alpha: 0.3,
                                  ),
                                  borderRadius: const BorderRadius.vertical(
                                    bottom: Radius.circular(20),
                                  ),
                                ),
                                child: FractionallySizedBox(
                                  alignment: Alignment.centerLeft,
                                  widthFactor: progress!.clamp(0.0, 1.0),
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: AppTheme.freshGreen,
                                      borderRadius: const BorderRadius.vertical(
                                        bottom: Radius.circular(20),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          title,
                          style: AppStyles.nunito(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textSecondary,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (authorName != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            authorName!,
                            style: AppStyles.nunito(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textMuted,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        if (rating != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              ...List.generate(
                                5,
                                (i) => Icon(
                                  i < rating!.round()
                                      ? Icons.star_rounded
                                      : Icons.star_outline,
                                  size: 14,
                                  color: AppTheme.sunnyYellow,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

// ── BOOK LIST TILE (single-column list row) ────────────────────
class BookListTile extends StatelessWidget {
  final String title;
  final String? coverUrl;
  final String? authorName;
  final double? rating;
  final bool isAudio;
  final VoidCallback onTap;

  const BookListTile({
    super.key,
    required this.title,
    this.coverUrl,
    this.authorName,
    this.rating,
    this.isAudio = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: AppTheme.cardDecoration(),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: SizedBox(
                width: 64,
                height: 84,
                child: CachedNetworkImage(
                  imageUrl: coverUrl != null ? AppConstants.resolveUrl(coverUrl!) : '',
                  fit: BoxFit.cover,
                  memCacheWidth: 64,
                  memCacheHeight: 84,
                  maxWidthDiskCache: 96,
                  fadeInDuration: Duration.zero,
                  fadeOutDuration: Duration.zero,
                  placeholder: (context, url) => Container(
                    color: AppTheme.textMuted,
                    child: const Icon(
                      Icons.auto_stories,
                      size: 32,
                      color: AppTheme.white,
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: AppTheme.textMuted,
                    child: const Icon(
                      Icons.auto_stories,
                      size: 32,
                      color: AppTheme.white,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    style: AppStyles.baloo2(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textSecondary,
                      height: 1.15,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (authorName != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      authorName!,
                      style: AppStyles.nunito(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textMuted,
                        height: 1.15,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      if (rating != null) ...[
                        ...List.generate(
                          5,
                          (i) => Icon(
                            i < rating!.round()
                                ? Icons.star_rounded
                                : Icons.star_outline,
                            size: 14,
                            color: AppTheme.sunnyYellow,
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      if (isAudio)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.sunnyYellow,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.headphones,
                                size: 12,
                                color: AppTheme.textSecondary,
                              ),
                              const SizedBox(width: 3),
                              Text(
                                'Audio',
                                style: AppStyles.nunito(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right_rounded, color: AppTheme.softGrey),
          ],
        ),
      ),
    );
  }
}

// ── CATEGORY BLOB ──────────────────────────────────────────────
class CategoryBlob extends StatelessWidget {
  final IconData? icon;
  final String? emoji;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const CategoryBlob({
    super.key,
    this.icon,
    this.emoji,
    required this.label,
    this.color = AppTheme.skyBlue,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: AppTheme.blobDecoration(color),
            child: Center(
              child: emoji != null
                  ? Text(emoji!, style: const TextStyle(fontSize: 32))
                  : Icon(icon, size: 34, color: AppTheme.white),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: AppStyles.nunito(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

// ── FUN SECTION HEADER ─────────────────────────────────────────
class FunSectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback? onSeeAll;
  final Color iconColor;

  const FunSectionHeader({
    super.key,
    required this.icon,
    required this.title,
    this.onSeeAll,
    this.iconColor = AppTheme.skyBlue,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 22, color: iconColor),
          ),
          const SizedBox(width: 12),
          Text(
            title,
            style: AppStyles.baloo2(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppTheme.textSecondary,
            ),
          ),
          const Spacer(),
          if (onSeeAll != null)
            GestureDetector(
              onTap: onSeeAll,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.skyBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'All',
                      style: AppStyles.nunito(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.skyBlue,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.arrow_forward_ios,
                      size: 12,
                      color: AppTheme.skyBlue,
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── FUN EMPTY STATE ────────────────────────────────────────────
class FunEmptyState extends StatelessWidget {
  final String emoji;
  final String title;
  final String? subtitle;
  final Widget? action;

  const FunEmptyState({
    super.key,
    this.emoji = '📭',
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 72)),
            const SizedBox(height: 16),
            Text(
              title,
              style: AppStyles.baloo2(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: AppStyles.nunito(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.darkNavy,
                ),
                textAlign: TextAlign.center,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            if (action != null) ...[const SizedBox(height: 24), action!],
            if (action == null && subtitle == null) ...[
              const SizedBox(height: 20),
              BigTapButton(
                onPressed: () {},
                color: AppTheme.white,
                height: 48,
                child: Text(
                  'Tell a grown-up to add more',
                  style: AppStyles.nunito(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.darkNavy,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── FUN ERROR STATE ────────────────────────────────────────────
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
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('😅', style: TextStyle(fontSize: 72)),
            const SizedBox(height: 12),
            Text(
              'Oops!',
              style: AppStyles.baloo2(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: AppStyles.nunito(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.darkNavy,
              ),
              textAlign: TextAlign.center,
              maxLines: 4,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 20),
            if (onRetry != null)
              BigTapButton(
                onPressed: onRetry,
                color: AppTheme.sunnyYellow,
                height: 52,
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.refresh,
                      size: 22,
                      color: AppTheme.darkNavy,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "Let's try again!",
                      style: AppStyles.nunito(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.darkNavy,
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
}

// ── LOADING MASCOT ─────────────────────────────────────────────
class LoadingMascot extends StatefulWidget {
  final String emoji;
  final String? message;
  const LoadingMascot({super.key, this.emoji = '⏳', this.message});
  @override
  State<LoadingMascot> createState() => _LoadingMascotState();
}

class _LoadingMascotState extends State<LoadingMascot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _bounce;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
    _bounce = Tween<double>(
      begin: 0,
      end: -12,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedBuilder(
            animation: _bounce,
            builder: (context, child) => Transform.translate(
              offset: Offset(0, _bounce.value),
              child: Text(widget.emoji, style: const TextStyle(fontSize: 64)),
            ),
          ),
          if (widget.message != null) ...[
            const SizedBox(height: 16),
            Text(
              widget.message!,
              style: AppStyles.nunito(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.textMuted,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── PROGRESS BADGE ─────────────────────────────────────────────
class ProgressBadge extends StatelessWidget {
  final double progress;
  final double size;

  const ProgressBadge({super.key, required this.progress, this.size = 56});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              strokeWidth: 5,
              backgroundColor: AppTheme.softGrey,
              valueColor: const AlwaysStoppedAnimation<Color>(
                AppTheme.successGreen,
              ),
            ),
          ),
          Text(
            progress >= 1.0 ? '⭐' : '${(progress * 100).toInt()}%',
            style: AppStyles.nunito(
              fontSize: progress >= 1.0 ? size * 0.5 : size * 0.3,
              fontWeight: FontWeight.w800,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

// ── PARENT GATE ────────────────────────────────────────────────
class ParentGate extends StatefulWidget {
  final Widget child;
  final String gateTitle;
  final String gateSubtitle;

  const ParentGate({
    super.key,
    required this.child,
    this.gateTitle = 'Parents Only',
    this.gateSubtitle = 'Ask a grown-up to help you access this section',
  });

  @override
  State<ParentGate> createState() => _ParentGateState();
}

class _ParentGateState extends State<ParentGate>
    with SingleTickerProviderStateMixin {
  bool _unlocked = false;
  int _mathAnswer = 0;
  int _mathCorrectAnswer = 0;
  final _answerController = TextEditingController();
  String? _mathError;

  @override
  void initState() {
    super.initState();
    _generateMathQuestion();
  }

  void _generateMathQuestion() {
    final a = DateTime.now().millisecondsSinceEpoch % 10 + 3;
    final b = DateTime.now().millisecondsSinceEpoch % 8 + 2;
    _mathAnswer = a + b;
    _mathCorrectAnswer = _mathAnswer;
    _answerController.clear();
    _mathError = null;
  }

  bool verify(String text) {
    final answer = int.tryParse(text.trim());
    if (answer == null) return false;
    return answer == _mathCorrectAnswer;
  }

  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_unlocked) return widget.child;

    final bVal = (DateTime.now().millisecondsSinceEpoch % 8 + 2).toInt();
    final aVal = _mathCorrectAnswer - bVal;

    return Theme(
      data: AppTheme.parentTheme(),
      child: Scaffold(
        appBar: AppBar(title: const Text('Parents Only')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: AppTheme.parentMuted.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.lock_outline,
                    size: 48,
                    color: AppTheme.parentText,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  widget.gateTitle,
                  style: AppStyles.nunito(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.parentText,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.gateSubtitle,
                  style: AppStyles.nunito(
                    fontSize: 16,
                    color: AppTheme.parentMuted,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                Text(
                  'What is $aVal + $bVal?',
                  style: AppStyles.nunito(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.parentText,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _answerController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    hintText: 'Answer',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    errorText: _mathError,
                  ),
                  textAlign: TextAlign.center,
                  style: AppStyles.nunito(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    if (verify(_answerController.text)) {
                      setState(() => _unlocked = true);
                    } else {
                      setState(() {
                        _mathError = 'Wrong answer, try again';
                        _generateMathQuestion();
                      });
                    }
                  },
                  child: const Text('Unlock'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── SHELF ROW (horizontal scrollable shelf) ────────────────────
class ShelfRow extends StatelessWidget {
  final List<Widget> children;
  final double itemWidth;
  final double itemHeight;

  const ShelfRow({
    super.key,
    required this.children,
    this.itemWidth = 150,
    this.itemHeight = 260,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: itemHeight,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: children.length,
        itemBuilder: (context, index) => Padding(
          padding: const EdgeInsets.only(right: 14),
          child: children[index],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  BACKWARD-COMPATIBLE ALIASES (old widget names → new)
// ═══════════════════════════════════════════════════════════════

class BookCard extends KidsBookCard {
  const BookCard({
    super.key,
    required super.title,
    super.coverUrl,
    super.authorName,
    super.rating,
    required super.onTap,
  });
}

class SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onSeeAll;
  const SectionHeader({super.key, required this.title, this.onSeeAll});
  @override
  Widget build(BuildContext context) {
    return FunSectionHeader(
      icon: Icons.auto_stories,
      title: title,
      onSeeAll: onSeeAll,
      iconColor: AppTheme.skyBlue,
    );
  }
}

class EmptyStateWidget extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;
  const EmptyStateWidget({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });

  static String _iconToEmoji(IconData i) {
    if (i == Icons.category) return '📚';
    if (i == Icons.search_off) return '🔍';
    if (i == Icons.favorite) return '💛';
    if (i == Icons.favorite_outline) return '💛';
    if (i == Icons.favorite_border) return '💛';
    if (i == Icons.history) return '📖';
    if (i == Icons.download_outlined) return '📥';
    if (i == Icons.notifications) return '🔔';
    if (i == Icons.notifications_none) return '🔔';
    if (i == Icons.bookmark_border) return '🔖';
    if (i == Icons.error_outline) return '😅';
    if (i == Icons.store) return '📚';
    return '📭';
  }

  @override
  Widget build(BuildContext context) {
    return FunEmptyState(
      emoji: _iconToEmoji(icon),
      title: title,
      subtitle: subtitle,
      action: action,
    );
  }
}

class ErrorStateWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const ErrorStateWidget({
    super.key,
    required this.message,
    required this.onRetry,
  });
  @override
  Widget build(BuildContext context) =>
      FunErrorState(message: message, onRetry: onRetry);
}

// ── MINI PLAYER ────────────────────────────────────────────────
class KidsMiniPlayer extends StatelessWidget {
  final String title;
  final String? coverUrl;
  final bool isPlaying;
  final VoidCallback onTap;
  final VoidCallback onPlayPause;

  const KidsMiniPlayer({
    super.key,
    required this.title,
    this.coverUrl,
    required this.isPlaying,
    required this.onTap,
    required this.onPlayPause,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.white,
          boxShadow: [
            BoxShadow(
              color: AppTheme.textShadow,
              blurRadius: 12,
              offset: const Offset(0, -4),
            ),
          ],
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 6)],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: CachedNetworkImage(
                    imageUrl: coverUrl != null ? AppConstants.resolveUrl(coverUrl!) : '',
                    fit: BoxFit.cover,
                    memCacheWidth: 52,
                    memCacheHeight: 52,
                    maxWidthDiskCache: 78,
                    fadeInDuration: Duration.zero,
                    fadeOutDuration: Duration.zero,
                    placeholder: (_, _) => Container(color: Colors.white24),
                    errorWidget: (_, _, _) => Container(
                      color: Colors.white24,
                      child: const Icon(
                        Icons.auto_stories,
                        size: 28,
                        color: Colors.white54,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  title,
                  style: AppStyles.nunito(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.darkNavy,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: onPlayPause,
                child: Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: AppTheme.sunnyYellow,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isPlaying ? Icons.pause : Icons.play_arrow,
                    size: 34,
                    color: AppTheme.deepNavy,
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

// ═══════════════════════════════════════════════════════════════
//  CLAYMORPHISM BUILDING BLOCKS (Kidtopia style)
// ═══════════════════════════════════════════════════════════════

// ── CLAY GRADIENT BACKGROUND ───────────────────────────────────
class ClayBackground extends StatelessWidget {
  final Widget child;
  final bool hero;
  const ClayBackground({super.key, required this.child, this.hero = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: hero
            ? AppTheme.heroGradient()
            : AppTheme.backgroundGradient(),
      ),
      child: child,
    );
  }
}

// ── CLAY HERO HEADER (Kidtopia gradient hero) ──────────────────
class ClayHeroHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String emoji;
  const ClayHeroHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.emoji = '🦁',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
      decoration: BoxDecoration(
        gradient: AppTheme.heroGradient(),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(36)),
      ),
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppTheme.white.withValues(alpha: 0.22),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.white.withValues(alpha: 0.15),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Center(
                child: Text(emoji, style: const TextStyle(fontSize: 34)),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppStyles.baloo2(
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.white,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: AppStyles.nunito(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.white.withValues(alpha: 0.85),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── CLAY CARD (soft clay shadow container) ─────────────────────
class ClayCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  const ClayCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding,
        decoration: AppTheme.cardDecoration(),
        child: child,
      ),
    );
  }
}

// ── PILL SEARCH BAR (claymorphism) ─────────────────────────────
class PillSearchBar extends StatelessWidget {
  final TextEditingController controller;
  final String hintText;
  final ValueChanged<String>? onSubmitted;
  final VoidCallback? onClear;
  final ValueChanged<String>? onChanged;
  const PillSearchBar({
    super.key,
    required this.controller,
    this.hintText = 'Search...',
    this.onSubmitted,
    this.onClear,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: AppTheme.cardDecoration(),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        onSubmitted: onSubmitted,
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: AppStyles.nunito(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppTheme.textMuted,
          ),
          prefixIcon: const Padding(
            padding: EdgeInsets.all(14),
            child: Text('🔍', style: TextStyle(fontSize: 20)),
          ),
          suffixIcon: controller.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(
                    Icons.close,
                    size: 20,
                    color: AppTheme.textMuted,
                  ),
                  onPressed: onClear,
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }
}

// ── BADGED SECTION HEADER (🔥 Top / ✨ New) ─────────────────────
class BadgedSectionHeader extends StatelessWidget {
  final String emoji;
  final String title;
  final VoidCallback? onSeeAll;
  const BadgedSectionHeader({
    super.key,
    required this.emoji,
    required this.title,
    this.onSeeAll,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 0, 4, 12),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 22)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: AppStyles.baloo2(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
          if (onSeeAll != null)
            GestureDetector(
              onTap: onSeeAll,
              child: Text(
                'See all',
                style: AppStyles.nunito(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.skyBlue,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── RANK BADGE (1, 2, 3…) for "Top" shelves ────────────────────
class RankBadge extends StatelessWidget {
  final int rank;
  const RankBadge({super.key, required this.rank});

  @override
  Widget build(BuildContext context) {
    final Color bg;
    final Color fg;
    if (rank == 1) {
      bg = AppTheme.gold;
      fg = AppTheme.deepPurple;
    } else if (rank == 2) {
      bg = AppTheme.silver;
      fg = AppTheme.deepNavy;
    } else if (rank == 3) {
      bg = AppTheme.sectionPurple;
      fg = AppTheme.textDark;
    } else {
      bg = AppTheme.sectionPurple.withValues(alpha: 0.25);
      fg = AppTheme.textDark;
    }
    return Container(
      width: 28,
      height: 28,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: bg,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        '$rank',
        style: AppStyles.nunito(
          fontSize: 13,
          fontWeight: FontWeight.w800,
          color: fg,
        ),
      ),
    );
  }
}

// ── KIDS ICON BUTTON (56dp target · press-bounce · tap glow) ────
/// A kid-friendly tappable icon: guaranteed 56dp hit area, a bouncy
/// press scale, and a soft glow that blooms behind the icon on tap.
/// Drop-in replacement for `IconButton` for any icon a child presses.
class KidsIconButton extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final Color glowColor;
  final double size;
  final String? tooltip;
  final String? avatarImageUrl;
  final String fallbackEmoji;
  final Color? softCircleBg;

  const KidsIconButton({
    super.key,
    required this.child,
    this.onTap,
    this.glowColor = AppTheme.sunnyYellow,
    this.size = AppTheme.minTapSize,
    this.tooltip,
    this.avatarImageUrl,
    this.fallbackEmoji = '🦉',
    this.softCircleBg,
  });

  @override
  State<KidsIconButton> createState() => _KidsIconButtonState();
}

class _KidsIconButtonState extends State<KidsIconButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scale = Tween<double>(
      begin: 1.0,
      end: 0.82,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final button = GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap?.call();
      },
      onTapCancel: () => _controller.reverse(),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: widget.size,
        height: widget.size,
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) => Stack(
            alignment: Alignment.center,
            children: [
              if (widget.softCircleBg != null)
                Container(
                  width: widget.size,
                  height: widget.size,
                  decoration: BoxDecoration(
                    color: widget.softCircleBg,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: widget.softCircleBg!.withValues(alpha: 0.35),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                ),
              // Soft glow that blooms behind the icon on press.
              Container(
                width: widget.size,
                height: widget.size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      widget.glowColor.withValues(
                        alpha: 0.5 * _controller.value,
                      ),
                      widget.glowColor.withValues(alpha: 0.0),
                    ],
                  ),
                ),
              ),
              Transform.scale(scale: _scale.value, child: child),
            ],
          ),
          child: widget.child,
        ),
      ),
    );

    if (widget.tooltip != null) {
      return Tooltip(message: widget.tooltip!, child: button);
    }
    return button;
  }
}

// ── MAIN BOTTOM NAV (2 + Home + 2 — modern floating center) ────
// ═══════════════════════════════════════════════════════════════
//  KIDS APPBAR — consistent, modern, kid-friendly top bar
//  (cream, big Baloo-2 title with optional emoji, round bouncy buttons)
// ═══════════════════════════════════════════════════════════════
class KidsAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String? emoji;
  final Widget? leading;
  final VoidCallback? onBack;
  final List<Widget> actions;
  final Color? backgroundColor;
  final PreferredSizeWidget? bottom;

  const KidsAppBar({
    super.key,
    required this.title,
    this.emoji,
    this.leading,
    this.onBack,
    this.actions = const [],
    this.backgroundColor,
    this.bottom,
  });

  @override
  Size get preferredSize =>
      Size.fromHeight(68 + (bottom?.preferredSize.height ?? 0));

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: backgroundColor ?? AppTheme.creamBg,
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
      centerTitle: false,
      toolbarHeight: 68,
      titleSpacing: (leading == null && onBack == null) ? 20 : 0,
      leading:
          leading ??
          (onBack != null
              ? KidsIconButton(
                  onTap: onBack,
                  tooltip: 'Back',
                  child: const Icon(
                    Icons.arrow_back_rounded,
                    color: AppTheme.darkNavy,
                  ),
                )
              : null),
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (emoji != null) ...[
            Text(emoji!, style: const TextStyle(fontSize: 26)),
            const SizedBox(width: 10),
          ],
          Flexible(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppStyles.baloo2(
                fontSize: AppTheme.titleSize,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
          ),
        ],
      ),
      actions: [...actions, const SizedBox(width: 8)],
      bottom: bottom,
    );
  }
}

class MainBottomNav extends StatelessWidget {
  final int currentIndex;
  const MainBottomNav({super.key, required this.currentIndex});

  static const List<_NavItem> _items = [
    _NavItem(
      route: AppRoutes.discovery,
      icon: Icons.explore_rounded,
      label: 'Discover',
    ),
    _NavItem(
      route: AppRoutes.books,
      icon: Icons.menu_book_rounded,
      label: 'Books',
    ),
    _NavItem(
      route: AppRoutes.music,
      icon: Icons.music_note_rounded,
      label: 'Music',
    ),
    _NavItem(
      route: AppRoutes.storytelling,
      icon: Icons.auto_stories_rounded,
      label: 'Storytelling',
    ),
    _NavItem(
      route: AppRoutes.profile,
      icon: Icons.person_rounded,
      label: 'Profile',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.textShadow,
            blurRadius: 18,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(
              _items.length,
              (i) => _buildItem(context, i),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildItem(BuildContext context, int i) {
    final selected = i == currentIndex;
    final item = _items[i];
    final isProfile = i == _items.length - 1;
    String? userAvatar;
    if (isProfile) {
      try {
        final authState = context.read<AuthCubit>().state;
        if (authState is AuthAuthenticated) {
          userAvatar = authState.user.avatarUrl;
        }
      } catch (_) {}
    }
    return Expanded(
      child: InkWell(
        onTap: () => context.go(item.route),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 44,
                height: 44,
                padding: const EdgeInsets.all(4),
                decoration: selected
                    ? BoxDecoration(
                        color: AppTheme.sunnyYellow.withValues(alpha: 0.20),
                        shape: BoxShape.circle,
                      )
                    : null,
                child: isProfile && userAvatar != null && userAvatar.isNotEmpty
                    ? ClipOval(
                        child: CachedNetworkImage(
                          imageUrl: AppConstants.resolveUrl(userAvatar),
                          width: 36,
                          height: 36,
                          fit: BoxFit.cover,
                          placeholder: (_, _) => Icon(
                            item.icon,
                            size: 26,
                            color: selected ? AppTheme.sunnyYellow : AppTheme.charcoal,
                          ),
                          errorWidget: (_, _, _) => Icon(
                            item.icon,
                            size: 26,
                            color: selected ? AppTheme.sunnyYellow : AppTheme.charcoal,
                          ),
                        ),
                      )
                    : Icon(
                        item.icon,
                        size: 26,
                        color: selected ? AppTheme.sunnyYellow : AppTheme.charcoal,
                      ),
              ),
              const SizedBox(height: 2),
              Text(
                item.label,
                style: AppStyles.nunito(
                  fontSize: 13,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                  color: selected ? AppTheme.sunnyYellow : AppTheme.charcoal,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final String route;
  final IconData icon;
  final String label;
  const _NavItem({
    required this.route,
    required this.icon,
    required this.label,
  });
}

// ═══════════════════════════════════════════════════════════════
//  PROFILE SCREEN WIDGETS
// ═══════════════════════════════════════════════════════════════

class AnimatedProgressRing extends StatefulWidget {
  final String emoji;
  final double progress;
  final String label;
  final Color color;
  final double size;
  final double strokeWidth;

  const AnimatedProgressRing({
    super.key,
    required this.emoji,
    required this.progress,
    required this.label,
    this.color = AppTheme.gold,
    this.size = 90,
    this.strokeWidth = 8,
  });

  @override
  State<AnimatedProgressRing> createState() => _AnimatedProgressRingState();
}

class _AnimatedProgressRingState extends State<AnimatedProgressRing>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _animation = Tween<double>(
      begin: 0,
      end: widget.progress,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: widget.size,
          height: widget.size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              AnimatedBuilder(
                animation: _animation,
                builder: (context, child) {
                  return CustomPaint(
                    size: Size(widget.size, widget.size),
                    painter: _RingPainter(
                      progress: _animation.value,
                      color: widget.color,
                      strokeWidth: widget.strokeWidth,
                    ),
                  );
                },
              ),
              Text(
                widget.emoji,
                style: TextStyle(fontSize: widget.size * 0.7, color: AppTheme.textDark),
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        Text(
          widget.label,
          style: AppStyles.nunito(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppTheme.gold,
          ),
        ),
      ],
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  final Color color;
  final double strokeWidth;

  _RingPainter({
    required this.progress,
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    final bgPaint = Paint()
      ..color = color.withValues(alpha: 0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    final fgPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final sweepAngle = 2 * 3.14159 * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -3.14159 / 2,
      sweepAngle,
      false,
      fgPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) => old.progress != progress;
}

class GridMenuCard extends StatefulWidget {
  final String emoji;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const GridMenuCard({
    super.key,
    required this.emoji,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  State<GridMenuCard> createState() => _GridMenuCardState();
}

class _GridMenuCardState extends State<GridMenuCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.93,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap();
      },
      onTapCancel: () => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(scale: _scaleAnimation.value, child: child);
        },
        child: Container(
          height: 90,
          decoration: AppTheme.gridCardDecoration(widget.color),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(widget.emoji, style: const TextStyle(fontSize: 32)),
              const SizedBox(height: 6),
              Text(
                widget.label,
                style: AppStyles.nunito(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textDark,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ConfettiBurst extends StatefulWidget {
  final bool show;
  final Widget child;

  const ConfettiBurst({super.key, required this.show, required this.child});

  @override
  State<ConfettiBurst> createState() => _ConfettiBurstState();
}

class _ConfettiBurstState extends State<ConfettiBurst>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<_Particle> _particles = [];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        setState(() => _particles.clear());
      }
    });
  }

  @override
  void didUpdateWidget(ConfettiBurst old) {
    super.didUpdateWidget(old);
    if (widget.show && !old.show) {
      _burst();
    }
  }

  void _burst() {
    final colors = [
      AppTheme.gold,
      AppTheme.errorRed,
      AppTheme.successGreen,
      AppTheme.lightPurple,
    ];
    _particles.clear();
    for (var i = 0; i < 20; i++) {
      _particles.add(
        _Particle(
          color: colors[i % colors.length],
          angle: (i * 3.14159 * 2) / 20,
          speed: 80 + (i % 3) * 40,
          size: 6 + (i % 3) * 2,
        ),
      );
    }
    _controller.forward(from: 0);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        widget.child,
        if (_particles.isNotEmpty)
          AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              return CustomPaint(
                size: Size.zero,
                painter: _ConfettiPainter(
                  particles: _particles,
                  progress: _controller.value,
                ),
              );
            },
          ),
      ],
    );
  }
}

class _Particle {
  final Color color;
  final double angle;
  final double speed;
  final double size;
  _Particle({
    required this.color,
    required this.angle,
    required this.speed,
    required this.size,
  });
}

class _ConfettiPainter extends CustomPainter {
  final List<_Particle> particles;
  final double progress;

  _ConfettiPainter({required this.particles, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    for (final p in particles) {
      final paint = Paint()..color = p.color;
      final x = size.width / 2 + p.speed * progress * p.angle;
      final y = -20 + p.speed * progress * 0.5 + 50 * progress * progress;
      canvas.drawCircle(Offset(x, y), p.size * (1 - progress), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiPainter old) =>
      old.progress != progress;
}

class StreakCounter extends StatefulWidget {
  final int days;

  const StreakCounter({super.key, required this.days});

  @override
  State<StreakCounter> createState() => _StreakCounterState();
}

class _StreakCounterState extends State<StreakCounter>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.days <= 0) return const SizedBox.shrink();
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: 1.0 + _controller.value * 0.1,
          child: child,
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppTheme.gold.withValues(alpha: 0.2),
              AppTheme.sunnyYellow.withValues(alpha: 0.15),
            ],
          ),
          borderRadius: BorderRadius.circular(99),
          border: Border.all(color: AppTheme.softPurple.withValues(alpha: 0.4)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('🔥', style: TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Text(
              '${widget.days} day${widget.days == 1 ? '' : 's'} in a row!',
              style: AppStyles.nunito(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  BARIISAA APP BAR — branded top bar with logo, menu & profile
//  (purple bg, gold accents, kid-friendly, responsive)
// ═══════════════════════════════════════════════════════════════

class BariisaaAppBar extends StatefulWidget implements PreferredSizeWidget {
  /// Overrides the default "Bariisaa TV" title text.
  final String? title;

  /// Shows the All Menu button (grid icon → /menu-all). Defaults to true.
  final bool showMenu;

  /// Shows the profile avatar button (→ /profile). Defaults to true.
  final bool showProfile;

  /// Extra action widgets to show between the menu and profile buttons.
  final List<Widget> actions;

  /// Optional scaffold bottom (e.g. TabBar for History tabs).
  final PreferredSizeWidget? bottom;

  /// Optional pre-resolved avatar URL. When provided, skips AuthCubit lookup.
  final String? avatarUrl;

  const BariisaaAppBar({
    super.key,
    this.title,
    this.showMenu = true,
    this.showProfile = true,
    this.actions = const [],
    this.bottom,
    this.avatarUrl,
  });

  @override
  State<BariisaaAppBar> createState() => _BariisaaAppBarState();

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _BariisaaAppBarState extends State<BariisaaAppBar> {

  String? _resolveAvatarUrl() {
    // Use the widget-provided URL if given.
    if (widget.avatarUrl != null && widget.avatarUrl!.isNotEmpty) {
      return AppConstants.resolveUrl(widget.avatarUrl!);
    }

    // Try to read from AuthCubit.
    try {
      final authState = context.read<AuthCubit>().state;
      if (authState is AuthAuthenticated) {
        final url = authState.user.avatarUrl;
        if (url != null && url.isNotEmpty) {
          return AppConstants.resolveUrl(url);
        }
      }
    } catch (_) {
      // AuthCubit not in tree or other error — fall through to default.
    }

    // Try the profile cubit as a fallback.
    try {
      final profileState = context.read<ProfileCubit>().state;
      if (profileState is ProfileLoaded) {
        final url = profileState.user.avatarUrl;
        if (url != null && url.isNotEmpty) {
          return AppConstants.resolveUrl(url);
        }
      }
    } catch (_) {}

    return null;
  }

  @override
  Widget build(BuildContext context) {
    final avatarUrl = _resolveAvatarUrl();

    return AppBar(
      backgroundColor: AppTheme.deepPurple,
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
      centerTitle: true,
      toolbarHeight: kToolbarHeight,
      bottom: widget.bottom,
      titleSpacing: 8,
      leading: _buildLogo(context),
      title: Text(
        widget.title ?? 'Bariisaa TV',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: AppStyles.baloo2(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppTheme.creamText,
          height: 1.1,
        ),
      ),
      actions: [
        ...widget.actions,
        if (widget.showMenu) _buildMenuButton(context),
        if (widget.showProfile)
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => context.push(AppRoutes.profile),
              child: _buildProfileAvatar(avatarUrl),
            ),
          ),
      ],
    );
  }

  /// Logo image — placed on the left side of the AppBar.
  Widget _buildLogo(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 12),
      child: Image.asset(
        'assets/images/logo.png',
        width: 32,
        height: 32,
        fit: BoxFit.contain,
      ),
    );
  }

  /// All Menu button — gold rounded square with grid icon.
  Widget _buildMenuButton(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(AppRoutes.menuAll),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppTheme.gold.withValues(alpha: 0.25),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(
          Icons.grid_view_rounded,
          size: 22,
          color: AppTheme.darkNavy,
        ),
      ),
    );
  }

  /// Circular profile avatar with border, fallback, and network image.
  Widget _buildProfileAvatar(String? url) {
    return Container(
      width: 40,
      height: 40,
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: AppTheme.gold,
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.gold.withValues(alpha: 0.35),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipOval(
        child: url != null && url.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: url,
                fit: BoxFit.cover,
                memCacheWidth: 80,
                memCacheHeight: 80,
                placeholder: (_, _) => _defaultAvatar(),
                errorWidget: (_, __, ___) => _defaultAvatar(),
              )
            : _defaultAvatar(),
      ),
    );
  }

  /// Default avatar — cute owl mascot emoji on a gold gradient circle.
  Widget _defaultAvatar() {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [
            AppTheme.gold,
            AppTheme.gold.withValues(alpha: 0.7),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Text(
          '🦉',
          style: TextStyle(fontSize: 20),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  KIDS DESIGN-SYSTEM FEEDBACK STATES (Phase 0)
//  Consistent kid-friendly empty / loading / error states.
// ═══════════════════════════════════════════════════════════════

/// Playful loading state — a bouncing mascot + shimmer book cards
/// (no technical spinner).
class KidsLoadingState extends StatelessWidget {
  final String? message;
  const KidsLoadingState({super.key, this.message = 'Getting things ready…'});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const LoadingMascot(emoji: '⏳'),
        if (message != null) ...[
          const SizedBox(height: 12),
          Text(
            message!,
            style: AppStyles.nunito(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.charcoal,
            ),
            textAlign: TextAlign.center,
          ),
        ],
        const SizedBox(height: 24),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: 0.72,
          children: List.generate(4, (_) => const ShimmerBookCard()),
        ),
      ],
    );
  }
}

/// Friendly empty state — mascot + simple language + big action.
class KidsEmptyState extends StatelessWidget {
  final String emoji;
  final String title;
  final String? subtitle;
  final Widget? action;
  const KidsEmptyState({
    super.key,
    this.emoji = '🎈',
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            MascotBubble(
              emoji: emoji,
              size: 96,
              backgroundColor: AppTheme.skyBlueLight.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: AppStyles.baloo2(
                fontSize: 26,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: AppStyles.nunito(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.charcoal,
                ),
                textAlign: TextAlign.center,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            if (action != null) ...[const SizedBox(height: 24), action!],
          ],
        ),
      ),
    );
  }
}

/// Friendly error state — mascot, simple language, no technical text.
class KidsErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const KidsErrorState({
    super.key,
    this.message = 'Oops! Something went wrong.',
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const MascotBubble(emoji: '😅', size: 96, label: 'Oops!'),
            const SizedBox(height: 16),
            Text(
              message,
              style: AppStyles.nunito(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.charcoal,
              ),
              textAlign: TextAlign.center,
              maxLines: 4,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 20),
            BigTapButton(
              onPressed: onRetry,
              color: AppTheme.sunnyYellow,
              height: 52,
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.refresh, size: 22, color: AppTheme.deepNavy),
                  const SizedBox(width: 8),
                  Text(
                    "Let's try again!",
                    style: AppStyles.nunito(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.deepNavy,
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
}
