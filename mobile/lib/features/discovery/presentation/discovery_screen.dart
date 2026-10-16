import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:cached_network_image/cached_network_image.dart' as cached;
import 'dart:async';
import '../../../core/navigation/app_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/styles.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/shared_widgets.dart';

import '../domain/discovery_state.dart';
import 'discovery_cubit.dart';
import '../../screen_theme/screen_theme_cubit.dart';
import '../../auth/domain/auth_state.dart';
import '../../auth/presentation/auth_cubit.dart';
import '../../../core/di/injection.dart';

// ═══════════════════════════════════════════════════════════════
//  DISCOVERY SCREEN — Modern Kids-First Design
// ═══════════════════════════════════════════════════════════════
///  Vibrant gradient backgrounds, playful rounded shapes, big touch
///  targets, fun emojis, and animated interactions. Everything is
///  designed for young readers with small fingers.
class DiscoveryScreen extends StatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  State<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends State<DiscoveryScreen> {
  bool _initialLoadDone = false;
  final _carouselController = PageController(viewportFraction: 0.92);
  Timer? _carouselTimer;
  final _dotIndex = ValueNotifier<int>(0);
  bool _isDragging = false;

  // Cached PageControllers for shelves — recreated only on screen width change.
  double _lastScreenWidth = 0;
  PageController? _booksController;
  PageController? _audioController;
  PageController? _musicController;
  PageController? _storiesController;

  // ── Section color palette ──────────────────────────────────────────────
  static const _sectionColors = [
    Color(0xFFFFF3E0), // Books - warm peach
    Color(0xFFE3F2FD), // Audio - soft blue
    Color(0xFFE8F5E9), // Music - mint
    Color(0xFFF3E5F5), // Stories - lavender
  ];

  @override
  void initState() {
    super.initState();
    _loadInitialData();
    _loadAuthData();
  }

  void _loadAuthData() {
    try {
      final authState = context.read<AuthCubit>().state;
      if (authState is AuthAuthenticated) {
        _userAvatar = authState.user.avatarUrl;
      }
    } catch (_) {}
  }

  // Cached user avatar — avoids reading AuthCubit on every build
  String? _userAvatar;

  void _loadInitialData() {
    final cubit = context.read<DiscoveryCubit>();
    final state = cubit.state;
    if (state is DiscoveryInitial ||
        state is DiscoveryError ||
        (state is CategoriesLoaded && !state.hasContent)) {
      _initialLoadDone = true;
      cubit.loadCategories();
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialLoadDone) _loadInitialData();
  }

  @override
  void dispose() {
    _booksController?.dispose();
    _audioController?.dispose();
    _musicController?.dispose();
    _storiesController?.dispose();
    _carouselController.dispose();
    _carouselTimer?.cancel();
    _dotIndex.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ScreenThemeCubit? themeCubit;
    try {
      themeCubit = context.read<ScreenThemeCubit>();
    } catch (_) {
      try {
        if (getIt.isRegistered<ScreenThemeCubit>()) {
          themeCubit = getIt<ScreenThemeCubit>();
        }
      } catch (_) {
        themeCubit = null;
      }
    }
    final avatarUrl = themeCubit?.themeFor('home')?.avatarImageUrl;

    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: _modernAppBar(context, avatarUrl),
      body: BlocBuilder<DiscoveryCubit, DiscoveryState>(
        builder: (ctx, state) {
          if (state is DiscoveryError) {
            return _funErrorState(
              message: state.message,
              onRetry: () => context.read<DiscoveryCubit>().loadCategories(),
            );
          }
          if (state is CategoriesLoaded) {
            return _modernShelves(context, ctx, state);
          }
          return _modernShimmer();
        },
      ),
      bottomNavigationBar: const MainBottomNav(currentIndex: 0),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  MODERN APP BAR
  // ═══════════════════════════════════════════════════════════════

  PreferredSizeWidget _modernAppBar(BuildContext context, String? avatarUrl) {
    // Prefer user's profile picture over theme avatar
    String? userAvatar = _userAvatar;
    final displayAvatar = userAvatar ?? avatarUrl;
    final resolvedAvatar = displayAvatar != null && displayAvatar.isNotEmpty
        ? AppConstants.resolveUrl(displayAvatar)
        : null;

    return BariisaaAppBar(
      avatarUrl: resolvedAvatar,
      actions: [
        KidsIconButton(
          tooltip: 'Search',
          onTap: () => context.push(AppRoutes.searchResults),
          child: const Icon(
            Icons.search_rounded,
            size: 24,
            color: AppTheme.skyBlue,
          ),
        ),
        KidsIconButton(
          tooltip: 'Notifications',
          onTap: () => context.push(AppRoutes.notifications),
          child: const Icon(
            Icons.notifications_rounded,
            size: 24,
            color: AppTheme.errorRed,
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  MODERN LOADING SHIMMER
  // ═══════════════════════════════════════════════════════════════

  Widget _modernShimmer() => const _DiscoveryShimmer();

  // ═══════════════════════════════════════════════════════════════
  //  MAIN SHELVES LAYOUT
  // ═══════════════════════════════════════════════════════════════

  Widget _modernShelves(
    BuildContext context,
    BuildContext ctx,
    CategoriesLoaded state,
  ) {
    final ebooks = state.ebooks;
    final audiobooks = state.audiobooks;
    final musicTracks = state.music;
    final stories = state.stories;
    final featured = state.featuredContent;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    // Build section list lazily — each section is only created when scrolled into view.
    final sections = <Widget Function()>[];

    if (featured.isNotEmpty) {
      sections.add(() => _featuredCarousel(context, ctx, featured));
    }
    if (state.exploreCategories.isNotEmpty) {
      sections.add(() => _quickCategoryPills(context, state.exploreCategories));
    }
    if (ebooks.isNotEmpty) {
      sections.add(() => _sectionCard(
            color: _sectionColors[0],
            child: _booksShelf(context, ctx, ebooks,
                emoji: '📚', title: 'Books'),
          ));
    }
    if (audiobooks.isNotEmpty) {
      sections.add(() => _sectionCard(
            color: _sectionColors[1],
            child: _audioBooksShelf(ctx, audiobooks,
                emoji: '🎧', title: 'Audio Books'),
          ));
    }
    if (musicTracks.isNotEmpty) {
      sections.add(() => _sectionCard(
            color: _sectionColors[2],
            child: _musicShelf(ctx, musicTracks, emoji: '🎵', title: 'Music'),
          ));
    }
    if (stories.isNotEmpty) {
      sections.add(() => _sectionCard(
            color: _sectionColors[3],
            child: _storiesShelf(ctx, stories, emoji: '📖', title: 'Stories'),
          ));
    }
    if (state.exploreCategories.isNotEmpty) {
      sections.add(() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24),
          _modernShelfHeader(
            emoji: '🧭',
            title: 'Explore',
            color: AppTheme.softPurple,
          ),
          const SizedBox(height: 10),
          _exploreGrid(context, state.exploreCategories),
        ],
      ));
    }

    if (sections.isEmpty) {
      return _emptyHomeState(() => context.read<DiscoveryCubit>().loadCategories());
    }

    return RefreshIndicator(
      onRefresh: () async => context.read<DiscoveryCubit>().loadCategories(),
      color: AppTheme.sunnyYellow,
      backgroundColor: AppTheme.white,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.fromLTRB(0, 0, 0, 24 + bottomPadding),
        itemCount: sections.length,
        itemBuilder: (ctx, i) => sections[i](),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  FEATURED HERO CAROUSEL
  // ═══════════════════════════════════════════════════════════════

  Widget _featuredCarousel(
    BuildContext context,
    BuildContext ctx,
    List<Map<String, dynamic>> featured,
  ) {
    if (featured.isEmpty) return const SizedBox.shrink();

    final cardHeight = 280.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        SizedBox(
          height: cardHeight,
          child: Stack(
            children: [
              NotificationListener<ScrollNotification>(
                onNotification: (notification) {
                  if (notification is ScrollStartNotification) {
                    _isDragging = true;
                    _carouselTimer?.cancel();
                  } else if (notification is ScrollEndNotification) {
                    _isDragging = false;
                    _startCarouselTimer();
                  }
                  return false;
                },
                child: PageView.builder(
                  physics: const BouncingScrollPhysics(
                    parent: PageScrollPhysics(),
                  ),
                  padEnds: false,
                  itemCount: featured.length,
                  controller: _carouselController,
                  itemBuilder: (_, i) => _featuredCard(
                    ctx,
                    featured[i],
                    cardHeight: cardHeight,
                  ),
                  onPageChanged: (i) {
                    if (!_isDragging) {
                      _dotIndex.value = i.toInt();
                    }
                  },
                ),
              ),
              Positioned(
                bottom: 16,
                left: 0,
                right: 0,
                child: _buildPagination(context, featured.length),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPagination(BuildContext context, int count) {
    return ValueListenableBuilder<int>(
      valueListenable: _dotIndex,
      builder: (context, activeIndex, _) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(count, (i) {
            final isActive = i == activeIndex;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: isActive ? 20 : 8,
              height: isActive ? 8 : 6,
              decoration: BoxDecoration(
                color:
                    isActive ? AppTheme.sunnyYellow : Colors.white.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(4),
              ),
            );
          }),
        );
      },
    );
  }

  void _startCarouselTimer() {
    if (!mounted) return;
    final cubit = context.read<DiscoveryCubit>();
    if (cubit.state is! CategoriesLoaded) return;
    final featured = (cubit.state as CategoriesLoaded).featuredContent;
    if (featured.length < 2) return;
    _carouselTimer?.cancel();
    _carouselTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted || _isDragging) return;
      final next = ((_dotIndex.value + 1) % featured.length).toInt();
      _carouselController.animateToPage(
        next,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOutCubic,
      );
      _dotIndex.value = next;
    });
  }


  /// Ensure shelf PageControllers match current screen width.
  void _ensureShelfControllers(double screenWidth) {
    if (screenWidth == _lastScreenWidth) return;
    _lastScreenWidth = screenWidth;
    _booksController?.dispose();
    _audioController?.dispose();
    _musicController?.dispose();
    _storiesController?.dispose();
    final cardWidth = screenWidth * 0.60;
    final fraction = (cardWidth + 12) / screenWidth;
    _booksController = PageController(viewportFraction: fraction);
    _audioController = PageController(viewportFraction: fraction);
    _musicController = PageController(viewportFraction: fraction);
    _storiesController = PageController(viewportFraction: fraction);
  }

  Widget _featuredCard(
    BuildContext ctx,
    Map<String, dynamic> item, {
    required double cardHeight,
  }) {
    final type = _s(item['type']) ?? '';
    final title = _s(item['title']) ?? 'Untitled';
    final coverUrl = _s(item['coverUrl']);
    final resolvedCover = coverUrl != null
        ? AppConstants.resolveUrl(coverUrl)
        : null;

    final typeLabel = type == 'music'
        ? 'Music'
        : type == 'audio'
            ? 'Audio'
            : type == 'story'
                ? 'Stories'
                : 'Books';

    return GestureDetector(
      onTap: () {
        if (type == 'book' && item['id'] != null) {
          ctx.push(AppRoutes.bookDetail.replaceFirst(':id', item['id']));
        } else if (type == 'music' && item['id'] != null) {
          ctx.push(AppRoutes.music.replaceFirst(':id', item['id']));
        } else if (type == 'story' && item['id'] != null) {
          ctx.push(AppRoutes.storytelling.replaceFirst(':id', item['id']));
        } else if (type == 'audio' && item['id'] != null) {
          // Navigate to music screen for audio content — the music player
          // expects a Map payload (track data from /music endpoint), not a BookModel.
          ctx.push(AppRoutes.music);
        }
      },
      child: Container(
        width: double.infinity,
        height: cardHeight,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: AppTheme.deepNavy.withValues(alpha: 0.25),
              blurRadius: 18,
              offset: const Offset(0, 8),
              spreadRadius: -4,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // ── Full-bleed Image ──────────────────────────────────
              if (resolvedCover != null)
                cached.CachedNetworkImage(
                  imageUrl: resolvedCover,
                  fit: BoxFit.cover,
                  filterQuality: FilterQuality.high,
                  memCacheWidth: 680,
                  memCacheHeight: 510,
                  placeholder: (_, _) => _heroImageFallback(type),
                  errorWidget: (_, _, _) => _heroImageFallback(type),
                )
              else
                _heroImageFallback(type),
              // ── Gradient Overlay ──────────────────────────────────
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.05),
                      Colors.black.withValues(alpha: 0.45),
                      Colors.black.withValues(alpha: 0.78),
                    ],
                    stops: const [0.0, 0.35, 0.7, 1.0],
                  ),
                ),
              ),
              // ── Type badge (top-left) ─────────────────────────────
              Positioned(
                top: 14,
                left: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.gold.withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        type == 'music'
                            ? '🎵'
                            : type == 'story'
                                ? '📖'
                                : type == 'audio'
                                    ? '🎧'
                                    : '📚',
                        style: const TextStyle(fontSize: 12),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        typeLabel.toUpperCase(),
                        style: AppStyles.nunito(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.deepNavy,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // ── Content Overlay ───────────────────────────────────
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title
                      Text(
                        title,
                        style: AppStyles.baloo2(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          height: 1.1,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      // Metadata
                      Text(
                        typeLabel,
                        style: AppStyles.nunito(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 10),
                      // Play CTA
                      GestureDetector(
                        onTap: () {
                          if (type == 'book' && item['id'] != null) {
                            ctx.push(AppRoutes.bookDetail.replaceFirst(':id', item['id']));
                          } else if (type == 'music' && item['id'] != null) {
                            ctx.push(AppRoutes.music.replaceFirst(':id', item['id']));
                          } else if (type == 'story' && item['id'] != null) {
                            ctx.push(AppRoutes.storytelling.replaceFirst(':id', item['id']));
                          }
                        },
                        child: Container(
                          height: 44,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [AppTheme.gold, AppTheme.softAmber],
                            ),
                            borderRadius: BorderRadius.circular(22),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.gold.withValues(alpha: 0.45),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.play_arrow_rounded,
                                size: 20,
                                color: AppTheme.deepNavy,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'PLAY',
                                style: AppStyles.nunito(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.deepNavy,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _heroImageFallback(String type) {
    final emoji = type == 'music'
        ? '🎵'
        : type == 'audio' || type == 'story'
            ? '📖'
            : '📚';
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.deepPurple, AppTheme.skyBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          emoji,
          style: const TextStyle(fontSize: 64),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  QUICK CATEGORY PILLS
  // ═══════════════════════════════════════════════════════════════

  Widget _quickCategoryPills(
    BuildContext context,
    List<CategoryModel> categories,
  ) {
    final colors = [
      AppTheme.sunnyYellow,
      AppTheme.skyBlue,
      AppTheme.playfulRed,
      AppTheme.mintGreen,
      AppTheme.softPurple,
      AppTheme.softAmber,
    ];

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: categories.length,
        separatorBuilder: (ctx, idx) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final cat = categories[i];
          final color = colors[i % colors.length];
          return GestureDetector(
            onTap: () {
              if (cat.route != null) context.push(cat.route!);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    color.withValues(alpha: 0.28),
                    color.withValues(alpha: 0.14),
                  ],
                ),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: color.withValues(alpha: 0.4),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (cat.iconEmoji != null) ...[
                    Text(cat.iconEmoji!, style: const TextStyle(fontSize: 16)),
                    const SizedBox(width: 6),
                  ],
                  Text(
                    cat.name,
                    style: AppStyles.nunito(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  SECTION CARD — tinted shelf container
  // ═══════════════════════════════════════════════════════════════

  Widget _sectionCard({required Color color, required Widget child}) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 18),
      padding: const EdgeInsets.fromLTRB(4, 14, 4, 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            color.withValues(alpha: 0.28),
            color.withValues(alpha: 0.12),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: color.withValues(alpha: 0.35),
          width: 1,
        ),
      ),
      child: child,
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  MODERN SHELF HEADER
  // ═══════════════════════════════════════════════════════════════

  Widget _modernShelfHeader({
    required String emoji,
    required String title,
    Color? color,
  }) {
    final accent = color ?? AppTheme.sunnyYellow;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.35),
              borderRadius: BorderRadius.circular(11),
            ),
            child: Center(
              child: Text(emoji, style: const TextStyle(fontSize: 17)),
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
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.darkNavy.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Swipe',
                  style: AppStyles.nunito(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.darkNavy.withValues(alpha: 0.5),
                  ),
                ),
                const SizedBox(width: 3),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 10,
                  color: AppTheme.darkNavy.withValues(alpha: 0.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  BOOKS SHELF — Modern 80% cards
  // ═══════════════════════════════════════════════════════════════

  Widget _booksShelf(
    BuildContext context,
    BuildContext ctx,
    List<BookModel> books, {
    required String emoji,
    required String title,
  }) {
    final screenWidth = MediaQuery.of(context).size.width;
    final cardWidth = screenWidth * 0.60;
    const cardHeight = 118.0;
    _ensureShelfControllers(screenWidth);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _modernShelfHeader(
          emoji: emoji,
          title: title,
          color: _sectionColors[0],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: cardHeight + 12,
          child: PageView.builder(
            physics: const PageScrollPhysics(),
            padEnds: false,
            itemCount: books.length,
            controller: _booksController,
            itemBuilder: (_, i) => _bookCard(
              context,
              books[i],
              cardWidth: cardWidth,
              cardHeight: cardHeight,
            ),
          ),
        ),
      ],
    );
  }

  Widget _bookCard(
    BuildContext context,
    BookModel book, {
    required double cardWidth,
    required double cardHeight,
  }) {
    final title = book.title;
    final author = book.authors.isNotEmpty ? book.authors.first.name : null;
    final category = book.categories.isNotEmpty
        ? book.categories.first.name
        : null;
    final coverUrl = book.coverUrl;
    final resolvedCover = coverUrl != null
        ? AppConstants.resolveUrl(coverUrl)
        : null;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: GestureDetector(
        onTap: () =>
            context.push(AppRoutes.bookDetail.replaceFirst(':id', book.id)),
        child: Container(
          decoration: BoxDecoration(
            color: AppTheme.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: _sectionColors[0].withValues(alpha: 0.45),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: _sectionColors[0].withValues(alpha: 0.45),
                blurRadius: 12,
                offset: const Offset(0, 5),
              ),
              BoxShadow(
                color: AppTheme.deepNavy.withValues(alpha: 0.05),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              // ── Left: Cover 50% ────────────────────────────────────
              SizedBox(
                width: cardWidth * 0.50,
                height: cardHeight,
                child: ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(18),
                    bottomLeft: Radius.circular(18),
                  ),
                  child: resolvedCover != null
                      ? cached.CachedNetworkImage(
                          imageUrl: resolvedCover,
                          fit: BoxFit.cover,
                          filterQuality: FilterQuality.medium,
                          memCacheWidth: 300,
                            memCacheHeight: 400,
                          placeholder: (_, _) => _coverFallbackFull(
                            category ?? '📖',
                            _sectionColors[0],
                          ),
                          errorWidget: (_, _, _) => _coverFallbackFull(
                            category ?? '📖',
                            _sectionColors[0],
                          ),
                        )
                      : _coverFallbackFull(category ?? '📖', _sectionColors[0]),
                ),
              ),

              // ── Right: Text 50% ────────────────────────────────────
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppStyles.baloo2(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.darkNavy,
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (author != null && author.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          'By $author',
                          style: AppStyles.nunito(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.charcoal,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.sunnyYellow,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.menu_book_rounded,
                              size: 12,
                              color: AppTheme.deepNavy,
                            ),
                            const SizedBox(width: 5),
                            Text(
                              'READ',
                              style: AppStyles.nunito(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.deepNavy,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _coverFallbackFull(String label, Color bgColor) => Container(
    color: bgColor,
    child: Center(child: Text(label, style: const TextStyle(fontSize: 36))),
  );

  // ═══════════════════════════════════════════════════════════════
  //  AUDIO BOOKS SHELF — 80% width, 50/50 image/text
  // ═══════════════════════════════════════════════════════════════

  Widget _audioBooksShelf(
    BuildContext ctx,
    List<BookModel> audiobooks, {
    required String emoji,
    required String title,
  }) {
    final screenWidth = MediaQuery.of(ctx).size.width;
    final cardWidth = screenWidth * 0.60;
    const cardHeight = 118.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _modernShelfHeader(
          emoji: emoji,
          title: title,
          color: _sectionColors[1],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: cardHeight + 12,
          child: PageView.builder(
            physics: const PageScrollPhysics(),
            padEnds: false,
            itemCount: audiobooks.length,
            controller: _audioController,
            itemBuilder: (_, i) => _audioBookCard(
              ctx,
              audiobooks[i],
              cardWidth: cardWidth,
              cardHeight: cardHeight,
            ),
          ),
        ),
      ],
    );
  }

  Widget _audioBookCard(
    BuildContext ctx,
    BookModel book, {
    required double cardWidth,
    required double cardHeight,
  }) {
    final title = book.title;
    final author = book.authors.isNotEmpty ? book.authors.first.name : null;
    final coverUrl = book.coverUrl;
    final resolvedCover = coverUrl != null
        ? AppConstants.resolveUrl(coverUrl)
        : null;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: GestureDetector(
        onTap: () =>
            ctx.push(AppRoutes.bookDetail.replaceFirst(':id', book.id)),
        onLongPress: () => ctx.push(AppRoutes.audioPlayer, extra: book),
        child: Container(
          decoration: BoxDecoration(
            color: AppTheme.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: _sectionColors[1].withValues(alpha: 0.45),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: _sectionColors[1].withValues(alpha: 0.45),
                blurRadius: 12,
                offset: const Offset(0, 5),
              ),
              BoxShadow(
                color: AppTheme.deepNavy.withValues(alpha: 0.05),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              // ── Left: Cover 50% ────────────────────────────────────
              SizedBox(
                width: cardWidth * 0.50,
                height: cardHeight,
                child: ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(18),
                    bottomLeft: Radius.circular(18),
                  ),
                  child: resolvedCover != null
                      ? cached.CachedNetworkImage(
                          imageUrl: resolvedCover,
                          fit: BoxFit.cover,
                          filterQuality: FilterQuality.medium,
                          memCacheWidth: 300,
                            memCacheHeight: 400,
                          placeholder: (_, _) =>
                              _coverFallbackFull('🎧', _sectionColors[1]),
                          errorWidget: (_, _, _) =>
                              _coverFallbackFull('🎧', _sectionColors[1]),
                        )
                      : _coverFallbackFull('🎧', _sectionColors[1]),
                ),
              ),

              // ── Right: Text 50% ────────────────────────────────────
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppStyles.baloo2(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.darkNavy,
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (author != null && author.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          'By $author',
                          style: AppStyles.nunito(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.charcoal,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.playfulRed.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.headphones_rounded,
                              size: 12,
                              color: AppTheme.playfulRed,
                            ),
                            const SizedBox(width: 5),
                            Text(
                              'LISTEN',
                              style: AppStyles.nunito(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.playfulRed,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  // ═══════════════════════════════════════════════════════════════
  //  MUSIC SHELF — Modern 80% cards
  // ═══════════════════════════════════════════════════════════════

  Widget _musicShelf(
    BuildContext ctx,
    List<Map<String, dynamic>> tracks, {
    required String emoji,
    required String title,
  }) {
    final screenWidth = MediaQuery.of(ctx).size.width;
    final cardWidth = screenWidth * 0.60;
    const cardHeight = 118.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _modernShelfHeader(
          emoji: emoji,
          title: title,
          color: _sectionColors[2],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: cardHeight + 12,
          child: PageView.builder(
            physics: const PageScrollPhysics(),
            padEnds: false,
            itemCount: tracks.length,
            controller: _musicController,
            itemBuilder: (_, i) => _musicCard(
              ctx,
              tracks[i],
              cardWidth: cardWidth,
              cardHeight: cardHeight,
            ),
          ),
        ),
      ],
    );
  }

  Widget _musicCard(
    BuildContext ctx,
    Map<String, dynamic> track, {
    required double cardWidth,
    required double cardHeight,
  }) {
    final title = _s(track['title']) ?? 'Untitled';
    final artist = _s(track['artist']);
    final coverUrl = _s(track['coverUrl']);
    final resolvedCover = coverUrl != null
        ? AppConstants.resolveUrl(coverUrl)
        : null;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: GestureDetector(
        onTap: () => ctx.push(AppRoutes.music),
        child: Container(
          decoration: BoxDecoration(
            color: AppTheme.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: _sectionColors[2].withValues(alpha: 0.45),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: _sectionColors[2].withValues(alpha: 0.45),
                blurRadius: 12,
                offset: const Offset(0, 5),
              ),
              BoxShadow(
                color: AppTheme.deepNavy.withValues(alpha: 0.05),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              // ── Left: Cover 50% ────────────────────────────────────
              SizedBox(
                width: cardWidth * 0.50,
                height: cardHeight,
                child: ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(18),
                    bottomLeft: Radius.circular(18),
                  ),
                  child: resolvedCover != null
                      ? cached.CachedNetworkImage(
                          imageUrl: resolvedCover,
                          fit: BoxFit.cover,
                          filterQuality: FilterQuality.medium,
                          memCacheWidth: 300,
                            memCacheHeight: 400,
                          placeholder: (_, _) =>
                              _coverFallbackFull('🎵', _sectionColors[2]),
                          errorWidget: (_, _, _) =>
                              _coverFallbackFull('🎵', _sectionColors[2]),
                        )
                      : _coverFallbackFull('🎵', _sectionColors[2]),
                ),
              ),

              // ── Right: Text 50% ────────────────────────────────────
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppStyles.baloo2(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.darkNavy,
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (artist != null && artist.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          artist,
                          style: AppStyles.nunito(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.charcoal,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.mintGreen.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.music_note_rounded,
                              size: 12,
                              color: AppTheme.deepNavy,
                            ),
                            const SizedBox(width: 5),
                            Text(
                              'PLAY',
                              style: AppStyles.nunito(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.deepNavy,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  // ═══════════════════════════════════════════════════════════════
  //  STORIES SHELF — 80% width, 50/50 image/text
  // ═══════════════════════════════════════════════════════════════

  Widget _storiesShelf(
    BuildContext ctx,
    List<Map<String, dynamic>> stories, {
    required String emoji,
    required String title,
  }) {
    final screenWidth = MediaQuery.of(ctx).size.width;
    final cardWidth = screenWidth * 0.60;
    const cardHeight = 118.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _modernShelfHeader(
          emoji: emoji,
          title: title,
          color: _sectionColors[3],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: cardHeight + 12,
          child: PageView.builder(
            physics: const PageScrollPhysics(),
            padEnds: false,
            itemCount: stories.length,
            controller: _storiesController,
            itemBuilder: (_, i) => _storyCard(
              ctx,
              stories[i],
              cardWidth: cardWidth,
              cardHeight: cardHeight,
            ),
          ),
        ),
      ],
    );
  }

  Widget _storyCard(
    BuildContext ctx,
    Map<String, dynamic> story, {
    required double cardWidth,
    required double cardHeight,
  }) {
    final title = _s(story['title']) ?? 'Untitled';
    final author = _s(story['author']);
    final coverUrl = _s(story['coverUrl']);
    final resolvedCover = coverUrl != null
        ? AppConstants.resolveUrl(coverUrl)
        : null;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: GestureDetector(
        onTap: () => ctx.push(AppRoutes.storytelling),
        child: Container(
          decoration: BoxDecoration(
            color: AppTheme.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: _sectionColors[3].withValues(alpha: 0.45),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: _sectionColors[3].withValues(alpha: 0.45),
                blurRadius: 12,
                offset: const Offset(0, 5),
              ),
              BoxShadow(
                color: AppTheme.deepNavy.withValues(alpha: 0.05),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              // ── Left: Cover 50% ────────────────────────────────────
              SizedBox(
                width: cardWidth * 0.50,
                height: cardHeight,
                child: ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(18),
                    bottomLeft: Radius.circular(18),
                  ),
                  child: resolvedCover != null
                      ? cached.CachedNetworkImage(
                          imageUrl: resolvedCover,
                          fit: BoxFit.cover,
                          filterQuality: FilterQuality.medium,
                          memCacheWidth: 300,
                            memCacheHeight: 400,
                          placeholder: (_, _) =>
                              _coverFallbackFull('📖', _sectionColors[3]),
                          errorWidget: (_, _, _) =>
                              _coverFallbackFull('📖', _sectionColors[3]),
                        )
                      : _coverFallbackFull('📖', _sectionColors[3]),
                ),
              ),

              // ── Right: Text 50% ────────────────────────────────────
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppStyles.baloo2(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.darkNavy,
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (author != null && author.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          'By $author',
                          style: AppStyles.nunito(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.charcoal,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.softPurple.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.auto_stories_rounded,
                              size: 12,
                              color: AppTheme.deepPurple,
                            ),
                            const SizedBox(width: 5),
                            Text(
                              'STORY',
                              style: AppStyles.nunito(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.deepPurple,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  EXPLORE GRID — Colorful gradient cards
  // ═══════════════════════════════════════════════════════════════

  Widget _exploreGrid(BuildContext context, List<CategoryModel> categories) {
    final colors = [
      AppTheme.sunnyYellow,
      AppTheme.skyBlue,
      AppTheme.playfulRed,
      AppTheme.mintGreen,
      AppTheme.softPurple,
      AppTheme.softAmber,
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: List.generate(categories.length, (i) {
          final cat = categories[i];
          final color = colors[i % colors.length];
          return GestureDetector(
            onTap: () {
              if (cat.route != null) context.push(cat.route!);
            },
            child: Container(
              width: (MediaQuery.of(context).size.width - 42) / 2,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    color.withValues(alpha: 0.35),
                    color.withValues(alpha: 0.15),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: color.withValues(alpha: 0.3),
                  width: 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (cat.iconEmoji != null)
                    Text(cat.iconEmoji!, style: const TextStyle(fontSize: 28)),
                  const SizedBox(height: 6),
                  Text(
                    cat.name,
                    style: AppStyles.baloo2(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                    ),
                  ),
                  if (cat.description != null &&
                      cat.description!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      cat.description!,
                      style: AppStyles.nunito(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.charcoal,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          );
        }),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  FUN ERROR STATE
  // ═══════════════════════════════════════════════════════════════

  Widget _funErrorState({required String message, VoidCallback? onRetry}) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    AppTheme.playfulRed.withValues(alpha: 0.2),
                    AppTheme.sunnyYellow.withValues(alpha: 0.2),
                  ],
                ),
              ),
              child: const Center(
                child: Text('😅', style: TextStyle(fontSize: 56)),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Oops!',
              style: AppStyles.baloo2(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: AppStyles.nunito(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppTheme.charcoal,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              GestureDetector(
                onTap: onRetry,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.sunnyYellow,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.sunnyYellow.withValues(alpha: 0.4),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Text(
                    'Try Again',
                    style: AppStyles.nunito(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.deepNavy,
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

  // ═══════════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════════

  Widget _emptyHomeState(VoidCallback onRefresh) {
    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      color: AppTheme.sunnyYellow,
      backgroundColor: AppTheme.white,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(32, 56, 32, 32),
        children: [
          const Center(child: Text('🌈', style: TextStyle(fontSize: 64))),
          const SizedBox(height: 20),
          Text(
            'Nothing to show yet',
            textAlign: TextAlign.center,
            style: AppStyles.baloo2(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: AppTheme.darkNavy,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Books, music and stories will show up here once they are published.',
            textAlign: TextAlign.center,
            style: AppStyles.nunito(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppTheme.charcoal,
            ),
          ),
          const SizedBox(height: 24),
          Center(
            child: GestureDetector(
              onTap: onRefresh,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.sunnyYellow,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.sunnyYellow.withValues(alpha: 0.4),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Text(
                  'Try Again',
                  style: AppStyles.nunito(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.deepNavy,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String? _s(dynamic v) => v is String ? v : null;

}

// ═══════════════════════════════════════════════
//  ANIMATED SHIMMER LOADING
// ═══════════════════════════════════════════════

class _DiscoveryShimmer extends StatefulWidget {
  const _DiscoveryShimmer();

  @override
  State<_DiscoveryShimmer> createState() => _DiscoveryShimmerState();
}

class _DiscoveryShimmerState extends State<_DiscoveryShimmer>
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
            // Hero shimmer
            _shimmerBox(height: 280, radius: 24, t: t),
            const SizedBox(height: 20),
            // Category pills shimmer
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: 4,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (_, _) => _shimmerBox(
                  width: 90,
                  height: 40,
                  radius: 999,
                  t: t,
                ),
              ),
            ),
            const SizedBox(height: 20),
            // Shelf shimmer rows
            ...List.generate(
              3,
              (s) => Padding(
                padding: const EdgeInsets.only(bottom: 20),
                child: _shimmerBox(height: 176, radius: 28, t: t),
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
