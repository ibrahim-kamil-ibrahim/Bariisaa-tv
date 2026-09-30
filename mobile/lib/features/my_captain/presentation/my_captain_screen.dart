import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/widgets/app_background.dart';
import '../presentation/my_captain_cubit.dart';
import '../domain/my_captain_state.dart';

class MyCaptainScreen extends StatefulWidget {
  const MyCaptainScreen({super.key});

  @override
  State<MyCaptainScreen> createState() => _MyCaptainScreenState();
}

class _MyCaptainScreenState extends State<MyCaptainScreen> {
  @override
  void initState() {
    super.initState();
    context.read<MyCaptainCubit>().loadCaptainData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'My Captain',
      ),
      body: BlocBuilder<MyCaptainCubit, MyCaptainState>(
          builder: (context, state) {
            if (state is MyCaptainLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is MyCaptainError) {
              return FunErrorState(
                message: state.message,
                onRetry: () => context.read<MyCaptainCubit>().loadCaptainData(),
              );
            }
            if (state is MyCaptainLoaded) {
              if (state.achievements.isEmpty && state.leaderboard.isEmpty) {
                return FunEmptyState(
                  emoji: '🧑‍✈️',
                  title: 'Set Sail Soon!',
                  subtitle:
                      'Achievements and leaderboard will appear here once data is added.',
                );
              }
              return _buildContent(state);
            }
            return const Center(child: CircularProgressIndicator());
          },
      ),
      bottomNavigationBar: const MainBottomNav(currentIndex: -1),
    );
  }

  Widget _buildContent(MyCaptainLoaded state) {
    final days = state.profile['days'];
    return RefreshIndicator(
      onRefresh: () async => context.read<MyCaptainCubit>().loadCaptainData(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildCaptainHeader(state.profile),
            const SizedBox(height: 12),
            if (days is num && days > 0) ...[
              StreakCounter(days: days.toInt()),
              const SizedBox(height: 12),
            ],
            _buildStatsRow(state.profile),
            const SizedBox(height: 24),
            if (state.achievements.isNotEmpty) ...[
              const BadgedSectionHeader(emoji: '✨', title: 'New Achievements'),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  childAspectRatio: 0.9,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: state.achievements.length,
                itemBuilder: (context, index) =>
                    _buildAchievementCard(state.achievements[index], index),
              ),
              const SizedBox(height: 24),
            ],
            if (state.leaderboard.isNotEmpty) ...[
              const BadgedSectionHeader(emoji: '🔥', title: 'Top Players'),
              ...state.leaderboard.map((entry) {
                final name = entry['playerName'] as String? ?? 'Player';
                final score = entry['score'] ?? 0;
                final rank = (entry['rank'] as num?)?.toInt() ?? 0;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: AppTheme.cardDecoration(),
                    child: Row(
                      children: [
                        Text(
                          _rankMedal(rank),
                          style: const TextStyle(fontSize: 24),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            name,
                            style: AppStyles.nunito(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.creamText,
                            ),
                          ),
                        ),
                        Text(
                          '$score pts',
                          style: AppStyles.nunito(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.darkNavy,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCaptainHeader(Map<String, dynamic> profile) {
    final welcome =
        profile['welcome'] as String? ?? 'Set sail on a learning adventure!';
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppTheme.gridCardDecoration(AppTheme.sunnyYellow),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: AppTheme.funButtonDecoration(AppTheme.gold),
            child: const Text('🧑‍✈️', style: TextStyle(fontSize: 32)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Captain\'s Log',
                  style: AppStyles.baloo2(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.darkNavy,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  welcome,
                  style: AppStyles.nunito(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.softWhite,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(Map<String, dynamic> profile) {
    final stars = (profile['stars'] ?? 0).toString();
    final days = (profile['days'] ?? 0).toString();
    final missions = (profile['missions'] ?? 0).toString();
    final stats = [
      {'value': stars, 'label': 'Stars', 'emoji': '⭐'},
      {'value': days, 'label': 'Days', 'emoji': '📅'},
      {'value': missions, 'label': 'Missions', 'emoji': '🎯'},
    ];
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: stats.map((s) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          decoration: AppTheme.gridCardDecoration(AppTheme.sunnyYellow),
          child: Column(
            children: [
              Text(s['emoji']!, style: const TextStyle(fontSize: 24)),
              const SizedBox(height: 4),
              Text(
                s['value']!,
                style: AppStyles.baloo2(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.darkNavy,
                ),
              ),
              Text(
                s['label']!,
                style: AppStyles.nunito(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.softWhite,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildAchievementCard(Map<String, dynamic> achievement, int index) {
    final emoji =
        achievement['emoji'] as String? ?? _defaultAchievementEmoji(index);
    final title = achievement['title'] as String?;
    final points = achievement['points'];
    final isHidden = achievement['isHidden'] == true || points == null;
    return Container(
      decoration: isHidden
          ? BoxDecoration(
              color: AppTheme.cardPurple.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppTheme.lightPurple.withValues(alpha: 0.2),
              ),
            )
          : AppTheme.gridCardDecoration(AppTheme.sunnyYellow),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            isHidden ? '🔒' : emoji,
            style: TextStyle(
              fontSize: 28,
              color: isHidden ? AppTheme.lightPurple : null,
            ),
          ),
          const SizedBox(height: 6),
          if (title != null)
            Text(
              title,
              style: AppStyles.nunito(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: isHidden ? AppTheme.softWhite : AppTheme.creamText,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          if (points != null)
            Text(
              '$points pts',
              style: AppStyles.nunito(
                fontSize: 9,
                fontWeight: FontWeight.w500,
                color: AppTheme.softWhite,
              ),
            ),
        ],
      ),
    );
  }

  String _rankMedal(int rank) {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '#$rank';
    }
  }

  String _defaultAchievementEmoji(int index) {
    const emojis = ['⭐', '🏆', '🎯', '💎', '🔥', '🌈'];
    return emojis[index % emojis.length];
  }
}
