import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';

/// YouTube-style overlay player for an already-initialised
/// [VideoPlayerController].
///
/// * single tap toggles the controls (200 ms fade, auto-hide after 3 s while
///   playing, controls stay visible while paused)
/// * double tap on the left/right third seeks -10 s / +10 s with an
///   accumulating ripple ("10 seconds", "20 seconds", ...)
/// * thin YouTube-red progress bar with buffered segment, scrub thumb and a
///   time preview while dragging; a 2 px red line stays visible when the
///   controls are hidden
/// * fullscreen button toggles landscape + immersive mode (back button or the
///   on-screen arrow leaves fullscreen first)
/// * playback speed menu, buffering spinner, replay when the video ends
///
/// Every [Positioned] here is a direct child of its [Stack]; the fade
/// animation always lives *inside* the [Positioned].
///
/// The widget never disposes [controller] — the caller owns it.
class YoutubeStylePlayer extends StatefulWidget {
  const YoutubeStylePlayer({
    super.key,
    required this.controller,
    this.radius = const BorderRadius.all(Radius.circular(16)),
    this.autoHideDelay = const Duration(seconds: 3),
  });

  final VideoPlayerController controller;
  final BorderRadius radius;
  final Duration autoHideDelay;

  @override
  State<YoutubeStylePlayer> createState() => _YoutubeStylePlayerState();
}

class _YoutubeStylePlayerState extends State<YoutubeStylePlayer>
    with TickerProviderStateMixin, WidgetsBindingObserver {
  late final VideoPlayerController _c = widget.controller;

  bool _showControls = true;
  bool _fullscreen = false;
  OverlayEntry? _fsEntry;

  Timer? _hideTimer;
  Timer? _seekTimer;
  int _seekAccum = 0;
  bool _seekForward = true;
  bool _seekHintVisible = false;

  bool _scrubbing = false;
  Duration _scrubPos = Duration.zero;

  double _speed = 1.0;

  AnimationController? _iconAnim;
  AnimationController? _hintAnim;

  final ValueNotifier<bool> _isPlaying = ValueNotifier<bool>(false);
  final ValueNotifier<bool> _isBuffering = ValueNotifier<bool>(false);
  final ValueNotifier<Duration> _position =
      ValueNotifier<Duration>(Duration.zero);

  bool get _ended {
    final d = _c.value.duration;
    return d.inMilliseconds > 0 &&
        _c.value.position.inMilliseconds >= d.inMilliseconds - 50;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _iconAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
      value: _c.value.isPlaying ? 1 : 0,
    );
    _hintAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 220),
    );
    _isPlaying.value = _c.value.isPlaying;
    _isBuffering.value = _c.value.isBuffering;
    _position.value = _c.value.position;
    _c.addListener(_onControllerUpdate);
    if (_c.value.isPlaying) _scheduleHide();
  }

  void _onControllerUpdate() {
    if (!mounted) return;
    final v = _c.value;
    _isPlaying.value = v.isPlaying;
    _isBuffering.value = v.isBuffering;
    if (!_scrubbing) _position.value = v.position;

    final anim = _iconAnim;
    if (anim != null && !anim.isAnimating) {
      final target = v.isPlaying ? 1.0 : 0.0;
      if (anim.value != target) anim.animateTo(target);
    }

    if (!_showControls && (!v.isPlaying || _ended)) {
      _showControls = true;
      _refresh();
    }
  }

  /// setState + refresh of the fullscreen overlay (same state, other tree).
  void _refresh() {
    if (!mounted) return;
    setState(() {});
    final entry = _fsEntry;
    if (entry == null) return;
    if (SchedulerBinding.instance.schedulerPhase ==
        SchedulerPhase.persistentCallbacks) {
      SchedulerBinding.instance.addPostFrameCallback((_) {
        if (mounted) entry.markNeedsBuild();
      });
    } else {
      entry.markNeedsBuild();
    }
  }

  void _scheduleHide() {
    _hideTimer?.cancel();
    _hideTimer = Timer(widget.autoHideDelay, () {
      if (!mounted) return;
      if (_c.value.isPlaying && !_scrubbing && !_ended && _showControls) {
        _showControls = false;
        _refresh();
      }
    });
  }

  void _toggleControls() {
    if (_showControls) {
      _hideTimer?.cancel();
      _showControls = false;
      _refresh();
    } else {
      _showControls = true;
      _refresh();
      if (_c.value.isPlaying) _scheduleHide();
    }
  }

  void _togglePlay() {
    if (_ended) {
      _c.seekTo(Duration.zero);
      _c.play();
      _scheduleHide();
    } else if (_c.value.isPlaying) {
      _c.pause();
      _hideTimer?.cancel();
      _showControls = true;
    } else {
      _c.play();
      _scheduleHide();
    }
    _refresh();
  }

  void _handleDoubleTap(double dx, double width) {
    if (width <= 0) return;
    final third = width / 3;
    final int dir = dx < third ? -1 : (dx > third * 2 ? 1 : 0);
    if (dir == 0) return;

    final delta = 10 * dir;
    if (_seekTimer?.isActive == true &&
        _seekAccum != 0 &&
        _seekAccum.sign == dir) {
      _seekAccum += delta;
    } else {
      _seekAccum = delta;
    }

    final durMs = _c.value.duration.inMilliseconds;
    int target = _c.value.position.inMilliseconds + delta;
    if (target < 0) target = 0;
    if (durMs > 0 && target > durMs) target = durMs;
    _c.seekTo(Duration(milliseconds: target));

    _seekForward = dir > 0;
    _seekHintVisible = true;
    _hintAnim?.forward(from: 0);
    _seekTimer?.cancel();
    _seekTimer = Timer(const Duration(milliseconds: 900), _clearSeekHint);
    _refresh();
  }

  void _clearSeekHint() {
    if (!mounted) return;
    _seekHintVisible = false;
    _seekAccum = 0;
    _hintAnim?.value = 0;
    _refresh();
    if (_c.value.isPlaying) _scheduleHide();
  }

  void _startScrub(double dx, double width) {
    _hideTimer?.cancel();
    _scrubbing = true;
    _scrubTo(dx, width);
  }

  void _scrubTo(double dx, double width) {
    final durMs = _c.value.duration.inMilliseconds;
    if (durMs <= 0 || width <= 0) return;
    final f = (dx / width).clamp(0.0, 1.0);
    _scrubPos = Duration(milliseconds: (durMs * f).round());
    _refresh();
  }

  void _endScrub() {
    if (!_scrubbing) return;
    final p = _scrubPos;
    _scrubbing = false;
    _c.seekTo(p);
    _refresh();
    if (_c.value.isPlaying) _scheduleHide();
  }

  Future<void> _setFullscreen(bool value) async {
    if (_fullscreen == value || !mounted) return;
    _fullscreen = value;
    if (value) {
      _fsEntry = OverlayEntry(builder: (_) => _buildFullscreenOverlay());
      Overlay.of(context, rootOverlay: true).insert(_fsEntry!);
      await SystemChrome.setPreferredOrientations(const [
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
      await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    } else {
      _fsEntry?.remove();
      _fsEntry = null;
      await SystemChrome.setPreferredOrientations(DeviceOrientation.values);
      await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    }
    _refresh();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.hidden ||
        state == AppLifecycleState.detached) {
      if (_c.value.isPlaying) _c.pause();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _hideTimer?.cancel();
    _seekTimer?.cancel();
    _c.removeListener(_onControllerUpdate);
    _iconAnim?.dispose();
    _hintAnim?.dispose();
    _position.dispose();
    _isPlaying.dispose();
    _isBuffering.dispose();
    if (_fullscreen) {
      _fsEntry?.remove();
      _fsEntry = null;
      SystemChrome.setPreferredOrientations(DeviceOrientation.values);
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_fullscreen,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _setFullscreen(false);
      },
      child: _fullscreen ? const SizedBox.shrink() : _buildUi(embedded: true),
    );
  }

  Widget _buildFullscreenOverlay() {
    return ColoredBox(
      color: Colors.black,
      child: SafeArea(child: Center(child: _buildUi(embedded: false))),
    );
  }

  Widget _buildUi({required bool embedded}) {
    final v = _c.value;
    final ar = v.aspectRatio == 0 ? 16 / 9 : v.aspectRatio;
    final content = AspectRatio(
      aspectRatio: ar,
      child: _buildStack(embedded: embedded),
    );
    if (embedded) return ClipRRect(borderRadius: widget.radius, child: content);
    return content;
  }

  Widget _buildStack({required bool embedded}) {
    return Stack(
      fit: StackFit.expand,
      children: [
        LayoutBuilder(
          builder: (context, constraints) => GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: _toggleControls,
            onDoubleTapDown: (d) =>
                _handleDoubleTap(d.localPosition.dx, constraints.maxWidth),
            onDoubleTap: () {},
            child: VideoPlayer(_c),
          ),
        ),

        ValueListenableBuilder<bool>(
          valueListenable: _isBuffering,
          builder: (_, buffering, _) => buffering
              ? const Center(
                  child: SizedBox(
                    width: 36,
                    height: 36,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 3,
                    ),
                  ),
                )
              : const SizedBox.shrink(),
        ),

        Center(
          child: IgnorePointer(
            ignoring: !_showControls,
            child: AnimatedOpacity(
              opacity: _showControls ? 1 : 0,
              duration: const Duration(milliseconds: 200),
              child: _centerButton(),
            ),
          ),
        ),

        // Top scrim + back (fullscreen) / speed menu.
        Positioned(
          left: 0,
          right: 0,
          top: 0,
          child: IgnorePointer(
            ignoring: !_showControls,
            child: AnimatedOpacity(
              opacity: _showControls ? 1 : 0,
              duration: const Duration(milliseconds: 200),
              child: _topBar(embedded: embedded),
            ),
          ),
        ),

        // Bottom scrim + time + fullscreen + progress bar.
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: IgnorePointer(
            ignoring: !_showControls,
            child: AnimatedOpacity(
              opacity: _showControls ? 1 : 0,
              duration: const Duration(milliseconds: 200),
              child: _bottomBar(),
            ),
          ),
        ),

        // Always-on thin red line while the controls are hidden.
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: IgnorePointer(
            child: AnimatedOpacity(
              opacity: _showControls ? 0 : 1,
              duration: const Duration(milliseconds: 200),
              child: _thinProgress(),
            ),
          ),
        ),

        // Double-tap seek ripple.
        IgnorePointer(
          child: AnimatedOpacity(
            opacity: _seekHintVisible ? 1 : 0,
            duration: const Duration(milliseconds: 150),
            child: Align(
              alignment: _seekForward
                  ? Alignment.centerRight
                  : Alignment.centerLeft,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: _seekHintBadge(),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _centerButton() {
    return ValueListenableBuilder<bool>(
      valueListenable: _isPlaying,
      builder: (context, isPlaying, _) {
        final glyph = _ended
            ? const Icon(Icons.replay_rounded, color: Colors.white, size: 44)
            : AnimatedIcon(
                progress: _iconAnim!,
                icon: AnimatedIcons.play_pause,
                color: Colors.white,
                size: 44,
              );
        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: _togglePlay,
          child: Container(
            width: 76,
            height: 76,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: Colors.black45,
              shape: BoxShape.circle,
            ),
            child: glyph,
          ),
        );
      },
    );
  }

  Widget _topBar({required bool embedded}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.black54, Colors.transparent],
        ),
      ),
      child: Row(
        children: [
          if (embedded)
            const SizedBox(width: 44)
          else
            IconButton(
              onPressed: () => _setFullscreen(false),
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
            ),
          const Spacer(),
          _speedMenu(),
        ],
      ),
    );
  }

  Widget _speedMenu() {
    return PopupMenuButton<double>(
      tooltip: 'Playback speed',
      icon: const Icon(Icons.speed_rounded, color: Colors.white, size: 22),
      color: const Color(0xFF212121),
      onSelected: (s) {
        _c.setPlaybackSpeed(s);
        _speed = s;
        _refresh();
      },
      itemBuilder: (_) => [0.5, 1.0, 1.5, 2.0]
          .map(
            (s) => CheckedPopupMenuItem<double>(
              value: s,
              checked: s == _speed,
              child: Text(
                '${s}x',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          )
          .toList(),
    );
  }

  Widget _bottomBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 8, 4),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [Colors.black54, Colors.transparent],
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              ValueListenableBuilder<Duration>(
                valueListenable: _position,
                builder: (_, pos, _) {
                  final shown = _scrubbing ? _scrubPos : pos;
                  return Text(
                    '${_fmt(shown)} / ${_fmt(_c.value.duration)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  );
                },
              ),
              const Spacer(),
              IconButton(
                onPressed: () => _setFullscreen(!_fullscreen),
                icon: Icon(
                  _fullscreen
                      ? Icons.fullscreen_exit_rounded
                      : Icons.fullscreen_rounded,
                  color: Colors.white,
                  size: 26,
                ),
              ),
            ],
          ),
          _progressBar(),
        ],
      ),
    );
  }

  Widget _thinProgress() {
    return ValueListenableBuilder<Duration>(
      valueListenable: _position,
      builder: (_, pos, _) => LayoutBuilder(
        builder: (context, constraints) {
          final w = constraints.maxWidth;
          final totalMs = _c.value.duration.inMilliseconds;
          final frac = totalMs <= 0
              ? 0.0
              : (pos.inMilliseconds / totalMs).clamp(0.0, 1.0);
          return SizedBox(
            height: 2,
            child: Stack(
              children: [
                Positioned(
                  left: 0,
                  right: 0,
                  top: 0,
                  child: ColoredBox(color: Colors.white24),
                ),
                Positioned(
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: w * frac,
                  child: const ColoredBox(color: Color(0xFFFF0000)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _progressBar() {
    return ValueListenableBuilder<Duration>(
      valueListenable: _position,
      builder: (_, pos, _) {
        final duration = _c.value.duration;
        final totalMs = duration.inMilliseconds <= 0
            ? 1
            : duration.inMilliseconds;
        final shown = _scrubbing ? _scrubPos : pos;
        final frac = (shown.inMilliseconds / totalMs).clamp(0.0, 1.0);
        double bufferedFrac = 0;
        final ranges = _c.value.buffered;
        if (ranges.isNotEmpty) {
          bufferedFrac =
              (ranges.last.end.inMilliseconds / totalMs).clamp(0.0, 1.0);
        }

        return LayoutBuilder(
          builder: (context, constraints) {
            final w = constraints.maxWidth;
            final thumbX = (w * frac).clamp(0.0, w);
            return GestureDetector(
              behavior: HitTestBehavior.opaque,
              onHorizontalDragStart: (d) => _startScrub(d.localPosition.dx, w),
              onHorizontalDragUpdate: (d) => _scrubTo(d.localPosition.dx, w),
              onHorizontalDragEnd: (_) => _endScrub(),
              onHorizontalDragCancel: _endScrub,
              onTapDown: (d) => _startScrub(d.localPosition.dx, w),
              onTapUp: (_) => _endScrub(),
              child: SizedBox(
                height: _scrubbing ? 44 : 16,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Positioned(
                      left: 0,
                      right: 0,
                      child: Container(
                        height: 3,
                        decoration: BoxDecoration(
                          color: Colors.white24,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    Positioned(
                      left: 0,
                      width: w * bufferedFrac,
                      child: Container(height: 3, color: Colors.white70),
                    ),
                    Positioned(
                      left: 0,
                      width: w * frac,
                      child: Container(height: 3, color: const Color(0xFFFF0000)),
                    ),
                    if (_scrubbing) ...[
                      Positioned(
                        left: (thumbX - 34).clamp(0.0, w - 68),
                        top: 0,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.85),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            _fmt(shown),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        left: (thumbX - 7).clamp(0.0, w - 14),
                        child: Container(
                          width: 14,
                          height: 14,
                          decoration: const BoxDecoration(
                            color: Color(0xFFFF0000),
                            shape: BoxShape.circle,
                            border: Border.fromBorderSide(
                              BorderSide(color: Colors.white, width: 2),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _seekHintBadge() {
    final anim = _hintAnim;
    if (anim == null) return const SizedBox.shrink();
    return AnimatedBuilder(
      animation: anim,
      builder: (_, _) {
        final t = Curves.easeOut.transform(anim.value.clamp(0.0, 1.0));
        return Opacity(
          opacity: t,
          child: Transform.scale(
            scale: 0.7 + 0.3 * t,
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 18,
                vertical: 12,
              ),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.65),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _seekForward
                        ? Icons.forward_10_rounded
                        : Icons.replay_10_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${_seekAccum.abs()} seconds',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  String _fmt(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return h > 0 ? '$h:$m:$s' : '$m:$s';
  }
}
