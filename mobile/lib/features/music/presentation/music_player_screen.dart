import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:pdfrx/pdfrx.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/widgets/shared_widgets.dart';
import 'music_player_cubit.dart';
import 'music_player_state.dart';

class MusicPlayerScreen extends StatelessWidget {
  final Map<String, dynamic> track;
  final List<Map<String, dynamic>> playlist;
  final int index;

  const MusicPlayerScreen({
    super.key,
    required this.track,
    this.playlist = const [],
    this.index = 0,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: context.read<MusicPlayerCubit>()
        ..loadTrack(track, playlist: playlist, index: index),
      child: const _MusicPlayerContent(),
    );
  }
}

class _MusicPlayerContent extends StatelessWidget {
  const _MusicPlayerContent();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.deepNavy,
      body: BlocBuilder<MusicPlayerCubit, MusicPlayerState>(
        builder: (context, state) {
          if (state is MusicPlayerLoading)
            return const Center(child: LoadingMascot(message: 'Loading...'));
          if (state is MusicPlayerError)
            return FunErrorState(
              message: state.message,
              onRetry: () => Navigator.pop(context),
            );
          if (state is MusicPlayerLoaded) return _buildPlayer(context, state);
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildPlayer(BuildContext context, MusicPlayerLoaded state) {
    final screenWidth = MediaQuery.of(context).size.width;
    final coverSize = (screenWidth * 0.65).clamp(180.0, 280.0);
    final resolvedCover = state.coverUrl != null
        ? AppConstants.resolveUrl(state.coverUrl!)
        : null;
    final hasPdf = state.pdfUrl != null && state.pdfUrl!.isNotEmpty;

    return Container(
      decoration: BoxDecoration(gradient: AppTheme.heroGradient()),
      child: SafeArea(
        child: Column(
          children: [
            // Top bar
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
                    emoji: state.sleepTimerMinutes != null ? '😴' : '🎵',
                    size: 44,
                  ),
                  const Spacer(),
                  if (hasPdf)
                    GestureDetector(
                      onTap: () => _openPdf(context, state.pdfUrl!),
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppTheme.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(
                          Icons.picture_as_pdf_rounded,
                          size: 24,
                          color: AppTheme.white,
                        ),
                      ),
                    )
                  else
                    const SizedBox(width: 48),
                ],
              ),
            ),

            // Cover + Title
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
                      child: resolvedCover != null
                          ? CachedNetworkImage(
                              imageUrl: resolvedCover,
                              fit: BoxFit.cover,
                              memCacheWidth: 500,
                              memCacheHeight: 500,
                              placeholder: (_, _) =>
                                  Container(color: AppTheme.skyBlueLight),
                              errorWidget: (_, _, _) => Container(
                                color: AppTheme.skyBlueLight,
                                child: const Icon(
                                  Icons.music_note,
                                  size: 80,
                                  color: AppTheme.white,
                                ),
                              ),
                            )
                          : Container(
                              color: AppTheme.skyBlueLight,
                              child: const Icon(
                                Icons.music_note,
                                size: 80,
                                color: AppTheme.white,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Text(
                      state.title,
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
                  if (state.artist != null && state.artist!.isNotEmpty)
                    Text(
                      state.artist!,
                      style: AppStyles.nunito(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.white.withValues(alpha: 0.85),
                      ),
                    ),
                ],
              ),
            ),

            // Seek bar
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
                      onChanged: (v) => context.read<MusicPlayerCubit>().seek(
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

            // Main controls
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _controlButton(
                  Icons.replay_10_rounded,
                  () => context.read<MusicPlayerCubit>().skipBackward(),
                  46,
                ),
                const SizedBox(width: 14),
                _controlButton(
                  Icons.skip_previous_rounded,
                  () => context.read<MusicPlayerCubit>().previous(),
                  52,
                ),
                const SizedBox(width: 18),
                GestureDetector(
                  onTap: () =>
                      context.read<MusicPlayerCubit>().togglePlayPause(),
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
                  () => context.read<MusicPlayerCubit>().next(),
                  52,
                ),
                const SizedBox(width: 14),
                _controlButton(
                  Icons.forward_30_rounded,
                  () => context.read<MusicPlayerCubit>().skipForward(),
                  46,
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Secondary controls
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
                if (hasPdf) ...[
                  const SizedBox(width: 16),
                  _secondaryButton(
                    Icons.picture_as_pdf_rounded,
                    'PDF',
                    () => _openPdf(context, state.pdfUrl!),
                  ),
                ],
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
              color: AppTheme.white.withValues(alpha: 0.8),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDuration(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '${d.inHours > 0 ? '${d.inHours}:' : ''}$m:$s';
  }

  void _showSpeedSelector(BuildContext context) {
    final cubit = context.read<MusicPlayerCubit>();
    final current = (cubit.state as MusicPlayerLoaded?)?.playbackSpeed ?? 1.0;
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.deepNavy,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Playback Speed',
              style: AppStyles.baloo2(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.white,
              ),
            ),
            const SizedBox(height: 16),
            ...AppConstants.playbackSpeeds.map(
              (speed) => ListTile(
                title: Text(
                  '${speed}x',
                  style: AppStyles.nunito(fontSize: 16, color: AppTheme.white),
                ),
                trailing: speed == current
                    ? const Icon(Icons.check, color: AppTheme.sunnyYellow)
                    : null,
                onTap: () {
                  cubit.setPlaybackSpeed(speed);
                  Navigator.pop(context);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSleepTimer(BuildContext context) {
    final cubit = context.read<MusicPlayerCubit>();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.deepNavy,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Sleep Timer',
              style: AppStyles.baloo2(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.white,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              title: Text(
                'Off',
                style: AppStyles.nunito(fontSize: 16, color: AppTheme.white),
              ),
              onTap: () {
                cubit.cancelSleepTimer();
                Navigator.pop(context);
              },
            ),
            ...[5, 10, 15, 30, 45, 60].map(
              (m) => ListTile(
                title: Text(
                  '$m minutes',
                  style: AppStyles.nunito(fontSize: 16, color: AppTheme.white),
                ),
                onTap: () {
                  cubit.startSleepTimer(m);
                  Navigator.pop(context);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openPdf(BuildContext context, String pdfUrl) {
    final resolved = AppConstants.resolveUrl(pdfUrl);
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => _PdfViewerScreen(pdfUrl: resolved)),
    );
  }
}

class _PdfViewerScreen extends StatelessWidget {
  final String pdfUrl;
  const _PdfViewerScreen({required this.pdfUrl});

  bool get _isPdfSupported =>
      !kIsWeb && !Platform.isWindows && !Platform.isLinux && !Platform.isMacOS;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PDF Viewer'),
        backgroundColor: AppTheme.deepNavy,
        foregroundColor: AppTheme.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.open_in_new),
            tooltip: 'Open in browser',
            onPressed: () => launchUrl(
              Uri.parse(pdfUrl),
              mode: LaunchMode.externalApplication,
            ),
          ),
        ],
      ),
      body: _isPdfSupported
          ? PdfViewer.uri(
              Uri.parse(pdfUrl),
              params: PdfViewerParams(
                errorBannerBuilder: (context, error, stackTrace, documentRef) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          size: 48,
                          color: AppTheme.playfulRed,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Failed to load PDF',
                          style: AppStyles.nunito(
                            fontSize: 16,
                            color: AppTheme.charcoal,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: () => launchUrl(
                            Uri.parse(pdfUrl),
                            mode: LaunchMode.externalApplication,
                          ),
                          child: const Text('Open in browser'),
                        ),
                      ],
                    ),
                  );
                },
              ),
            )
          : Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.picture_as_pdf_rounded,
                    size: 64,
                    color: AppTheme.playfulRed,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'PDF viewer not available on this platform',
                    style: AppStyles.nunito(
                      fontSize: 16,
                      color: AppTheme.charcoal,
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () => launchUrl(
                      Uri.parse(pdfUrl),
                      mode: LaunchMode.externalApplication,
                    ),
                    icon: const Icon(Icons.open_in_new),
                    label: const Text('Open in browser'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.sunnyYellow,
                      foregroundColor: AppTheme.deepNavy,
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
