import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/models/models.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../presentation/audio_player_cubit.dart';
import '../domain/audio_player_state.dart';
import '../../screen_theme/themed_screen_scaffold.dart';

class AudioPlayerScreen extends StatelessWidget {
  final BookModel book;
  const AudioPlayerScreen({super.key, required this.book});

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: context.read<AudioPlayerCubit>()..loadBook(book),
      child: const _AudioPlayerContent(),
    );
  }
}

class _AudioPlayerContent extends StatelessWidget {
  const _AudioPlayerContent();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ThemedScreenScaffold(
        screenKey: 'player',
        child: BlocBuilder<AudioPlayerCubit, AudioPlayerState>(
          builder: (context, state) {
            if (state is AudioPlayerLoading)
              return const LoadingMascot(message: 'Getting ready...');
            if (state is AudioPlayerError)
              return FunErrorState(
                message: state.message,
                onRetry: () => Navigator.pop(context),
              );
            if (state is AudioPlayerLoaded) return _buildPlayer(context, state);
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildPlayer(BuildContext context, AudioPlayerLoaded state) {
    final book = state.book;
    final chapters = book.audioFile?.chapters ?? [];
    final currentChapter = state.currentChapterIndex < chapters.length
        ? chapters[state.currentChapterIndex]
        : null;
    final screenWidth = MediaQuery.of(context).size.width;
    final coverSize = (screenWidth * 0.65).clamp(180.0, 280.0);

    return Container(
      decoration: BoxDecoration(gradient: AppTheme.heroGradient()),
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppTheme.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.keyboard_arrow_down,
                        size: 28,
                        color: AppTheme.white,
                      ),
                    ),
                  ),
                  const Spacer(),
                  MascotBubble(
                    emoji: state.sleepTimerMinutes != null ? '😴' : '🎧',
                    size: 44,
                  ),
                  const Spacer(),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: coverSize,
                    height: coverSize,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.white.withValues(alpha: 0.25),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(28),
                      child: CachedNetworkImage(
                        imageUrl: book.coverUrl != null ? AppConstants.resolveUrl(book.coverUrl!) : '',
                        fit: BoxFit.cover,
                        memCacheWidth: 500,
                        memCacheHeight: 500,
                        placeholder: (_, _) =>
                            Container(color: AppTheme.skyBlueLight),
                        errorWidget: (_, _, _) => Container(
                          color: AppTheme.skyBlueLight,
                          child: const Icon(
                            Icons.auto_stories,
                            size: 80,
                            color: AppTheme.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Text(
                      book.title,
                      style: AppStyles.baloo2(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.white,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    book.authors.isNotEmpty ? book.authors.first.name : '',
                    style: AppStyles.nunito(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.white.withValues(alpha: 0.85),
                    ),
                  ),
                  if (currentChapter != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      currentChapter.title,
                      style: AppStyles.nunito(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.white.withValues(alpha: 0.7),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                children: [
                  SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      trackHeight: 8,
                      thumbShape: const RoundSliderThumbShape(
                        enabledThumbRadius: 14,
                      ),
                      overlayShape: const RoundSliderOverlayShape(
                        overlayRadius: 28,
                      ),
                      activeTrackColor: AppTheme.sunnyYellow,
                      inactiveTrackColor: AppTheme.white.withValues(
                        alpha: 0.35,
                      ),
                      thumbColor: AppTheme.sunnyYellow,
                      overlayColor: AppTheme.sunnyYellow.withValues(
                        alpha: 0.15,
                      ),
                    ),
                    child: Slider(
                      value: state.duration.inSeconds > 0
                          ? state.position.inSeconds.toDouble()
                          : 0,
                      max: state.duration.inSeconds > 0
                          ? state.duration.inSeconds.toDouble()
                          : 1,
                      onChanged: (v) => context.read<AudioPlayerCubit>().seek(
                        Duration(seconds: v.toInt()),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _formatDuration(state.position),
                          style: AppStyles.nunito(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.white.withValues(alpha: 0.85),
                          ),
                        ),
                        Text(
                          '-${_formatDuration(state.duration - state.position)}',
                          style: AppStyles.nunito(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.white.withValues(alpha: 0.85),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _controlButton(
                  Icons.replay_10_rounded,
                  () => context.read<AudioPlayerCubit>().skipBackward(),
                  46,
                ),
                const SizedBox(width: 14),
                _controlButton(
                  Icons.skip_previous_rounded,
                  () => context.read<AudioPlayerCubit>().seekToChapter(
                    state.currentChapterIndex - 1,
                  ),
                  52,
                ),
                const SizedBox(width: 18),
                GestureDetector(
                  onTap: () =>
                      context.read<AudioPlayerCubit>().togglePlayPause(),
                  child: Container(
                    width: 88,
                    height: 88,
                    decoration: BoxDecoration(
                      color: AppTheme.sunnyYellow,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.sunnyYellow.withValues(alpha: 0.4),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Icon(
                      state.isPlaying
                          ? Icons.pause_rounded
                          : Icons.play_arrow_rounded,
                      size: 50,
                      color: AppTheme.deepNavy,
                    ),
                  ),
                ),
                const SizedBox(width: 18),
                _controlButton(
                  Icons.skip_next_rounded,
                  () => context.read<AudioPlayerCubit>().seekToChapter(
                    state.currentChapterIndex + 1,
                  ),
                  52,
                ),
                const SizedBox(width: 14),
                _controlButton(
                  Icons.forward_30_rounded,
                  () => context.read<AudioPlayerCubit>().skipForward(),
                  46,
                ),
              ],
            ),

            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _secondaryButton(
                  Icons.speed_rounded,
                  '${state.playbackSpeed}x',
                  () => _showSpeedSelector(context),
                ),
                const SizedBox(width: 16),
                _secondaryButton(
                  Icons.bedtime_rounded,
                  state.sleepTimerMinutes != null
                      ? '${state.sleepTimerMinutes}m'
                      : 'Sleep',
                  () => _showSleepTimer(context),
                ),
                const SizedBox(width: 16),
                _secondaryButton(
                  Icons.bookmark_border_rounded,
                  'Bookmark',
                  () => _bookmark(context),
                ),
                const SizedBox(width: 16),
                _secondaryButton(
                  Icons.more_horiz_rounded,
                  'More',
                  () => _showMoreSheet(context, state),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _controlButton(IconData icon, VoidCallback onPressed, double size) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: AppTheme.white.withValues(alpha: 0.2),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: size * 0.5, color: AppTheme.white),
      ),
    );
  }

  Widget _secondaryButton(IconData icon, String label, VoidCallback onPressed) {
    return GestureDetector(
      onTap: onPressed,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppTheme.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, size: 24, color: AppTheme.white),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppStyles.nunito(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppTheme.white.withValues(alpha: 0.85),
            ),
          ),
        ],
      ),
    );
  }

  void _showMoreSheet(BuildContext context, AudioPlayerLoaded state) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 12),
            Center(
              child: Container(
                width: 40,
                height: 5,
                decoration: BoxDecoration(
                  color: AppTheme.softPurple,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                'More',
                style: AppStyles.baloo2(
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.darkNavy,
                ),
              ),
            ),
            const SizedBox(height: 8),
            _moreTile('📚', 'Chapters', '', () {
              Navigator.pop(ctx);
              _showChapters(context, state);
            }),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _moreTile(
    String emoji,
    String label,
    String trailing,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppTheme.creamBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.softPurple, width: 1.5),
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 22)),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: AppStyles.nunito(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.darkNavy,
                ),
              ),
            ),
            if (trailing.isNotEmpty)
              Text(
                trailing,
                style: AppStyles.nunito(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.charcoal,
                ),
              ),
            const Icon(Icons.chevron_right_rounded, color: AppTheme.charcoal),
          ],
        ),
      ),
    );
  }

  void _bookmark(BuildContext context) {
    context.read<AudioPlayerCubit>().addBookmark();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Bookmark added!',
          style: AppStyles.nunito(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppTheme.white,
          ),
        ),
        backgroundColor: AppTheme.mintGreen,
      ),
    );
  }

  void _showSpeedSelector(BuildContext context) {
    final cubit = context.read<AudioPlayerCubit>();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Speed',
              style: AppStyles.baloo2(
                fontSize: 26,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
            const SizedBox(height: 20),
            Center(
              child: Wrap(
                alignment: WrapAlignment.center,
                spacing: 12,
                runSpacing: 12,
                children: AppConstants.playbackSpeeds.map((speed) {
                  final loaded = cubit.state is AudioPlayerLoaded
                      ? cubit.state as AudioPlayerLoaded
                      : null;
                  final isSelected = loaded?.playbackSpeed == speed;
                  return GestureDetector(
                    onTap: () {
                      cubit.setPlaybackSpeed(speed);
                      Navigator.pop(ctx);
                    },
                    child: Container(
                      width: 68,
                      height: 68,
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppTheme.sunnyYellow
                            : AppTheme.creamBg,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected
                              ? AppTheme.sunnyYellow
                              : AppTheme.skyBlue.withValues(alpha: 0.2),
                          width: 2.5,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          '${speed}x',
                          style: AppStyles.nunito(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.darkNavy,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSleepTimer(BuildContext context) {
    final cubit = context.read<AudioPlayerCubit>();
    final options = AppConstants.sleepTimerMinutes;
    String iconFor(int m) => m <= 5
        ? '⏰'
        : m <= 15
        ? '🌙'
        : '😴';
    final currentLoaded = cubit.state is AudioPlayerLoaded
        ? cubit.state as AudioPlayerLoaded
        : null;
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Sleep Timer',
              style: AppStyles.baloo2(
                fontSize: 26,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
            const SizedBox(height: 20),
            Center(
              child: Wrap(
                alignment: WrapAlignment.center,
                spacing: 12,
                runSpacing: 12,
                children: options.map((minutes) {
                  final isCurrent = currentLoaded?.sleepTimerMinutes == minutes;
                  return GestureDetector(
                    onTap: () {
                      cubit.setSleepTimer(minutes);
                      Navigator.pop(ctx);
                    },
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 58,
                          height: 58,
                          decoration: isCurrent
                              ? AppTheme.gridCardDecoration(
                                  AppTheme.sunnyYellow,
                                )
                              : AppTheme.gridCardDecoration(AppTheme.skyBlue),
                          child: Center(
                            child: Text(
                              iconFor(minutes),
                              style: const TextStyle(fontSize: 28),
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '$minutes min',
                          style: AppStyles.nunito(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.darkNavy,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            if (currentLoaded?.sleepTimerMinutes != null) ...[
              const SizedBox(height: 20),
              GestureDetector(
                onTap: () {
                  cubit.cancelSleepTimer();
                  Navigator.pop(ctx);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: AppTheme.funButtonDecoration(AppTheme.softAmber),
                  child: Center(
                    child: Text(
                      'Cancel Timer',
                      style: AppStyles.nunito(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.deepNavy,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showChapters(BuildContext context, AudioPlayerLoaded state) {
    final chapters = state.book.audioFile?.chapters ?? [];
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Chapters',
              style: AppStyles.baloo2(
                fontSize: 26,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
            const SizedBox(height: 16),
            ...chapters.asMap().entries.map((entry) {
              final index = entry.key;
              final chapter = entry.value;
              final isCurrent = index == state.currentChapterIndex;
              return GestureDetector(
                onTap: () {
                  context.read<AudioPlayerCubit>().seekToChapter(index);
                  Navigator.pop(ctx);
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  decoration: isCurrent
                      ? AppTheme.gridCardDecoration(AppTheme.sunnyYellow)
                      : BoxDecoration(
                          color: AppTheme.creamBg,
                          borderRadius: BorderRadius.circular(16),
                        ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          chapter.title,
                          style: AppStyles.nunito(
                            fontSize: 16,
                            fontWeight: isCurrent
                                ? FontWeight.w800
                                : FontWeight.w600,
                            color: AppTheme.darkNavy,
                          ),
                        ),
                      ),
                      Text(
                        _formatDuration(
                          Duration(seconds: chapter.startSeconds),
                        ),
                        style: AppStyles.nunito(
                          fontSize: 14,
                          color: AppTheme.charcoal,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  String _formatDuration(Duration d) {
    final hours = d.inHours;
    final minutes = d.inMinutes.remainder(60);
    final seconds = d.inSeconds.remainder(60);
    if (hours > 0)
      return '$hours:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }
}
