import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/widgets/content_cards.dart';
import '../../../shared/widgets/app_background.dart';
import '../presentation/music_cubit.dart';
import '../domain/music_state.dart';

class MusicScreen extends StatefulWidget {
  const MusicScreen({super.key});

  @override
  State<MusicScreen> createState() => _MusicScreenState();
}

class _MusicScreenState extends State<MusicScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cubit = context.read<MusicCubit>();
      if (cubit.state is MusicInitial) {
        cubit.loadMusic();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'Music',
      ),
      body: BlocBuilder<MusicCubit, MusicState>(
          builder: (context, state) {
            if (state is MusicLoading) {
              return _buildShimmer();
            }
            if (state is MusicError) {
              return FunErrorState(
                message: state.message,
                onRetry: () => context.read<MusicCubit>().loadMusic(),
              );
            }
            if (state is MusicLoaded) {
              if (state.music.isEmpty && state.genres.isEmpty) {
                return const FunEmptyState(
                  emoji: '🎵',
                  title: 'No Music Yet',
                  subtitle: 'Tracks will appear here once added.',
                );
              }
              return _buildContent(context, state);
            }
            return const SizedBox.shrink();
          },
      ),
      bottomNavigationBar: const MainBottomNav(currentIndex: 2),
    );
  }

  Widget _buildShimmer() {
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

  Widget _buildContent(BuildContext context, MusicLoaded state) {
    final featured = state.featured;
    final allTracks = state.selectedGenre != null
        ? state.filteredMusic
        : state.music;

    return RefreshIndicator(
      onRefresh: () async => context.read<MusicCubit>().loadMusic(),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // Genre filter chips
          if (state.genres.isNotEmpty)
            SliverToBoxAdapter(
              child: SizedBox(
                height: 48,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: state.genres.length + 1,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      final selected = state.selectedGenre == null;
                      return GestureDetector(
                        onTap: () =>
                            context.read<MusicCubit>().selectGenre(null),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 18,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: selected
                                ? AppTheme.skyBlue
                                : AppTheme.white,
                            borderRadius: BorderRadius.circular(
                              AppTheme.chipRadius,
                            ),
                          ),
                          child: Text(
                            'All',
                            style: AppStyles.nunito(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: selected
                                  ? AppTheme.white
                                  : AppTheme.darkText,
                            ),
                          ),
                        ),
                      );
                    }
                    final genre = state.genres[index - 1];
                    final name = genre['name'] as String? ?? '';
                    final selected = state.selectedGenre == name;
                    return GestureDetector(
                      onTap: () =>
                          context.read<MusicCubit>().selectGenre(name),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: selected ? AppTheme.skyBlue : AppTheme.white,
                          borderRadius: BorderRadius.circular(
                            AppTheme.chipRadius,
                          ),
                        ),
                        child: Text(
                          name,
                          style: AppStyles.nunito(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color:
                                selected ? AppTheme.white : AppTheme.darkText,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 12)),

          // Featured section
          if (featured.isNotEmpty && state.selectedGenre == null) ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    const Text('⭐', style: TextStyle(fontSize: 20)),
                    const SizedBox(width: 8),
                    Text(
                      'Featured',
                      style: AppStyles.baloo2(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.darkNavy,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 10)),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 200,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: featured.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 14),
                  itemBuilder: (context, index) =>
                      _featuredCard(context, featured[index], featured, index),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 20)),
          ],

          // All Tracks header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  const Text('🎵', style: TextStyle(fontSize: 20)),
                  const SizedBox(width: 8),
                  Text(
                    state.selectedGenre != null
                        ? '${state.selectedGenre}'
                        : 'All Tracks',
                    style: AppStyles.baloo2(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${allTracks.length} ${allTracks.length == 1 ? 'track' : 'tracks'}',
                    style: AppStyles.nunito(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.charcoal,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 10)),

          // Track list
          if (allTracks.isEmpty)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: FunEmptyState(
                  emoji: '🎵',
                  title: 'No tracks found',
                  subtitle: 'Try a different genre',
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _musicTile(
                    context,
                    allTracks[index],
                    allTracks,
                    index,
                  ),
                  childCount: allTracks.length,
                ),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }

  Widget _featuredCard(
    BuildContext context,
    Map<String, dynamic> track,
    List<Map<String, dynamic>> playlist,
    int index,
  ) {
    final title = track['title'] as String? ?? 'Untitled';
    final artist = track['artist'] as String?;
    final coverUrl = track['coverUrl'] as String?;
    final resolvedCover =
        coverUrl != null ? AppConstants.resolveUrl(coverUrl) : null;
    final genre = track['genre'] as String?;
    final duration = _formatDuration(track['durationSeconds'] as int? ?? 0);

    return GestureDetector(
      onTap: () => _openPlayer(context, track, playlist, index),
      child: Container(
        width: 300,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            AppTheme.clayShadow(
              color: AppTheme.deepNavy.withValues(alpha: 0.2),
              blur: 20,
              dy: 8,
              spread: -4,
            ).first,
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (resolvedCover != null)
                CachedNetworkImage(
                  imageUrl: resolvedCover,
                  fit: BoxFit.cover,
                  memCacheWidth: 600,
                  memCacheHeight: 400,
                  placeholder: (_, _) => Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppTheme.darkNavy, AppTheme.deepNavy],
                      ),
                    ),
                  ),
                  errorWidget: (_, _, _) => _featuredFallback(),
                )
              else
                _featuredFallback(),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.transparent,
                      Color(0xCC1F2A4A),
                    ],
                    stops: [0.3, 0.7, 1.0],
                  ),
                ),
              ),
              Positioned(
                left: 16,
                right: 16,
                bottom: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (genre != null && genre.isNotEmpty) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.gold,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          genre.toUpperCase(),
                          style: AppStyles.nunito(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.deepNavy,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    Text(
                      title,
                      style: AppStyles.baloo2(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.white,
                        height: 1.1,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (artist != null && artist.isNotEmpty) ...[
                          Expanded(
                            child: Text(
                              artist,
                              style: AppStyles.nunito(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color:
                                    AppTheme.white.withValues(alpha: 0.85),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                        if (duration.isNotEmpty) ...[
                          Text(
                            duration,
                            style: AppStyles.nunito(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color:
                                  AppTheme.white.withValues(alpha: 0.7),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.gold,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.gold.withValues(alpha: 0.4),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.play_arrow_rounded,
                    size: 26,
                    color: AppTheme.deepNavy,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _featuredFallback() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.sunnyYellow, AppTheme.skyBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Icon(Icons.music_note, size: 64, color: AppTheme.white),
      ),
    );
  }

  Widget _musicTile(
    BuildContext context,
    Map<String, dynamic> track,
    List<Map<String, dynamic>> playlist,
    int index,
  ) {
    final title = track['title'] as String? ?? 'Untitled';
    final artist = track['artist'] as String?;
    final coverUrl = track['coverUrl'] as String?;
    final resolvedCover =
        coverUrl != null ? AppConstants.resolveUrl(coverUrl) : null;
    final genre = track['genre'] as String?;
    final duration = _formatDuration(track['durationSeconds'] as int? ?? 0);
    final playCount = track['playCount'] as int? ?? 0;

    return GestureDetector(
      onTap: () => _openPlayer(context, track, playlist, index),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppTheme.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AppTheme.skyBlue.withValues(alpha: 0.12),
            width: 1,
          ),
          boxShadow: [
            AppTheme.clayShadow(
              color: AppTheme.deepNavy.withValues(alpha: 0.08),
              blur: 16,
              dy: 6,
              spread: -3,
            ).first,
          ],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: SizedBox(
                width: 60,
                height: 60,
                child: resolvedCover != null
                    ? CachedNetworkImage(
                        imageUrl: resolvedCover,
                        fit: BoxFit.cover,
                        memCacheWidth: 120,
                        memCacheHeight: 120,
                        placeholder: (_, _) => Container(
                          color: AppTheme.skyBlueLight,
                          child: const Icon(
                            Icons.music_note,
                            size: 28,
                            color: AppTheme.white,
                          ),
                        ),
                        errorWidget: (_, _, _) => Container(
                          color: AppTheme.skyBlueLight,
                          child: const Icon(
                            Icons.music_note,
                            size: 28,
                            color: AppTheme.white,
                          ),
                        ),
                      )
                    : Container(
                        color: AppTheme.skyBlueLight,
                        child: const Icon(
                          Icons.music_note,
                          size: 28,
                          color: AppTheme.white,
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppStyles.baloo2(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  if (artist != null && artist.isNotEmpty)
                    Text(
                      artist,
                      style: AppStyles.nunito(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.charcoal.withValues(alpha: 0.7),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (genre != null && genre.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.skyBlue.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            genre,
                            style: AppStyles.nunito(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.skyBlue,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      if (duration.isNotEmpty) ...[
                        Icon(
                          Icons.schedule_rounded,
                          size: 12,
                          color: AppTheme.charcoal.withValues(alpha: 0.5),
                        ),
                        const SizedBox(width: 3),
                        Text(
                          duration,
                          style: AppStyles.nunito(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.charcoal.withValues(alpha: 0.6),
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      if (playCount > 0) ...[
                        Icon(
                          Icons.play_circle_outline_rounded,
                          size: 12,
                          color: AppTheme.charcoal.withValues(alpha: 0.5),
                        ),
                        const SizedBox(width: 3),
                        Text(
                          '$playCount',
                          style: AppStyles.nunito(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.charcoal.withValues(alpha: 0.6),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            GestureDetector(
              onTap: () => _openPlayer(context, track, playlist, index),
              child: Container(
                width: 42,
                height: 42,
                decoration: const BoxDecoration(
                  color: AppTheme.sunnyYellow,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x33F0C040),
                      blurRadius: 8,
                      offset: Offset(0, 3),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.play_arrow_rounded,
                  size: 24,
                  color: AppTheme.deepNavy,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openPlayer(
    BuildContext context,
    Map<String, dynamic> track,
    List<Map<String, dynamic>> playlist,
    int index,
  ) {
    final id = track['id'] as String?;
    if (id == null) return;
    final isLocked = track['isLocked'] as bool? ?? false;
    if (isLocked) {
      context.push(AppRoutes.paywall);
      return;
    }
    context.push(
      AppRoutes.musicPlayer,
      extra: {...track, 'playlist': playlist, 'index': index},
    );
  }

  String _formatDuration(int seconds) {
    if (seconds <= 0) return '';
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}
