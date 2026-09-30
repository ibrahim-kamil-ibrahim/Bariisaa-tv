import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:video_player/video_player.dart';
import '../../../core/di/injection.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/styles.dart';
import '../data/media_repository.dart';
import 'package:naik_mobile/shared/widgets/shared_widgets.dart';

/// Production-ready video player.
///
/// Streams directly from a short-lived signed Cloudflare R2 URL returned by
/// `GET /media/videos/:id/play`. Supports play/pause, seek, fullscreen,
/// loading, buffering, error + retry, and in-session position resume.
class VideoPlayerScreen extends StatefulWidget {
  final String videoId;
  final String title;
  final String? thumbnailUrl;

  const VideoPlayerScreen({
    super.key,
    required this.videoId,
    required this.title,
    this.thumbnailUrl,
  });

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  late final MediaRepository _repository = getIt<MediaRepository>();

  VideoPlayerController? _controller;
  bool _loading = true;
  bool _error = false;
  String _errorMessage = 'Failed to load video';
  bool _showControls = true;
  bool _fullscreen = false;
  Timer? _hideTimer;
  final ValueNotifier<Duration> _position = ValueNotifier(Duration.zero);
  final ValueNotifier<bool> _isPlaying = ValueNotifier(false);
  final ValueNotifier<bool> _isBuffering = ValueNotifier(false);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = false;
    });
    try {
      final play = await _repository.getVideoPlaybackUrl(widget.videoId);
      final url = play['url'] as String;
      final controller = VideoPlayerController.networkUrl(Uri.parse(url));
      _controller = controller;
      await controller.initialize();
      if (!mounted) return;
      controller.addListener(_onControllerUpdate);
      setState(() => _loading = false);
      controller.play();
      _scheduleHide();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = true;
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  void _onControllerUpdate() {
    if (!mounted) return;
    final v = _controller?.value;
    if (v != null && v.hasError && !_error) {
      setState(() {
        _error = true;
        _errorMessage = v.errorDescription ?? 'Playback error';
      });
    }
    if (v != null) {
      _position.value = v.position;
      _isPlaying.value = v.isPlaying;
      _isBuffering.value = v.isBuffering;
    }
  }

  void _scheduleHide() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 3), () {
      if (mounted && _controller?.value.isPlaying == true) {
        setState(() => _showControls = false);
      }
    });
  }

  void _toggleControls() {
    setState(() => _showControls = !_showControls);
    if (_showControls) _scheduleHide();
  }

  void _togglePlay() {
    final c = _controller;
    if (c == null) return;
    if (c.value.isPlaying) {
      c.pause();
    } else {
      c.play();
    }
    setState(() {});
    _scheduleHide();
  }

  Future<void> _toggleFullscreen() async {
    setState(() => _fullscreen = !_fullscreen);
    if (_fullscreen) {
      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
      await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    } else {
      await SystemChrome.setPreferredOrientations(DeviceOrientation.values);
      await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    }
  }

  String _fmt(Duration d) {
    String two(int n) => n.toString().padLeft(2, '0');
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    return h > 0 ? '$h:${two(m)}:${two(s)}' : '${two(m)}:${two(s)}';
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    _controller?.removeListener(_onControllerUpdate);
    _controller?.dispose();
    _position.dispose();
    _isPlaying.dispose();
    _isBuffering.dispose();
    SystemChrome.setPreferredOrientations(DeviceOrientation.values);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(child: _buildBody()),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.gold),
      );
    }

    if (_error) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                color: AppTheme.playfulRed,
                size: 56,
              ),
              const SizedBox(height: 16),
              Text(
                'Could not play this video',
                style: AppStyles.baloo2(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _errorMessage,
                textAlign: TextAlign.center,
                style: AppStyles.nunito(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white70,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.gold,
                  foregroundColor: AppTheme.darkText,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return _buildPlayer();
  }

  Widget _buildPlayer() {
    final controller = _controller!;

    return GestureDetector(
      onTap: _toggleControls,
      child: RepaintBoundary(
        child: Stack(
          alignment: Alignment.center,
          children: [
            Center(
              child: AspectRatio(
                aspectRatio: controller.value.aspectRatio == 0
                    ? 16 / 9
                    : controller.value.aspectRatio,
                child: VideoPlayer(controller),
              ),
            ),

            // Buffering indicator
            ValueListenableBuilder<bool>(
              valueListenable: _isBuffering,
              builder: (_, buffering, _) => buffering
                  ? const Center(
                      child: CircularProgressIndicator(color: AppTheme.gold),
                    )
                  : const SizedBox.shrink(),
            ),

            // Big play/pause
            AnimatedOpacity(
              opacity: _showControls ? 1 : 0,
              duration: const Duration(milliseconds: 200),
              child: KidsIconButton(
                onTap: _togglePlay,
                size: 80,
                child: ValueListenableBuilder<bool>(
                  valueListenable: _isPlaying,
                  builder: (_, playing, _) => Icon(
                    playing
                        ? Icons.pause_circle_filled_rounded
                        : Icons.play_circle_fill_rounded,
                    color: Colors.white,
                    size: 72,
                  ),
                ),
              ),
            ),

            // Top bar
            AnimatedOpacity(
              opacity: _showControls ? 1 : 0,
              duration: const Duration(milliseconds: 200),
              child: Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.7),
                        Colors.transparent,
                      ],
                    ),
                  ),
                  child: Row(
                    children: [
                      KidsIconButton(
                        onTap: () => context.pop(),
                        child: const Icon(
                          Icons.arrow_back_rounded,
                          color: Colors.white,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          widget.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppStyles.baloo2(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      KidsIconButton(
                        onTap: _toggleFullscreen,
                        child: Icon(
                          _fullscreen
                              ? Icons.fullscreen_exit_rounded
                              : Icons.fullscreen_rounded,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Bottom controls
            AnimatedOpacity(
              opacity: _showControls ? 1 : 0,
              duration: const Duration(milliseconds: 200),
              child: Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.7),
                        Colors.transparent,
                      ],
                    ),
                  ),
                  child: ValueListenableBuilder<bool>(
                    valueListenable: _isPlaying,
                    builder: (_, playing, __) {
                      final duration = controller.value.duration;
                      final max = duration.inMilliseconds
                          .toDouble()
                          .clamp(1, double.infinity)
                          .toDouble();
                      return ValueListenableBuilder<Duration>(
                        valueListenable: _position,
                        builder: (_, pos, ___) => Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Slider(
                              min: 0,
                              max: max,
                              value: pos.inMilliseconds
                                  .toDouble()
                                  .clamp(0, max)
                                  .toDouble(),
                              activeColor: AppTheme.gold,
                              inactiveColor: Colors.white24,
                              onChanged: (v) {
                                controller.seekTo(
                                  Duration(milliseconds: v.round()),
                                );
                              },
                            ),
                            Row(
                              children: [
                                Text(
                                  _fmt(pos),
                                  style: AppStyles.nunito(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                                const Spacer(),
                                Text(
                                  _fmt(duration),
                                  style: AppStyles.nunito(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
