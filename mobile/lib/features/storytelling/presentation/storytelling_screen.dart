import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../presentation/storytelling_cubit.dart';
import '../domain/storytelling_state.dart';

class StorytellingScreen extends StatefulWidget {
  const StorytellingScreen({super.key});

  @override
  State<StorytellingScreen> createState() => _StorytellingScreenState();
}

class _StorytellingScreenState extends State<StorytellingScreen> {
  @override
  void initState() {
    super.initState();
    context.read<StorytellingCubit>().loadStories();
  }

  String? _s(dynamic v) => v is String ? v : null;
  int? _i(dynamic v) => v is int ? v : (v is num ? v.toInt() : null);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'Storytelling',
      ),
      body: BlocBuilder<StorytellingCubit, StorytellingState>(
          builder: (context, state) {
            if (state is StorytellingLoading) {
              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: 4,
                separatorBuilder: (_, _) => const SizedBox(height: 14),
                itemBuilder: (_, _) => Container(
                  height: 220,
                  decoration: BoxDecoration(
                    color: AppTheme.white,
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
              );
            }
            if (state is StorytellingError) {
              return FunErrorState(
                message: state.message,
                onRetry: () => context.read<StorytellingCubit>().loadStories(),
              );
            }
            if (state is StorytellingLoaded) {
              if (state.stories.isEmpty && state.categories.isEmpty) {
                return const FunEmptyState(
                  emoji: '📖',
                  title: 'No Stories Yet',
                  subtitle: 'Stories will appear here once added.',
                );
              }
              return _buildContent(state);
            }
            return const SizedBox.shrink();
          },
      ),
      bottomNavigationBar: const MainBottomNav(currentIndex: 3),
    );
  }

  Widget _buildContent(StorytellingLoaded state) {
    final stories = state.stories;
    final premiumCount = stories.where((s) => s['isLocked'] == true).length;
    return RefreshIndicator(
      onRefresh: () async => context.read<StorytellingCubit>().loadStories(),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // ── Category chips ──
          if (state.categories.isNotEmpty)
            SliverToBoxAdapter(
              child: SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: state.categories.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final cat = state.categories[index];
                    final name = cat['name'] as String? ?? '';
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.cardPurple.withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: AppTheme.lightPurple.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Text(
                        name,
                        style: AppStyles.nunito(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.darkNavy,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 16)),

          // ── Premium content count (top right) ──
          if (premiumCount > 0)
            SliverToBoxAdapter(
              child: Align(
                alignment: Alignment.centerRight,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.playfulRed.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.workspace_premium_rounded,
                        size: 16,
                        color: AppTheme.playfulRed,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '$premiumCount premium',
                        style: AppStyles.nunito(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.playfulRed,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 16)),

          // ── Video list — one card per row ──
          if (stories.isEmpty)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 80),
                child: FunEmptyState(
                  emoji: '📖',
                  title: 'No Stories Yet',
                  subtitle: 'Stories will appear here once added.',
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _storytellingVideoCard(
                    context,
                    stories[index],
                    index,
                  ),
                  childCount: stories.length,
                ),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }

  /// Video card: cover image with play overlay + title + meta,
  /// one story per row in a vertical column.
  Widget _storytellingVideoCard(
    BuildContext context,
    Map<String, dynamic> story,
    int index,
  ) {
    final id = _s(story['id']);
    final title = _s(story['title']) ?? 'Untitled';
    final coverUrl = _s(story['coverUrl']);
    final resolvedCover =
        coverUrl != null ? AppConstants.resolveUrl(coverUrl) : null;
    final category = _s(story['category']);
    final duration = _i(story['durationSeconds']);
    final isLocked = story['isLocked'] == true;

    return GestureDetector(
      onTap: isLocked
          ? () => _showUnlockDialog(context, story)
          : id == null
              ? null
              : () => context.push('${AppRoutes.storytelling}/$id'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: AppTheme.offWhite,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: AppTheme.skyBlue.withValues(alpha: 0.15),
            width: 1,
          ),
          boxShadow: [
            AppTheme.clayShadow(
              color: AppTheme.deepNavy.withValues(alpha: 0.1),
              blur: 20,
              dy: 6,
              spread: -3,
            ).first,
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Cover image
              resolvedCover != null
                  ? CachedNetworkImage(
                      imageUrl: resolvedCover,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: 220,
                      memCacheWidth: 600,
                      memCacheHeight: 440,
                      placeholder: (_, __) => _videoPlaceholder(),
                      errorWidget: (_, __, ___) => _videoPlaceholder(),
                    )
                  : _videoPlaceholder(),

              // Gradient scrim over image
              Positioned(
                left: 0,
                right: 0,
                top: 0,
                bottom: 56,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.0),
                        Colors.black.withValues(alpha: 0.55),
                      ],
                      stops: const [0.4, 1.0],
                    ),
                  ),
                ),
              ),

              // Play button overlay
              Positioned(
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppTheme.gold.withValues(alpha: 0.9),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.gold.withValues(alpha: 0.5),
                        blurRadius: 14,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.play_arrow_rounded,
                    size: 30,
                    color: AppTheme.deepNavy,
                  ),
                ),
              ),

              // Bottom info strip
              Positioned(
                left: 14,
                right: 14,
                bottom: 14,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isLocked)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.deepNavy.withValues(alpha: 0.8),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: const Text(
                          '🔒 Premium',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.gold,
                          ),
                        ),
                      ),
                    if (isLocked) const SizedBox(height: 4),
                    Text(
                      title,
                      style: AppStyles.baloo2(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.white,
                        height: 1.15,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (category != null && category.isNotEmpty) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              category,
                              style: AppStyles.nunito(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.white,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                        ],
                        if (duration != null && duration > 0)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.schedule_rounded,
                                size: 14,
                                color: Colors.white70,
                              ),
                              const SizedBox(width: 3),
                              Text(
                                _formatDuration(duration),
                                style: AppStyles.nunito(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white70,
                                ),
                              ),
                            ],
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

  /// Show inline unlock dialog for locked stories.
  void _showUnlockDialog(BuildContext context, Map<String, dynamic> story) {
    final title = _s(story['title']) ?? 'This story';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
        decoration: const BoxDecoration(
          color: AppTheme.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.softGrey,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                const Icon(
                  Icons.lock_outline_rounded,
                  size: 28,
                  color: AppTheme.playfulRed,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Unlock $title',
                    style: AppStyles.baloo2(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'To watch this story, you need a Premium subscription.',
              style: AppStyles.nunito(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.charcoal,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  context.push(AppRoutes.paywall);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.gold,
                  foregroundColor: AppTheme.deepNavy,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text(
                  'Go to Premium',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(
                'Maybe later',
                style: AppStyles.nunito(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.charcoal,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _videoPlaceholder() {
    return Container(
      width: double.infinity,
      height: 220,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.sunnyYellow, AppTheme.skyBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Icon(
          Icons.video_library_rounded,
          size: 56,
          color: AppTheme.white,
        ),
      ),
    );
  }

  String _formatDuration(int seconds) {
    if (seconds <= 0) return '';
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}
