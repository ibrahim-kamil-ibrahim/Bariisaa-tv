import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/di/injection.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/models/models.dart';
import '../data/discovery_repository.dart';
import '../presentation/book_detail_cubit.dart';
import '../domain/book_detail_state.dart';
import '../../screen_theme/themed_screen_scaffold.dart';

class BookDetailScreen extends StatelessWidget {
  final String bookId;
  const BookDetailScreen({super.key, required this.bookId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) =>
          BookDetailCubit(getIt<DiscoveryRepository>())..loadBookDetail(bookId),
      child: _BookDetailContent(bookId: bookId),
    );
  }
}

class _BookDetailContent extends StatelessWidget {
  final String bookId;
  const _BookDetailContent({required this.bookId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ThemedScreenScaffold(
        screenKey: 'book_detail',
        child: BlocBuilder<BookDetailCubit, BookDetailState>(
          builder: (context, state) {
            if (state is BookDetailLoading) {
              return const LoadingMascot(message: 'Loading book...');
            }
            if (state is BookDetailError) {
              return FunErrorState(
                message: state.message,
                onRetry: () =>
                    context.read<BookDetailCubit>().loadBookDetail(bookId),
              );
            }
            if (state is BookDetailLoaded) {
              return _buildContent(context, state);
            }
            return const SizedBox.shrink();
          },
        ),
      ),
      bottomNavigationBar: BlocBuilder<BookDetailCubit, BookDetailState>(
        builder: (context, state) {
          if (state is BookDetailLoaded) {
            return _buildActionBar(context, state.book);
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildActionBar(BuildContext context, BookModel book) {
    final hasAudio = book.audioFile != null;
    final hasPdf = book.pdfFile != null;
    if (!hasAudio && !hasPdf) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: BoxDecoration(
        color: AppTheme.darkNavy,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.darkNavy.withValues(alpha: 0.3),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            if (hasAudio) ...[
              Expanded(
                child: GestureDetector(
                  onTap: () => context.push(AppRoutes.audioPlayer, extra: book),
                  child: Container(
                    height: 52,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.gold, Color(0xFFFFC93D)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.gold.withValues(alpha: 0.35),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.headphones_rounded,
                          size: 22,
                          color: AppTheme.deepNavy,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Listen',
                          style: AppStyles.nunito(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.deepNavy,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              if (hasPdf) const SizedBox(width: 12),
            ],
            if (hasPdf)
              Expanded(
                child: GestureDetector(
                  onTap: () =>
                      context.push(AppRoutes.ebookReader, extra: book),
                  child: Container(
                    height: 52,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.skyBlue, AppTheme.skyBlue],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.skyBlue.withValues(alpha: 0.35),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.menu_book_rounded,
                          size: 22,
                          color: AppTheme.white,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Read',
                          style: AppStyles.nunito(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, BookDetailLoaded state) {
    final book = state.book;
    final resolvedCover = book.coverUrl != null
        ? AppConstants.resolveUrl(book.coverUrl!)
        : null;
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 380,
          pinned: true,
          stretch: true,
          backgroundColor: AppTheme.darkNavy,
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              fit: StackFit.expand,
              children: [
                LayoutBuilder(
                  builder: (context, constraints) {
                    final width = constraints.maxWidth;
                    final height = width * 0.75;
                    return resolvedCover != null
                        ? CachedNetworkImage(
                            imageUrl: resolvedCover,
                            fit: BoxFit.cover,
                            memCacheWidth: width.toInt(),
                            memCacheHeight: height.toInt(),
                            maxWidthDiskCache: (width * 1.5).toInt(),
                            fadeInDuration: Duration.zero,
                            fadeOutDuration: Duration.zero,
                            placeholder: (_, _) => Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    AppTheme.darkNavy,
                                    AppTheme.deepNavy,
                                  ],
                                ),
                              ),
                            ),
                            errorWidget: (_, _, _) => Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    AppTheme.sunnyYellow,
                                    AppTheme.skyBlue,
                                  ],
                                ),
                              ),
                              child: const Center(
                                child: Text(
                                  '📖',
                                  style: TextStyle(fontSize: 64),
                                ),
                              ),
                            ),
                          )
                        : Container(
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  AppTheme.sunnyYellow,
                                  AppTheme.skyBlue,
                                ],
                              ),
                            ),
                            child: const Center(
                              child: Text(
                                '📖',
                                style: TextStyle(fontSize: 64),
                              ),
                            ),
                          );
                  },
                ),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.transparent,
                        Color(0xCC1F2A4A),
                        AppTheme.darkNavy,
                      ],
                      stops: [0.0, 0.5, 0.85, 1.0],
                    ),
                  ),
                ),
                Positioned(
                  left: 20,
                  right: 20,
                  bottom: 20,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (book.categories.isNotEmpty) ...[
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: book.categories
                              .take(3)
                              .map(
                                (c) => Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppTheme.gold.withValues(alpha: 0.9),
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: Text(
                                    c.name,
                                    style: AppStyles.nunito(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.deepNavy,
                                    ),
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                        const SizedBox(height: 10),
                      ],
                      Text(
                        book.title,
                        style: AppStyles.baloo2(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.white,
                          height: 1.1,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (book.authors.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          'by ${book.authors.map((a) => a.name).join(', ')}',
                          style: AppStyles.nunito(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.white.withValues(alpha: 0.85),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          leading: Padding(
            padding: const EdgeInsets.all(8),
            child: GestureDetector(
              onTap: () => context.pop(),
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppTheme.darkNavy.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.arrow_back_rounded,
                  size: 24,
                  color: AppTheme.white,
                ),
              ),
            ),
          ),
        ),

        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    ...List.generate(
                      5,
                      (i) => Padding(
                        padding: const EdgeInsets.only(right: 2),
                        child: Icon(
                          i < book.avgRating.round()
                              ? Icons.star_rounded
                              : Icons.star_border_rounded,
                          color: AppTheme.gold,
                          size: 26,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      book.avgRating.toStringAsFixed(1),
                      style: AppStyles.baloo2(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.darkNavy,
                      ),
                    ),
                    if (book.ratingCount > 0) ...[
                      const SizedBox(width: 4),
                      Text(
                        '(${book.ratingCount})',
                        style: AppStyles.nunito(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.charcoal,
                        ),
                      ),
                    ],
                    const Spacer(),
                    if (book.isPremium)
                      _BadgeChip(
                        label: 'Premium',
                        icon: Icons.workspace_premium_rounded,
                        background: AppTheme.gold,
                        foreground: AppTheme.deepNavy,
                      ),
                    if (book.isFree)
                      _BadgeChip(
                        label: 'Free',
                        icon: Icons.redeem_rounded,
                        background: AppTheme.mintGreen,
                        foreground: AppTheme.deepNavy,
                      ),
                    if (book.isPremium || book.isFree)
                      const SizedBox(width: 8),
                    _BadgeChip(
                      label: '${book.viewCount} views',
                      icon: Icons.remove_red_eye_rounded,
                      background: AppTheme.white,
                      foreground: AppTheme.charcoal,
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                _buildActionButtons(context, book),

                const SizedBox(height: 24),

                _AboutBookSection(description: book.description),

                const SizedBox(height: 24),

                GestureDetector(
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Coming soon! 📥',
                          style: AppStyles.nunito(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.white,
                          ),
                        ),
                        backgroundColor: AppTheme.skyBlue,
                      ),
                    );
                  },
                  child: Container(
                    height: 56,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppTheme.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: AppTheme.skyBlue.withValues(alpha: 0.3),
                        width: 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.skyBlue.withValues(alpha: 0.1),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.download_rounded,
                          size: 22,
                          color: AppTheme.skyBlue,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Download',
                          style: AppStyles.nunito(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.skyBlue,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                _buildReviewSection(context, state),

                if (state.relatedBooks.isNotEmpty) ...[
                  const SizedBox(height: 28),
                  FunSectionHeader(
                    icon: Icons.auto_stories,
                    title: 'You Might Also Like',
                    iconColor: AppTheme.skyBlue,
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 280,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: state.relatedBooks.length,
                      itemBuilder: (context, index) {
                        final related = state.relatedBooks[index];
                        final resolvedRelatedCover = related.coverUrl != null
                            ? AppConstants.resolveUrl(related.coverUrl!)
                            : null;
                        return Padding(
                          padding: const EdgeInsets.only(right: 14),
                          child: KidsBookCard(
                            title: related.title,
                            coverUrl: resolvedRelatedCover,
                            authorName: related.authors.isNotEmpty
                                ? related.authors.first.name
                                : null,
                            rating: related.avgRating,
                            isAudio: related.audioFile != null,
                            onTap: () => context.push(
                              AppRoutes.bookDetail.replaceFirst(
                                ':id',
                                related.id,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewTile(BuildContext context, ReviewModel review) {
    final hasAvatar = review.user.avatarUrl != null &&
        review.user.avatarUrl!.trim().isNotEmpty;
    final resolvedAvatar =
        hasAvatar ? AppConstants.resolveUrl(review.user.avatarUrl!) : null;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: AppTheme.cardDecoration(),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: AppTheme.skyBlue.withValues(alpha: 0.2),
            backgroundImage:
                resolvedAvatar != null ? CachedNetworkImageProvider(resolvedAvatar) : null,
            child: resolvedAvatar == null
                ? Text(
                    review.user.name.isNotEmpty
                        ? review.user.name[0].toUpperCase()
                        : '?',
                    style: AppStyles.nunito(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.darkNavy,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      review.user.name,
                      style: AppStyles.nunito(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.darkNavy,
                      ),
                    ),
                    const Spacer(),
                    Row(
                      children: List.generate(
                        5,
                        (i) => Icon(
                          i < review.rating.round()
                              ? Icons.star_rounded
                              : Icons.star_border_rounded,
                          color: AppTheme.gold,
                          size: 16,
                        ),
                      ),
                    ),
                  ],
                ),
                if (review.content != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    review.content!,
                    style: AppStyles.nunito(
                      fontSize: 14,
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
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, BookModel book) {
    final hasAudio = book.audioFile != null;
    final hasPdf = book.pdfFile != null;
    if (!hasAudio && !hasPdf) return const SizedBox.shrink();

    // Check if content is locked for this user
    final isContentLocked = book.isLocked ?? false;

    return Row(
      children: [
        if (hasAudio)
          Expanded(
            child: GestureDetector(
              onTap: isContentLocked
                  ? () => context.go(AppRoutes.paywall)
                  : () => context.push(AppRoutes.audioPlayer, extra: book),
              child: Container(
                height: 56,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  gradient: isContentLocked
                      ? LinearGradient(
                          colors: [AppTheme.skyBlue, AppTheme.skyBlue],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : const LinearGradient(
                          colors: [AppTheme.gold, Color(0xFFFFC93D)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: isContentLocked
                      ? [
                          BoxShadow(
                            color: AppTheme.skyBlue.withValues(alpha: 0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : [
                          BoxShadow(
                            color: AppTheme.gold.withValues(alpha: 0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.headphones_rounded,
                      size: 22,
                      color: AppTheme.deepNavy,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      isContentLocked
                          ? 'Subscribe to Listen'
                          : 'Listen',
                      style: AppStyles.nunito(
                        fontSize: isContentLocked ? 14 : 17,
                        fontWeight: FontWeight.w800,
                        color: isContentLocked ? AppTheme.charcoal : AppTheme.deepNavy,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        if (hasAudio && hasPdf) const SizedBox(width: 12),
        if (hasPdf)
          Expanded(
            child: GestureDetector(
              onTap: isContentLocked
                  ? () => context.go(AppRoutes.paywall)
                  : () => context.push(AppRoutes.ebookReader, extra: book),
              child: Container(
                height: 56,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  gradient: isContentLocked
                      ? LinearGradient(
                          colors: [AppTheme.skyBlue, AppTheme.skyBlue],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : const LinearGradient(
                          colors: [AppTheme.skyBlue, AppTheme.skyBlue],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: isContentLocked
                      ? [
                          BoxShadow(
                            color: AppTheme.skyBlue.withValues(alpha: 0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : [
                          BoxShadow(
                            color: AppTheme.skyBlue.withValues(alpha: 0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.menu_book_rounded,
                      size: 22,
                      color: isContentLocked ? AppTheme.charcoal : AppTheme.white,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      isContentLocked
                          ? 'Subscribe to Read'
                          : 'Read',
                      style: AppStyles.nunito(
                        fontSize: isContentLocked ? 14 : 17,
                        fontWeight: FontWeight.w800,
                        color: isContentLocked ? AppTheme.charcoal : AppTheme.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildReviewSection(BuildContext context, BookDetailLoaded state) {
    final book = state.book;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        FunSectionHeader(
          icon: Icons.chat_bubble_outline,
          title: 'Reviews',
          iconColor: AppTheme.playfulRed,
          onSeeAll: () => context.push(
            AppRoutes.reviews.replaceFirst(':bookId', book.id),
          ),
        ),
        if (state.reviews.isNotEmpty)
          ...state.reviews
              .take(3)
              .map((review) => _buildReviewTile(context, review))
        else
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Text(
              'No reviews yet. Be the first!',
              style: AppStyles.nunito(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.charcoal,
              ),
            ),
          ),
      ],
    );
  }
}

class _AboutBookSection extends StatefulWidget {
  final String? description;
  const _AboutBookSection({this.description});

  @override
  State<_AboutBookSection> createState() => _AboutBookSectionState();
}

class _AboutBookSectionState extends State<_AboutBookSection> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final text = widget.description ?? 'No description available.';
    final needsExpand = text.length > 150;

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.offWhite,
        borderRadius: BorderRadius.circular(24),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: needsExpand
                ? () => setState(() => _expanded = !_expanded)
                : null,
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.gold, Color(0xFFFFC93D)],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.menu_book_rounded,
                        size: 18,
                        color: AppTheme.deepNavy,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'About Book',
                      style: AppStyles.baloo2(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.darkNavy,
                      ),
                    ),
                  ),
                  if (needsExpand)
                    AnimatedRotation(
                      turns: _expanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: const Icon(
                        Icons.expand_more_rounded,
                        size: 24,
                        color: AppTheme.charcoal,
                      ),
                    ),
                ],
              ),
            ),
          ),
          AnimatedCrossFade(
            firstChild: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Text(
                text,
                style: AppStyles.nunito(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.charcoal,
                  height: 1.5,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Text(
                text,
                style: AppStyles.nunito(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.charcoal,
                  height: 1.5,
                ),
              ),
            ),
            crossFadeState: _expanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 200),
          ),
        ],
      ),
    );
  }
}

class _BadgeChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color background;
  final Color foreground;
  const _BadgeChip({
    required this.label,
    required this.icon,
    required this.background,
    required this.foreground,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: foreground),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppStyles.nunito(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: foreground,
            ),
          ),
        ],
      ),
    );
  }
}
