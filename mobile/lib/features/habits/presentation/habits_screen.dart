import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import 'package:naik_mobile/shared/animations/kids_motion.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../presentation/habits_cubit.dart';
import '../domain/habits_state.dart';
import '../../screen_theme/themed_screen_scaffold.dart';

class HabitsScreen extends StatefulWidget {
  const HabitsScreen({super.key});

  @override
  State<HabitsScreen> createState() => _HabitsScreenState();
}

class _HabitsScreenState extends State<HabitsScreen> {
  bool _celebrating = false;

  @override
  void initState() {
    super.initState();
    context.read<HabitsCubit>().loadMyStats();
  }

  void _completeHabit(String id) {
    setState(() => _celebrating = true);
    context.read<HabitsCubit>().completeHabit(id);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _celebrating = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'Habits',
      ),
      body: ThemedScreenScaffold(
        screenKey: 'habits',
        child: Stack(
          children: [
            BlocBuilder<HabitsCubit, HabitsState>(
              builder: (context, state) {
                if (state is HabitsLoading)
                  return const Center(child: CircularProgressIndicator());
                if (state is HabitsError)
                  return FunErrorState(
                    message: state.message,
                    onRetry: () => context.read<HabitsCubit>().loadHabits(),
                  );
                if (state is HabitsLoaded) {
                  return RefreshIndicator(
                    onRefresh: () async =>
                        context.read<HabitsCubit>().loadMyStats(),
                    child: ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        if (state.myStats != null)
                          _buildStats(context, state.myStats!),
                        const SizedBox(height: 16),
                        const BadgedSectionHeader(
                          emoji: '🔥',
                          title: 'Top Habits',
                        ),
                        ...state.habits
                            .take(3)
                            .map((h) => _buildHabitTile(context, h)),
                        if (state.habits.length > 3) ...[
                          const SizedBox(height: 16),
                          const BadgedSectionHeader(
                            emoji: '✨',
                            title: 'New Habits',
                          ),
                          ...state.habits
                              .skip(3)
                              .map((h) => _buildHabitTile(context, h)),
                        ],
                      ],
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
            if (_celebrating)
              Positioned.fill(
                child: IgnorePointer(
                  child: Center(
                    child: SparkleCelebration(size: 320, emoji: '🎉'),
                  ),
                ),
              ),
          ],
        ),
      ),
      bottomNavigationBar: const MainBottomNav(currentIndex: 4),
    );
  }

  Widget _buildStats(BuildContext context, List<dynamic> stats) {
    final totalStreak = stats.fold<int>(
      0,
      (sum, uh) => sum + ((uh['streak'] as int?) ?? 0),
    );
    final totalCompleted = stats.fold<int>(
      0,
      (sum, uh) => sum + ((uh['totalCompletions'] as int?) ?? 0),
    );
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.gridCardDecoration(AppTheme.skyBlue),
      child: Column(
        children: [
          Text(
            'Your Progress',
            style: AppStyles.baloo2(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppTheme.darkNavy,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _statChip('🔥', '$totalStreak', 'Day Streak'),
              _statChip('✅', '$totalCompleted', 'Completed'),
              _statChip('📊', '${stats.length}', 'Habits'),
            ],
          ),
          if (totalStreak > 0) ...[
            const SizedBox(height: 12),
            StreakCounter(days: totalStreak),
          ],
        ],
      ),
    );
  }

  Widget _statChip(String emoji, String value, String label) {
    return Column(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 24)),
        Text(
          value,
          style: AppStyles.nunito(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: AppTheme.darkNavy,
          ),
        ),
        Text(
          label,
          style: AppStyles.nunito(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppTheme.charcoal,
          ),
        ),
      ],
    );
  }

  Widget _buildHabitTile(BuildContext context, dynamic habit) {
    final h = habit is Map<String, dynamic> ? habit : {};
    final title = h['title'] as String? ?? 'Habit';
    final emoji = h['emoji'] as String? ?? '⭐';
    final category = h['category'] as String? ?? '';
    final id = h['id'] as String? ?? '';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: AppTheme.cardDecoration(),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 32)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppStyles.nunito(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.darkNavy,
                  ),
                ),
                if (category.isNotEmpty)
                  Text(
                    category,
                    style: AppStyles.nunito(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.charcoal,
                    ),
                  ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => _completeHabit(id),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: AppTheme.funButtonDecoration(AppTheme.mintGreen),
              child: const Icon(Icons.check, color: AppTheme.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}
