import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/widgets/content_cards.dart';
import '../../../shared/widgets/app_background.dart';
import '../domain/books_state.dart';
import 'books_cubit.dart';
import 'books_widgets.dart';

/// Dedicated, book-only deep experience (audiobooks + e-books).
class BooksScreen extends StatefulWidget {
  const BooksScreen({super.key});

  @override
  State<BooksScreen> createState() => _BooksScreenState();
}

class _BooksScreenState extends State<BooksScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (context.read<BooksCubit>().state is! BooksLoaded) {
        context.read<BooksCubit>().loadInitial();
      }
    });
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 400) {
      context.read<BooksCubit>().loadMore();
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'Books',
      ),
      body: BlocBuilder<BooksCubit, BooksState>(
          builder: (context, state) {
            if (state is BooksError) {
              return FunErrorState(
                message: state.message,
                onRetry: () => context.read<BooksCubit>().loadInitial(),
              );
            }
            if (state is BooksLoaded) return _buildContent(state);
            return _buildShimmer();
          },
      ),
      bottomNavigationBar: const MainBottomNav(currentIndex: 1),
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

  Widget _buildContent(BooksLoaded state) {
    return RefreshIndicator(
      onRefresh: () => context.read<BooksCubit>().refresh(),
      child: CustomScrollView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                GenreFilterChips(
                  categories: state.categories,
                  selectedId: state.selectedCategoryId,
                  onSelected: (id) =>
                      context.read<BooksCubit>().selectCategory(id),
                ),
                const SizedBox(height: 20),
                ContinueReadingRow(
                  books: state.continueReading,
                  onTap: (b) => context
                      .push(AppRoutes.bookDetail.replaceFirst(':id', b.id)),
                ),
                AuthorSpotlightRow(
                  authors: state.authors,
                  onTap: (a) => context
                      .push(AppRoutes.authorProfile.replaceFirst(':id', a.id)),
                ),
                const BadgedSectionHeader(emoji: '📚', title: 'All Books'),
                if (state.books.isEmpty)
                  const FunEmptyState(
                    emoji: '📚',
                    title: 'No books here',
                    subtitle: 'Try a different genre',
                  ),
              ]),
            ),
          ),
          if (state.books.isNotEmpty)
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _bookListTile(state.books[index]),
                  ),
                  childCount: state.books.length,
                ),
              ),
            ),
          if (state.isLoadingMore)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 16)),
        ],
      ),
    );
  }

  Widget _bookListTile(BookModel book) {
    final resolvedCover = book.coverUrl != null
        ? AppConstants.resolveUrl(book.coverUrl!)
        : null;
    final isAudio = book.audioFile != null;
    final authorName =
        book.authors.isNotEmpty ? book.authors.first.name : null;
    final meta = <String>[];
    if (isAudio) {
      final secs = book.audioFile!.durationSeconds;
      final m = secs ~/ 60;
      if (m > 0) meta.add('$m min');
    }
    if (book.categories.isNotEmpty) meta.add(book.categories.first.name);

    return GestureDetector(
      onTap: () =>
          context.push(AppRoutes.bookDetail.replaceFirst(':id', book.id)),
      child: Container(
        height: 130,
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
              borderRadius: const BorderRadius.horizontal(
                left: Radius.circular(20),
              ),
              child: SizedBox(
                width: 100,
                height: double.infinity,
                child: resolvedCover != null
                    ? CachedNetworkImage(
                        imageUrl: resolvedCover,
                        fit: BoxFit.cover,
                        memCacheWidth: 200,
                        memCacheHeight: 260,
                        placeholder: (_, _) => Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppTheme.sunnyYellow,
                                AppTheme.skyBlue,
                              ],
                            ),
                          ),
                          child: const Center(
                            child: Text('📖', style: TextStyle(fontSize: 32)),
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
                            child: Text('📖', style: TextStyle(fontSize: 32)),
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
                          child: Text('📖', style: TextStyle(fontSize: 32)),
                        ),
                      ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      children: [
                        if (book.isPremium)
                          Container(
                            margin: const EdgeInsets.only(right: 6),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.gold,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              'PREMIUM',
                              style: AppStyles.nunito(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.deepNavy,
                              ),
                            ),
                          ),
                        if (isAudio)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.skyBlue.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              'AUDIO',
                              style: AppStyles.nunito(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.skyBlue,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      book.title,
                      style: AppStyles.baloo2(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.darkNavy,
                        height: 1.15,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (authorName != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        'by $authorName',
                        style: AppStyles.nunito(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.charcoal,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (book.avgRating > 0) ...[
                          const Icon(
                            Icons.star_rounded,
                            size: 16,
                            color: AppTheme.gold,
                          ),
                          const SizedBox(width: 2),
                          Text(
                            book.avgRating.toStringAsFixed(1),
                            style: AppStyles.baloo2(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.darkNavy,
                            ),
                          ),
                          const SizedBox(width: 10),
                        ],
                        if (meta.isNotEmpty)
                          Text(
                            meta.join(' · '),
                            style: AppStyles.nunito(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.charcoal,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.only(right: 14),
              child: Icon(
                Icons.arrow_forward_ios_rounded,
                size: 16,
                color: AppTheme.charcoal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
