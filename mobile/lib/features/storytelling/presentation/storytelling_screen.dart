import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/widgets/content_cards.dart';
import '../../../shared/widgets/app_background.dart';
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
              return GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.62,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: 6,
                itemBuilder: (_, _) => const ContentCardSkeleton(),
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
    return RefreshIndicator(
      onRefresh: () async => context.read<StorytellingCubit>().loadStories(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (state.categories.isNotEmpty) ...[
              _buildCategoryChips(state),
              const SizedBox(height: 24),
            ],
            if (state.stories.isNotEmpty) ...[
              const BadgedSectionHeader(emoji: '🔥', title: 'Top Stories'),
              const SizedBox(height: 4),
              SizedBox(
                height: 230,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: state.stories.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 12),
                  itemBuilder: (context, index) => Stack(
                    children: [
                      SizedBox(
                        width: 160,
                        child: _storyCard(state.stories[index]),
                      ),
                      Positioned(
                        top: 8,
                        left: 8,
                        child: RankBadge(rank: index + 1),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const BadgedSectionHeader(emoji: '✨', title: 'New Stories'),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.62,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: state.stories.length,
                itemBuilder: (context, index) =>
                    _storyCard(state.stories[index]),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _storyCard(Map<String, dynamic> story) {
    return StoryCard(
      title: _s(story['title']) ?? 'Untitled',
      coverUrl: _s(story['coverUrl']),
      author: _s(story['author']),
      category: _s(story['category']),
      ageGroup: _s(story['ageGroup']),
      durationSeconds: _i(story['durationSeconds']),
    );
  }

  Widget _buildCategoryChips(StorytellingLoaded state) {
    final labels = state.categories
        .map((c) => c['name'] as String? ?? '')
        .toList();
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: labels.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
          decoration: BoxDecoration(
            color: AppTheme.cardPurple.withValues(alpha: 0.35),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: AppTheme.lightPurple.withValues(alpha: 0.4),
            ),
          ),
          child: Text(
            labels[index],
            style: AppStyles.nunito(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppTheme.darkNavy,
            ),
          ),
        ),
      ),
    );
  }
}
