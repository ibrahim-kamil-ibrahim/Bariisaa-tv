import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../core/theme/app_theme.dart';

/// ═══════════════════════════════════════════════════════════════
///  BARIISAA TV — UNIFIED CONTENT CARD SYSTEM
/// ═══════════════════════════════════════════════════════════════
///  Premium, image-first, purple/gold cards for ALL admin-published
///  content. E-books, audio books, stories, music and categories all
///  render through this one visual language. Cards are 100% data-driven:
///  pass the backend model's fields in and the presentation is automatic.
///
///  Flow:  Admin → Backend API → Repository → Cubit → State → *these cards* → UI

/// Formats seconds → "12 min" / "1h 05m". Returns '' for <= 0.
String formatContentDuration(int? seconds) {
  if (seconds == null || seconds <= 0) return '';
  final m = seconds ~/ 60;
  if (m < 60) return '$m min';
  final h = m ~/ 60;
  final rem = m % 60;
  return rem == 0 ? '${h}h' : '${h}h ${rem}m';
}

/// Shared cover art: rounded, image-first, deep-purple gradient fallback,
/// bottom legibility scrim. Never renders a broken image.
class ContentCover extends StatelessWidget {
  final String? url;
  final BorderRadius radius;
  final String emoji;
  final List<Widget> overlays; // badges, favorite, play — placed on top
  final double? memCacheWidth;
  final double? memCacheHeight;
  const ContentCover({
    super.key,
    required this.url,
    required this.radius,
    this.emoji = '📚',
    this.overlays = const [],
    this.memCacheWidth,
    this.memCacheHeight,
  });

  @override
  Widget build(BuildContext context) {
    final hasImage = url != null && url!.trim().isNotEmpty;
    return ClipRRect(
      borderRadius: radius,
      child: Stack(
        fit: StackFit.expand,
        children: [
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.sunnyYellow, AppTheme.skyBlue],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
          if (hasImage)
            CachedNetworkImage(
              imageUrl: url!,
              fit: BoxFit.cover,
              memCacheWidth: memCacheWidth?.toInt(),
              memCacheHeight: memCacheHeight?.toInt(),
              maxWidthDiskCache: (memCacheWidth != null
                  ? (memCacheWidth! * 1.5).toInt()
                  : null),
              fadeInDuration: Duration.zero,
              fadeOutDuration: Duration.zero,
              placeholder: (_, _) => const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppTheme.sunnyYellow, AppTheme.skyBlue],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
              errorWidget: (_, _, _) => Center(
                child: Text(emoji, style: const TextStyle(fontSize: 44)),
              ),
            )
          else
            Center(child: Text(emoji, style: const TextStyle(fontSize: 44))),
          ...overlays,
        ],
      ),
    );
  }
}

/// Small pill badge (Premium / Lock / New).
class ContentBadge extends StatelessWidget {
  final String label;
  final Color background;
  final Color foreground;
  final IconData? icon;
  const ContentBadge({
    super.key,
    required this.label,
    required this.background,
    required this.foreground,
    this.icon,
  });

  static Widget _lock(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: AppTheme.deepNavy.withValues(alpha: 0.8),
      borderRadius: BorderRadius.circular(999),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.18),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ],
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.lock_outline_rounded, size: 12, color: AppTheme.gold),
        const SizedBox(width: 4),
        Text(
          'LOCKED',
          style: AppStyles.nunito(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            color: AppTheme.gold,
            letterSpacing: 0.3,
          ),
        ),
      ],
    ),
  );

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.18),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: foreground),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: AppStyles.nunito(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: foreground,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

/// Gold pill action button (Play / Read / Download).
class _GoldPill extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  const _GoldPill({required this.label, required this.icon, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: 40,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppTheme.gold, Color(0xFFFFC93D)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(AppTheme.buttonRadius),
          boxShadow: [
            BoxShadow(
              color: AppTheme.gold.withValues(alpha: 0.35),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: AppTheme.deepPurple),
            const SizedBox(width: 6),
            Text(
              label,
              style: AppStyles.nunito(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: AppTheme.textNavy,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Favorite heart with a lightweight scale animation.
class _FavoriteButton extends StatelessWidget {
  final bool isFavorite;
  final VoidCallback? onTap;
  const _FavoriteButton({required this.isFavorite, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedScale(
        scale: isFavorite ? 1.08 : 1.0,
        duration: const Duration(milliseconds: 180),
        child: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppTheme.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 6,
              ),
            ],
          ),
          child: Icon(
            isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
            size: 22,
            color: isFavorite ? AppTheme.playfulRed : AppTheme.charcoal,
          ),
        ),
      ),
    );
  }
}

/// Subtle scale-down on press (lightweight, non-distracting).
class _TapScale extends StatefulWidget {
  final VoidCallback? onTap;
  final Widget child;
  const _TapScale({this.onTap, required this.child});

  @override
  State<_TapScale> createState() => _TapScaleState();
}

class _TapScaleState extends State<_TapScale> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 120),
        child: widget.child,
      ),
    );
  }
}

/// Metadata row: ⭐ rating + one or two small chips (duration / reading time).
class _MetaRow extends StatelessWidget {
  final double rating;
  final String meta1;
  const _MetaRow({this.rating = 0, this.meta1 = ''});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (rating > 0) ...[
          const Icon(Icons.star_rounded, size: 14, color: AppTheme.gold),
          const SizedBox(width: 2),
          Text(
            rating.toStringAsFixed(1),
            style: AppStyles.baloo2(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: AppTheme.darkNavy,
            ),
          ),
        ],
        if (rating > 0 && meta1.isNotEmpty) const SizedBox(width: 10),
        if (meta1.isNotEmpty) _metaChip(meta1),
      ],
    );
  }

  Widget _metaChip(String text) {
    return Text(
      text,
      style: AppStyles.baloo2(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: AppTheme.charcoal,
      ),
    );
  }
}

/// Shared card shell: warm off-white background + soft shadow + brand-accent border.
class _CardShell extends StatelessWidget {
  final Widget child;
  const _CardShell({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.offWhite,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: AppTheme.skyBlue.withValues(alpha: 0.18),
          width: 1,
        ),
        boxShadow: [
          AppTheme.clayShadow(
            color: AppTheme.deepNavy.withValues(alpha: 0.14),
            blur: 22,
            dy: 8,
            spread: -4,
          ).first,
        ],
      ),
      child: ClipRRect(borderRadius: BorderRadius.circular(24), child: child),
    );
  }
}

/// Progress bar (gold on translucent track) for continue-reading cards.
class _ProgressBar extends StatelessWidget {
  final double progress;
  const _ProgressBar({required this.progress});

  @override
  Widget build(BuildContext context) {
    final p = progress.clamp(0.0, 1.0);
    return ClipRRect(
      borderRadius: BorderRadius.circular(999),
      child: SizedBox(
        height: 5,
        child: Stack(
          children: [
            Container(color: AppTheme.creamText.withValues(alpha: 0.16)),
            FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: p,
              child: Container(color: AppTheme.gold),
            ),
          ],
        ),
      ),
    );
  }
}

/// ─────────────────────────────────────────────────────────────
///  E-BOOK CARD
/// ─────────────────────────────────────────────────────────────
class EbookCard extends StatelessWidget {
  final String title;
  final String? coverUrl;
  final String? author;
  final String? category;
  final double rating;
  final String? readingTime;
  final double? progress;
  final bool isPremium;
  final bool isNew;
  final bool isFavorite;
  final bool isLocked;
  final VoidCallback? onTap;
  final VoidCallback? onRead;
  final VoidCallback? onFavorite;
  final VoidCallback? onDownload;

  const EbookCard({
    super.key,
    required this.title,
    this.coverUrl,
    this.author,
    this.category,
    this.rating = 0,
    this.readingTime,
    this.progress,
    this.isPremium = false,
    this.isNew = false,
    this.isFavorite = false,
    this.isLocked = false,
    this.onTap,
    this.onRead,
    this.onFavorite,
    this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    final meta = readingTime ?? formatContentDuration(null);
    return _TapScale(
      onTap: onTap,
      child: _CardShell(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 3,
              child: ContentCover(
                url: coverUrl,
                emoji: '📖',
                radius: const BorderRadius.vertical(top: Radius.circular(24)),
                overlays: [
                  Positioned(top: 8, left: 8, child: _topBadges()),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: _FavoriteButton(
                      isFavorite: isFavorite,
                      onTap: onFavorite,
                    ),
                  ),
                  if (onRead != null)
                    Positioned(
                      right: 10,
                      bottom: 10,
                      child: _smallCircleAction(
                        Icons.menu_book_rounded,
                        onRead!,
                      ),
                    ),
                  if (isLocked)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: ContentBadge._lock(context),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: AppStyles.baloo2(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                      height: 1.15,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (author != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      'By $author',
                      style: AppStyles.nunito(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.charcoal,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 8),
                  _MetaRow(rating: rating, meta1: meta),
                  if (progress != null) ...[
                    const SizedBox(height: 8),
                    _ProgressBar(progress: progress!),
                  ],
                  const SizedBox(height: 8),
                  _GoldPill(
                    label: 'READ',
                    icon: Icons.menu_book_rounded,
                    onPressed: onRead,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _topBadges() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (isPremium)
          const ContentBadge(
            label: 'PREMIUM',
            background: AppTheme.gold,
            foreground: AppTheme.deepNavy,
            icon: Icons.workspace_premium_rounded,
          ),
        if (isPremium && isNew) const SizedBox(width: 4),
        if (isNew)
          const ContentBadge(
            label: 'NEW',
            background: AppTheme.white,
            foreground: AppTheme.deepNavy,
          ),
      ],
    );
  }

  Widget _smallCircleAction(IconData icon, VoidCallback onPressed) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: AppTheme.gold,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              blurRadius: 6,
            ),
          ],
        ),
        child: Icon(icon, size: 22, color: AppTheme.deepNavy),
      ),
    );
  }
}

/// ─────────────────────────────────────────────────────────────
///  AUDIO BOOK CARD
/// ─────────────────────────────────────────────────────────────
class AudioBookCard extends StatelessWidget {
  final String title;
  final String? coverUrl;
  final String? author;
  final String? category;
  final double rating;
  final int? durationSeconds;
  final double? progress;
  final bool isPremium;
  final bool isNew;
  final bool isFavorite;
  final bool isLocked;
  final VoidCallback? onTap;
  final VoidCallback? onPlay;
  final VoidCallback? onFavorite;
  final VoidCallback? onDownload;

  const AudioBookCard({
    super.key,
    required this.title,
    this.coverUrl,
    this.author,
    this.category,
    this.rating = 0,
    this.durationSeconds,
    this.progress,
    this.isPremium = false,
    this.isNew = false,
    this.isFavorite = false,
    this.isLocked = false,
    this.onTap,
    this.onPlay,
    this.onFavorite,
    this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    final meta = formatContentDuration(durationSeconds);
    return _TapScale(
      onTap: onTap,
      child: _CardShell(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 3,
              child: ContentCover(
                url: coverUrl,
                emoji: '🎧',
                radius: const BorderRadius.vertical(top: Radius.circular(24)),
                overlays: [
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isPremium)
                          const ContentBadge(
                            label: 'PREMIUM',
                            background: AppTheme.gold,
                            foreground: AppTheme.deepNavy,
                            icon: Icons.workspace_premium_rounded,
                          ),
                        if (isPremium && isNew) const SizedBox(width: 4),
                        if (isNew)
                          const ContentBadge(
                            label: 'NEW',
                            background: AppTheme.white,
                            foreground: AppTheme.deepNavy,
                          ),
                        if (isLocked)
                          ContentBadge._lock(context),
                      ],
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: _FavoriteButton(
                      isFavorite: isFavorite,
                      onTap: onFavorite,
                    ),
                  ),
                  if (onPlay != null)
                    Positioned(
                      right: 10,
                      bottom: 10,
                      child: _GoldPill(
                        label: 'PLAY',
                        icon: Icons.play_arrow_rounded,
                        onPressed: onPlay,
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: AppStyles.baloo2(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                      height: 1.15,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (author != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      'By $author',
                      style: AppStyles.nunito(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.charcoal,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 8),
                  _MetaRow(rating: rating, meta1: meta),
                  if (progress != null) ...[
                    const SizedBox(height: 8),
                    _ProgressBar(progress: progress!),
                  ],
                  const SizedBox(height: 8),
                  _GoldPill(
                    label: 'PLAY',
                    icon: Icons.play_arrow_rounded,
                    onPressed: onPlay,
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

/// ─────────────────────────────────────────────────────────────
///  STORY CARD
/// ─────────────────────────────────────────────────────────────
class StoryCard extends StatelessWidget {
  final String title;
  final String? coverUrl;
  final String? author;
  final String? category;
  final String? ageGroup;
  final int? durationSeconds;
  final bool isFavorite;
  final bool isLocked;
  final VoidCallback? onTap;
  final VoidCallback? onPlay;
  final VoidCallback? onFavorite;

  const StoryCard({
    super.key,
    required this.title,
    this.coverUrl,
    this.author,
    this.category,
    this.ageGroup,
    this.durationSeconds,
    this.isFavorite = false,
    this.isLocked = false,
    this.onTap,
    this.onPlay,
    this.onFavorite,
  });

  @override
  Widget build(BuildContext context) {
    return _TapScale(
      onTap: onTap,
      child: _CardShell(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 3,
              child: ContentCover(
                url: coverUrl,
                emoji: '🧚',
                radius: const BorderRadius.vertical(top: Radius.circular(24)),
                overlays: [
                  if (category != null && category!.isNotEmpty)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: ContentBadge(
                        label: category!,
                        background: AppTheme.deepNavy.withValues(alpha: 0.7),
                        foreground: AppTheme.white,
                      ),
                    ),
                  Positioned(
                    top: 8,
                    left: 8,
                    child: isLocked
                        ? ContentBadge._lock(context)
                        : const SizedBox.shrink(),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: _FavoriteButton(
                      isFavorite: isFavorite,
                      onTap: onFavorite,
                    ),
                  ),
                  if (onPlay != null)
                    Positioned(
                      right: 10,
                      bottom: 10,
                      child: _GoldPill(
                        label: 'PLAY',
                        icon: Icons.play_arrow_rounded,
                        onPressed: onPlay,
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: AppStyles.baloo2(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                      height: 1.15,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (ageGroup != null && ageGroup!.isNotEmpty) ...[
                        _chip(ageGroup!),
                        const SizedBox(width: 6),
                      ],
                      if (durationSeconds != null && durationSeconds! > 0)
                        _chip(formatContentDuration(durationSeconds)),
                    ],
                  ),
                  if (author != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'By $author',
                      style: AppStyles.nunito(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.charcoal,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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

  Widget _chip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppTheme.charcoal.withValues(alpha: 0.2)),
      ),
      child: Text(
        text,
        style: AppStyles.baloo2(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppTheme.darkNavy,
        ),
      ),
    );
  }
}

/// ─────────────────────────────────────────────────────────────
///  MUSIC CARD
/// ─────────────────────────────────────────────────────────────
class MusicCard extends StatelessWidget {
  final String title;
  final String? coverUrl;
  final String? artist;
  final String? genre;
  final int? durationSeconds;
  final bool isFavorite;
  final bool isLocked;
  final VoidCallback? onTap;
  final VoidCallback? onPlay;
  final VoidCallback? onFavorite;
  final VoidCallback? onDownload;

  const MusicCard({
    super.key,
    required this.title,
    this.coverUrl,
    this.artist,
    this.genre,
    this.durationSeconds,
    this.isFavorite = false,
    this.isLocked = false,
    this.onTap,
    this.onPlay,
    this.onFavorite,
    this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    return _TapScale(
      onTap: onTap,
      child: _CardShell(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 3,
              child: ContentCover(
                url: coverUrl,
                emoji: '🎵',
                radius: const BorderRadius.vertical(top: Radius.circular(24)),
                overlays: [
                  Positioned(
                    top: 8,
                    right: 8,
                    child: _FavoriteButton(
                      isFavorite: isFavorite,
                      onTap: onFavorite,
                    ),
                  ),
                  if (onPlay != null)
                    Positioned(
                      right: 10,
                      bottom: 10,
                      child: _GoldPill(
                        label: 'PLAY',
                        icon: Icons.play_arrow_rounded,
                        onPressed: onPlay,
                      ),
                    ),
                  if (isLocked)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: ContentBadge._lock(context),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: AppStyles.baloo2(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                      height: 1.15,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (artist != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      artist!,
                      style: AppStyles.nunito(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.charcoal,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (genre != null && genre!.isNotEmpty) ...[
                        Text(
                          genre!,
                          style: AppStyles.nunito(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.skyBlue,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(width: 8),
                      ],
                      if (durationSeconds != null && durationSeconds! > 0)
                        Text(
                          formatContentDuration(durationSeconds),
                          style: AppStyles.nunito(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.charcoal,
                          ),
                        ),
                    ],
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

/// ─────────────────────────────────────────────────────────────
///  CATEGORY CARD — large image + purple overlay + name + count
/// ─────────────────────────────────────────────────────────────
class CategoryCard extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final String? emoji;
  final int contentCount;
  final VoidCallback? onTap;

  const CategoryCard({
    super.key,
    required this.name,
    this.imageUrl,
    this.emoji,
    this.contentCount = 0,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return _TapScale(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            AppTheme.clayShadow(
              color: AppTheme.deepNavy.withValues(alpha: 0.3),
              blur: 20,
              dy: 8,
              spread: -4,
            ).first,
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: Stack(
            fit: StackFit.expand,
            children: [
              ContentCover(
                url: imageUrl,
                emoji: emoji ?? '🎨',
                radius: BorderRadius.circular(28),
              ),
              // purple overlay gradient
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0xCC1F2A4A)],
                    stops: [0.35, 1.0],
                  ),
                ),
              ),
              Positioned(
                left: 12,
                right: 12,
                bottom: 12,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: AppStyles.baloo2(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.white,
                        height: 1.1,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (contentCount > 0) ...[
                      const SizedBox(height: 3),
                      Text(
                        '$contentCount ${contentCount == 1 ? 'item' : 'items'}',
                        style: AppStyles.nunito(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.gold,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// ─────────────────────────────────────────────────────────────
///  FEATURED CONTENT CARD — large hero for "For You" carousels
/// ─────────────────────────────────────────────────────────────
class FeaturedContentCard extends StatelessWidget {
  final String title;
  final String? coverUrl;
  final String? author;
  final String? category;
  final double rating;
  final int? durationSeconds;
  final String? readingTime;
  final bool isAudio;
  final bool isPremium;
  final bool isNew;
  final bool isFavorite;
  final bool isLocked;
  final VoidCallback? onTap;
  final VoidCallback? onPrimaryAction;
  final VoidCallback? onFavorite;

  const FeaturedContentCard({
    super.key,
    required this.title,
    this.coverUrl,
    this.author,
    this.category,
    this.rating = 0,
    this.durationSeconds,
    this.readingTime,
    this.isAudio = false,
    this.isPremium = false,
    this.isNew = false,
    this.isFavorite = false,
    this.isLocked = false,
    this.onTap,
    this.onPrimaryAction,
    this.onFavorite,
  });

  @override
  Widget build(BuildContext context) {
    final meta = isAudio
        ? formatContentDuration(durationSeconds)
        : (readingTime ?? '');
    return _TapScale(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            AppTheme.clayShadow(
              color: AppTheme.deepNavy.withValues(alpha: 0.35),
              blur: 24,
              dy: 10,
              spread: -5,
            ).first,
            BoxShadow(
              color: AppTheme.gold.withValues(alpha: 0.15),
              blurRadius: 30,
              spreadRadius: -2,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: Stack(
            fit: StackFit.expand,
            children: [
              ContentCover(
                url: coverUrl,
                emoji: isAudio ? '🎧' : '📖',
                radius: BorderRadius.circular(28),
              ),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0xE61F2A4A)],
                    stops: [0.4, 1.0],
                  ),
                ),
              ),
              Positioned(
                top: 12,
                left: 12,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isPremium)
                      const ContentBadge(
                        label: 'PREMIUM',
                        background: AppTheme.gold,
                        foreground: AppTheme.deepNavy,
                        icon: Icons.workspace_premium_rounded,
                      ),
                    if (isPremium && isNew) const SizedBox(width: 6),
                    if (isNew)
                      const ContentBadge(
                        label: 'NEW',
                        background: AppTheme.white,
                        foreground: AppTheme.deepNavy,
                      ),
                    if (isLocked)
                      ContentBadge._lock(context),
                  ],
                ),
              ),
              Positioned(
                top: 12,
                right: 12,
                child: _FavoriteButton(
                  isFavorite: isFavorite,
                  onTap: onFavorite,
                ),
              ),
              Positioned(
                left: 16,
                right: 16,
                bottom: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (category != null && category!.isNotEmpty) ...[
                      Text(
                        category!.toUpperCase(),
                        style: AppStyles.nunito(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.gold,
                          letterSpacing: 1.1,
                        ),
                      ),
                      const SizedBox(height: 4),
                    ],
                    Text(
                      title,
                      style: AppStyles.baloo2(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.white,
                        height: 1.1,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (author != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        'By $author',
                        style: AppStyles.nunito(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.white.withValues(alpha: 0.85),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (rating > 0) ...[
                          const Icon(
                            Icons.star_rounded,
                            size: 16,
                            color: AppTheme.gold,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            rating.toStringAsFixed(1),
                            style: AppStyles.nunito(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.white,
                            ),
                          ),
                          const SizedBox(width: 12),
                        ],
                        if (meta.isNotEmpty)
                          Text(
                            meta,
                            style: AppStyles.nunito(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.white.withValues(alpha: 0.85),
                            ),
                          ),
                        const Spacer(),
                        if (onPrimaryAction != null)
                          GestureDetector(
                            onTap: onPrimaryAction,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 9,
                              ),
                              decoration: BoxDecoration(
                                color: AppTheme.gold,
                                borderRadius: BorderRadius.circular(999),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppTheme.gold.withValues(alpha: 0.4),
                                    blurRadius: 12,
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    isAudio
                                        ? Icons.play_arrow_rounded
                                        : Icons.menu_book_rounded,
                                    size: 18,
                                    color: AppTheme.deepNavy,
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    isAudio ? 'PLAY' : 'READ',
                                    style: AppStyles.nunito(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.deepNavy,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// ─────────────────────────────────────────────────────────────
///  CONTINUE CARD — progress-based (Continue Reading / Listening)
/// ─────────────────────────────────────────────────────────────
class ContinueCard extends StatelessWidget {
  final String title;
  final String? coverUrl;
  final double progress;
  final String? progressLabel;
  final bool isAudio;
  final VoidCallback? onTap;

  const ContinueCard({
    super.key,
    required this.title,
    this.coverUrl,
    this.progress = 0,
    this.progressLabel,
    this.isAudio = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return _TapScale(
      onTap: onTap,
      child: _CardShell(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ContentCover(
                url: coverUrl,
                emoji: isAudio ? '🎧' : '📖',
                radius: const BorderRadius.vertical(top: Radius.circular(24)),
                overlays: [
                  Positioned(
                    right: 8,
                    bottom: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.gold,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        '${(progress.clamp(0.0, 1.0) * 100).round()}%',
                        style: AppStyles.nunito(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.deepNavy,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppStyles.baloo2(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                      height: 1.15,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  _ProgressBar(progress: progress),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        progressLabel ?? 'Continue',
                        style: AppStyles.nunito(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.gold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const Spacer(),
                      Icon(
                        isAudio
                            ? Icons.play_arrow_rounded
                            : Icons.arrow_forward_rounded,
                        size: 16,
                        color: AppTheme.gold,
                      ),
                    ],
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

/// ─────────────────────────────────────────────────────────────
///  SKELETON — matches card dimensions for loading states
/// ─────────────────────────────────────────────────────────────
class ContentCardSkeleton extends StatefulWidget {
  final double? height;
  final double? width;
  final BorderRadius radius;
  const ContentCardSkeleton({
    super.key,
    this.height,
    this.width,
    this.radius = const BorderRadius.all(Radius.circular(24)),
  });

  @override
  State<ContentCardSkeleton> createState() => _ContentCardSkeletonState();
}

class _ContentCardSkeletonState extends State<ContentCardSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween<double>(
        begin: 0.45,
        end: 0.85,
      ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut)),
      child: Container(
        height: widget.height,
        width: widget.width,
        decoration: BoxDecoration(
          color: AppTheme.skyBlue.withValues(alpha: 0.22),
          borderRadius: widget.radius,
        ),
      ),
    );
  }
}
