import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../features/auth/presentation/auth_guard.dart';
import '../presentation/storytelling_cubit.dart';
import '../domain/storytelling_state.dart';

class StorytellingScreen extends StatefulWidget {
  const StorytellingScreen({super.key});

  @override
  State<StorytellingScreen> createState() => _StorytellingScreenState();
}

class _StorytellingScreenState extends State<StorytellingScreen> {
  String? _selectedCategory;

  @override
  void initState() {
    super.initState();
    context.read<StorytellingCubit>().loadStories();
  }

  String? _s(dynamic v) => v is String && v.isNotEmpty ? v : null;
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
          if (state is StorytellingLoading || state is StorytellingInitial) {
            return const _StoryShimmerList();
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
    final allStories = state.stories;
    final categories = state.categories;
    final premiumCount = allStories.where((s) => s['isLocked'] == true).length;

    final stories = _selectedCategory == null
        ? allStories
        : allStories
            .where((s) => _s(s['category']) == _selectedCategory)
            .toList();

    return RefreshIndicator(
      onRefresh: () async => context.read<StorytellingCubit>().loadStories(),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // ── Hero header ──
          SliverToBoxAdapter(child: _heroHeader(stories.length, premiumCount)),

          // ── Category filter chips ──
          if (categories.isNotEmpty)
            SliverToBoxAdapter(
              child: _categoryChips(categories),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 16)),

          // ── Story cards ──
          if (stories.isEmpty)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 60),
                child: FunEmptyState(
                  emoji: '🔍',
                  title: 'No Stories Here',
                  subtitle: 'Try another category.',
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _storyCard(
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

  // ═══════════════════════════════════════════════
  //  HERO HEADER
  // ═══════════════════════════════════════════════

  Widget _heroHeader(int storyCount, int premiumCount) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.deepPurple, AppTheme.skyBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepPurple.withValues(alpha: 0.35),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: -4,
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Center(
              child: Text('📖', style: TextStyle(fontSize: 30)),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Story Time!',
                  style: AppStyles.baloo2(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.white,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  premiumCount > 0
                      ? '$storyCount stories · $premiumCount premium'
                      : '$storyCount magical stories',
                  style: AppStyles.nunito(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
              ],
            ),
          ),
          if (premiumCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.gold,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.workspace_premium_rounded,
                    size: 14,
                    color: AppTheme.deepNavy,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '$premiumCount',
                    style: AppStyles.nunito(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.deepNavy,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════
  //  CATEGORY FILTER CHIPS
  // ═══════════════════════════════════════════════

  Widget _categoryChips(List<Map<String, dynamic>> categories) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
        itemCount: categories.length + 1,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          if (index == 0) {
            return _chip(
              label: 'All',
              selected: _selectedCategory == null,
              onTap: () => setState(() => _selectedCategory = null),
            );
          }
          final cat = categories[index - 1];
          final name = _s(cat['name']) ?? '';
          if (name.isEmpty) return const SizedBox.shrink();
          return _chip(
            label: name,
            selected: _selectedCategory == name,
            onTap: () => setState(() => _selectedCategory = name),
          );
        },
      ),
    );
  }

  Widget _chip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? AppTheme.skyBlue : AppTheme.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected
                ? AppTheme.skyBlue
                : AppTheme.skyBlue.withValues(alpha: 0.3),
            width: 1.5,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppTheme.skyBlue.withValues(alpha: 0.35),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: AppStyles.nunito(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: selected ? AppTheme.white : AppTheme.darkNavy,
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════
  //  STORY CARD
  // ═══════════════════════════════════════════════

  Widget _storyCard(
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
      onTap: () async {
        final signedIn = await requireAuthentication(context);
        if (!signedIn || !context.mounted) return;
        if (isLocked) {
          if (!context.mounted) return;
          _showUnlockDialog(context, story);
          return;
        }
        if (id == null) return;
        if (!context.mounted) return;
        context.push('${AppRoutes.storytelling}/$id');
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: AppTheme.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            AppTheme.clayShadow(
              color: AppTheme.deepNavy.withValues(alpha: 0.12),
              blur: 18,
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
                      height: 210,
                      memCacheWidth: 600,
                      memCacheHeight: 440,
                      placeholder: (_, _) => _videoPlaceholder(),
                      errorWidget: (_, _, _) => _videoPlaceholder(),
                    )
                  : _videoPlaceholder(),

              // Gradient scrim over image
              Positioned(
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.05),
                        Colors.black.withValues(alpha: 0.05),
                        Colors.black.withValues(alpha: 0.65),
                      ],
                      stops: const [0.0, 0.45, 1.0],
                    ),
                  ),
                ),
              ),

              // Duration chip (top-right)
              if (duration != null && duration > 0)
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.65),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.schedule_rounded,
                          size: 13,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatDuration(duration),
                          style: AppStyles.nunito(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // Premium lock badge (top-left)
              if (isLocked)
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.gold, AppTheme.softAmber],
                      ),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.lock_rounded,
                          size: 13,
                          color: AppTheme.deepNavy,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Premium',
                          style: AppStyles.nunito(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.deepNavy,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // Play button
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: AppTheme.gold.withValues(alpha: 0.95),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.gold.withValues(alpha: 0.5),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.play_arrow_rounded,
                  size: 32,
                  color: AppTheme.deepNavy,
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
                    if (category != null) ...[
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
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

  // ═══════════════════════════════════════════════
  //  UNLOCK SHEET
  // ═══════════════════════════════════════════════

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
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.gold.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.workspace_premium_rounded,
                    size: 28,
                    color: AppTheme.gold,
                  ),
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
      height: 210,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.deepPurple, AppTheme.skyBlue],
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

// ═══════════════════════════════════════════════
//  SHIMMER LOADING SKELETON
// ═══════════════════════════════════════════════

class _StoryShimmerList extends StatefulWidget {
  const _StoryShimmerList();

  @override
  State<_StoryShimmerList> createState() => _StoryShimmerListState();
}

class _StoryShimmerListState extends State<_StoryShimmerList>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final t = _controller.value;
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            _shimmerBox(height: 100, radius: 24, t: t),
            const SizedBox(height: 16),
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: 4,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (_, _) => _shimmerBox(
                  width: 80,
                  height: 40,
                  radius: 999,
                  t: t,
                ),
              ),
            ),
            const SizedBox(height: 16),
            ...List.generate(
              3,
              (i) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _shimmerBox(height: 210, radius: 24, t: t),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _shimmerBox({
    double? width,
    required double height,
    required double radius,
    required double t,
  }) {
    // Sweep a soft highlight across the skeleton as t goes 0→1.
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        gradient: LinearGradient(
          begin: Alignment(-1 + 2 * t, -1),
          end: Alignment(-1 + 2 * t + 0.8, 1),
          colors: [
            AppTheme.white,
            AppTheme.white.withValues(alpha: 0.55),
            AppTheme.white,
          ],
          stops: const [0.35, 0.5, 0.65],
        ),
      ),
      foregroundDecoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: AppTheme.skyBlue.withValues(alpha: 0.08),
        ),
      ),
    );
  }
}
