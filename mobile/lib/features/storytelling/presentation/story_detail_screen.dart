import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import 'package:video_player/video_player.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/di/injection.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../media/data/media_repository.dart';
import '../../media/presentation/youtube_style_player.dart';
import '../data/storytelling_repository.dart';
import '../presentation/story_detail_cubit.dart';
import '../domain/story_detail_state.dart';

/// Detail page for a single story: video, title, description and story video.
///
/// Layout: YouTube-style watch page
///   1. App bar (back + title)
///   2. Full-width video player
///   3. Title (large)
///   4. Meta row (views + duration + pills)
///   5. Description (actual description text)
///   6. Action bar (Like / Save / Share)
class StoryDetailScreen extends StatelessWidget {
  final String storyId;
  const StoryDetailScreen({super.key, required this.storyId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) =>
          StoryDetailCubit(getIt<StorytellingRepository>())..loadStory(storyId),
      child: _StoryDetailContent(storyId: storyId),
    );
  }
}

class _StoryDetailContent extends StatelessWidget {
  final String storyId;
  const _StoryDetailContent({required this.storyId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      body: BlocBuilder<StoryDetailCubit, StoryDetailState>(
        builder: (context, state) {
          if (state is StoryDetailLoading || state is StoryDetailInitial) {
            return const LoadingMascot(message: 'Loading story...');
          }
          if (state is StoryDetailError) {
            return FunErrorState(
              message: state.message,
              onRetry: () => context.read<StoryDetailCubit>().loadStory(storyId),
            );
          }
          if (state is StoryDetailLoaded) {
            return _buildContent(context, state.story);
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  String? _s(dynamic v) => v is String && v.isNotEmpty ? v : null;
  int? _i(dynamic v) => v is int ? v : (v is num ? v.toInt() : null);

  Widget _buildContent(BuildContext context, Map<String, dynamic> story) {
    final title = _s(story['title']) ?? 'Untitled';
    final cover = _s(story['coverUrl']);
    final resolvedCover = cover != null ? AppConstants.resolveUrl(cover) : null;
    final videoId = _s(story['videoId']);
    final isLocked = story['isLocked'] == true;
    final category = _s(story['category']);
    final ageGroup = _s(story['ageGroup']);
    final duration = _i(story['durationSeconds']);
    final views = _i(story['viewCount']);
    final description = _s(story['description']);
    final posted = _s(story['postedAt']);

    return CustomScrollView(
      slivers: [
        // ── App bar: back + title ──
        SliverAppBar(
          elevation: 0,
          pinned: true,
          automaticallyImplyLeading: false,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  KidsIconButton(
                    onTap: () => context.pop(),
                    child: const Icon(
                      Icons.arrow_back_rounded,
                      color: AppTheme.darkNavy,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    title,
                    style: AppStyles.baloo2(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        // ── Full-width video player ──
        if (videoId != null)
          SliverToBoxAdapter(
            child: _InlineStoryVideo(
              videoId: videoId,
              title: title,
              posterUrl: resolvedCover,
              showPlaceholder: true,
            ),
          ),

        const SliverToBoxAdapter(child: SizedBox(height: 10)),

        // ── Title (large) ──
        SliverToBoxAdapter(
          child: Text(
            title,
            style: AppStyles.baloo2(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: AppTheme.darkNavy,
              height: 1.2,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: 8)),

        // ── Meta row (views + duration + pills) ──
        SliverToBoxAdapter(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Views + duration (dark text on yellow = readable)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (views != null && views > 0)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.remove_red_eye_rounded,
                          size: 13,
                          color: AppTheme.silver,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _formatViews(views),
                          style: AppStyles.nunito(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.darkNavy,
                          ),
                        ),
                      ],
                    ),
                  if (duration != null && duration > 0)
                    Row(
                      children: [
                        const Icon(
                          Icons.access_time_rounded,
                          size: 13,
                          color: AppTheme.silver,
                        ),
                        const SizedBox(width: 2),
                        Text(
                          _formatDuration(duration),
                          style: AppStyles.nunito(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.darkNavy,
                          ),
                        ),
                      ],
                    ),
                  if (views != null && views > 0 && duration != null && duration > 0)
                    const SizedBox(width: 12),
                ],
              ),
              // Pills
              if (category != null || ageGroup != null || posted != null)
                ..._metaPills(category, ageGroup, posted),
            ],
          ),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: 10)),

        // ── Unlock prompt (shown when content is locked) ──
        if (isLocked)
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: AppTheme.playfulRed.withValues(alpha: 0.25),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.playfulRed.withValues(alpha: 0.1),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppTheme.playfulRed.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                      Icons.lock_outline_rounded,
                      size: 28,
                      color: AppTheme.playfulRed,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '🔒 Premium Content',
                          style: AppStyles.baloo2(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.darkNavy,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'This story is for Premium subscribers only.',
                          style: AppStyles.nunito(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.charcoal,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => context.push(AppRoutes.paywall),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.gold,
                      foregroundColor: AppTheme.deepNavy,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                    child: const Text(
                      'Subscribe & Unlock',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

        const SliverToBoxAdapter(child: SizedBox(height: 10)),

        // ── Description (always present; empty state if missing) ──
        SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Text(
                    'Description',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                    ),
                  ),
                  const Spacer(),
                  if (isLocked)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.deepNavy.withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        '🔒 Premium',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.gold,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              if (description != null &&
                  description.isNotEmpty)
                Text(
                  description,
                  style: AppStyles.nunito(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.charcoal,
                    height: 1.6,
                  ),
                  maxLines: 12,
                  overflow: TextOverflow.ellipsis,
                )
              else
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Text(
                    'No description available for this story.',
                    style: AppStyles.nunito(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.silver,
                      height: 1.5,
                    ),
                  ),
                ),
            ],
          ),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: 12)),

        // ── Action bar (at bottom, not floating) ──
        if (!isLocked && videoId != null)
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: AppTheme.skyBlue.withValues(alpha: 0.25),
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                children: [
                  _actionButton(
                    Icons.thumb_up_rounded,
                    'Like',
                    () => _handleAction('like', context),
                  ),
                  const SizedBox(width: 8),
                  _actionButton(
                    Icons.bookmark_rounded,
                    'Save',
                    () => _handleAction('save', context),
                  ),
                  const SizedBox(width: 8),
                  _actionButton(
                    Icons.share_rounded,
                    'Share',
                    () => _handleAction('share', context),
                  ),
                ],
              ),
            ),
          ),

        const SliverToBoxAdapter(child: SizedBox(height: 24)),
      ],
    );
  }

  /// Action button: icon + label, compact.
  Widget _actionButton(
    IconData icon,
    String label,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.sunnyYellow,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.textShadow,
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(
              icon,
              size: 20,
              color: AppTheme.deepNavy,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: AppStyles.nunito(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: AppTheme.darkNavy,
            ),
          ),
        ],
      ),
    );
  }

  /// YouTube-style pill badge.
  Widget _pill(String label, Color background, Color foreground) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: background.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: background.withValues(alpha: 0.35)),
      ),
      child: Text(
        label,
        style: AppStyles.nunito(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: foreground,
        ),
      ),
    );
  }

  /// Handle a user action.
  void _handleAction(String action, BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$action tapped'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  /// Format view count like YouTube: 1.2K, 1.5M
  String _formatViews(int views) {
    if (views < 1000) return '$views';
    if (views < 1000000) {
      final k = views / 1000;
      return k % 1 == 0 ? '${k}K' : '${k.toStringAsFixed(1)}K';
    }
    final m = views / 1000000;
    return m % 1 == 0 ? '${m.toInt()}M' : '${m.toStringAsFixed(1)}M';
  }

  /// Format date string to relative (e.g. "2 days ago")
  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      final now = DateTime.now();
      final diff = now.difference(d);
      if (diff.inDays > 0) return '${diff.inDays}d ago';
      if (diff.inHours > 0) return '${diff.inHours}h ago';
      if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
      return 'just now';
    } catch (_) {
      return iso;
    }
  }

  String _formatDuration(int seconds) {
    if (seconds <= 0) return '';
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  /// Build the category / age group / posted-at pill widgets.
  List<Widget> _metaPills(
    String? category,
    String? ageGroup,
    String? posted,
  ) {
    final pills = <Widget>[];
    if (category != null) {
      pills.add(_pill(category!, AppTheme.skyBlue, AppTheme.white));
    }
    if (ageGroup != null) {
      pills.add(_pill(ageGroup!, AppTheme.softPurple, AppTheme.darkNavy));
    }
    if (posted != null) {
      pills.add(
        _pill(_formatDate(posted), AppTheme.silver, AppTheme.darkNavy),
      );
    }
    return pills;
  }
}

/// Inline story player: poster + play overlay that turns into a real
/// video surface with play/pause, seek slider, time labels, buffering
/// and a fullscreen button on the same detail screen.
///
/// CONSISTENT CONTROLLER LIFECYCLE
/// The [VideoPlayerController] is created exactly once on first load.
/// Subsequent calls to [_load] only toggle play/pause — never create a
/// new controller. This prevents the "Release → Init → Release → Init"
/// cycle that kills MediaCodec handlers on the emulator.
class _InlineStoryVideo extends StatefulWidget {
  final String? videoId;
  final String title;
  final String? posterUrl;
  final bool showPlaceholder;

  const _InlineStoryVideo({
    required this.videoId,
    required this.title,
    this.posterUrl,
    this.showPlaceholder = false,
  });

  @override
  State<_InlineStoryVideo> createState() => _InlineStoryVideoState();
}

class _InlineStoryVideoState extends State<_InlineStoryVideo> {
  late final MediaRepository _repository = getIt<MediaRepository>();

  /// The single controller that owns the MediaCodec + video surface.
  /// Created exactly once on first load. Subsequent calls to _load() only
  /// toggle play/pause. The caller (YoutubeStylePlayer) owns disposal.
  VideoPlayerController? _controller;

  /// True after the controller has been initialized (even if it is
  /// currently disposed/restarting). Used to avoid re-creating the
  /// controller on a new _load() call.
  bool _controllerInitialized = false;

  bool _loading = false;
  bool _error = false;
  String _errorMessage = 'Failed to load video';

  @override
  void dispose() {
    // Dispose the controller when leaving the screen (including back button).
    // The controller is NOT restarted automatically — the next visit will
    // re-initialise it via _load().
    if (_controller != null) {
      _controller!.removeListener(_onControllerUpdate);
      _controller!.dispose();
      _controller = null;
    }
    _controllerInitialized = false;
    super.dispose();
  }

  /// Safely toggle play/pause. Used when the controller is already
  /// initialised (e.g. user taps the play button on the poster).
  void _togglePlay() {
    final c = _controller;
    if (c == null || !c.value.isInitialized) return;
    if (c.value.isPlaying) {
      c.pause();
    } else {
      c.play();
    }
  }

  /// Load the video URL and create/initialise the controller.
  ///
  /// The controller is created exactly once. If it already exists and is
  /// initialised, this method only toggles play/pause.
  Future<void> _load() async {
    if (_loading) return;

    // Already loaded: just toggle playback.
    if (_controller != null && _controllerInitialized) {
      _togglePlay();
      return;
    }

    if (_controllerInitialized) {
      // Controller exists but is null — it was disposed (e.g. screen exit).
      // Reset the flag so _load() can re-create it.
      _controllerInitialized = false;
    }

    setState(() {
      _loading = true;
      _error = false;
      _errorMessage = 'Failed to load video';
    });

    try {
      final play = await _repository.getVideoPlaybackUrl(widget.videoId!);
      final url = play['url'] as String;

      // ── URL protocol check ──
      if (url.startsWith('http://') && !url.startsWith('http://localhost') &&
          !url.startsWith('http://10.0.2.2') && !url.startsWith('http://127.0.0.1')) {
        if (!mounted) return;
        setState(() {
          _loading = false;
          _error = true;
          _errorMessage =
              'Insecure video URL. Use https or localhost. Got: $url';
        });
        return;
      }

      final controller = VideoPlayerController.networkUrl(Uri.parse(url));
      await controller.initialize();

      if (!mounted) {
        await controller.dispose();
        return;
      }

      // Remove any existing listener before replacing the controller.
      _controller?.removeListener(_onControllerUpdate);

      // Store the new controller — this is the single source of truth.
      _controller = controller;
      _controllerInitialized = true;

      controller.addListener(_onControllerUpdate);

      // Start playing immediately.
      controller.play();

      // Update UI.
      setState(() {
        _loading = false;
        _error = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = true;
        _errorMessage =
            e.toString().replaceFirst('Exception: ', 'Failed to load video: ');
      });
    }
  }

  /// Called when the controller's internal state changes.
  /// Updates the UI via setState (not via ValueListenableBuilder because
  /// we are inside a StatefulWidget, not a ValueListenableBuilder).
  void _onControllerUpdate() {
    if (!mounted) return;
    final v = _controller?.value;
    if (v == null) return;
    if (v.hasError && !_error) {
      setState(() {
        _error = true;
        _errorMessage = v.errorDescription ?? 'Playback error';
      });
      return;
    }
    if (!_loading) return;
    // Early exit if still loading — don't trigger UI update until ready.
    if (v.isPlaying && !v.isBuffering) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Loading state
    if (_loading) {
      return _frame(
        const Center(
          child: CircularProgressIndicator(color: AppTheme.gold),
        ),
      );
    }

    // Error state
    if (_error) {
      return _frame(
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                color: AppTheme.playfulRed,
                size: 40,
              ),
              const SizedBox(height: 8),
              Text(
                _errorMessage,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppStyles.nunito(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: _controllerInitialized ? _load : null,
                icon: const Icon(Icons.refresh_rounded, size: 18),
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

    // Ready state — show the video player
    final controller = _controller;
    if (controller == null || !_controllerInitialized) {
      return widget.showPlaceholder ? _poster() : const SizedBox.shrink();
    }

    // Use ValueListenableBuilder to ensure the play/pause button
    // and progress bar update correctly when the controller's state changes.
    return ValueListenableBuilder<bool>(
      valueListenable: _getPlayStateNotifier(),
      builder: (context, isPlaying, _) {
        return _player(isPlaying);
      },
    );
  }

  /// A ValueNotifier that mirrors the controller's isPlaying state.
  /// Used by the parent _player() widget for the play/pause button.
  ValueNotifier<bool> _getPlayStateNotifier() {
    // Lazy create the notifier
    if (_playStateNotifier == null) {
      _playStateNotifier =
          ValueNotifier<bool>(_controller?.value.isPlaying ?? false);
    }
    return _playStateNotifier!;
  }

  ValueNotifier<bool>? _playStateNotifier;

  /// Build the video player with the given play state.
  Widget _player(bool isPlaying) {
    // The YoutubeStylePlayer uses its own _isPlaying ValueNotifier
    // (updated by the controller listener) for the play/pause button.
    // isPlaying is passed via ValueListenableBuilder to keep UI in sync.
    return YoutubeStylePlayer(
      controller: _controller!,
    );
  }

  /// Wrap child with a dark-bleed frame (16:9, rounded corners).
  Widget _frame(Widget child) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: Container(
          color: AppTheme.darkNavy,
          child: child,
        ),
      ),
    );
  }

  /// Show the video poster (cover image + play overlay).
  Widget _poster() {
    final poster = widget.posterUrl;
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (poster != null)
              CachedNetworkImage(
                imageUrl: poster,
                fit: BoxFit.cover,
                fadeInDuration: Duration.zero,
                fadeOutDuration: Duration.zero,
                errorWidget: (_, _, _) => _posterFallback(),
              )
            else
              _posterFallback(),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black26,
                    Colors.black54,
                  ],
                ),
              ),
            ),
            Center(
              child: KidsIconButton(
                onTap: _load,
                glowColor: AppTheme.gold,
                child: const Icon(
                  Icons.play_circle_fill_rounded,
                  color: Colors.white,
                  size: 68,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _posterFallback() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.sunnyYellow, AppTheme.skyBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Text('🎬', style: TextStyle(fontSize: 48)),
      ),
    );
  }
}


