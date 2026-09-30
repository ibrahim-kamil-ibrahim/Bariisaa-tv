import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/widgets/content_cards.dart';
import '../../../shared/models/models.dart';

// ═══════════════════════════════════════════════════════════════
//  BooksScreen supporting widgets
// ═══════════════════════════════════════════════════════════════

/// Horizontally scrollable genre filter chips ("All" + categories).
class GenreFilterChips extends StatelessWidget {
  final List<CategoryModel> categories;
  final String? selectedId;
  final ValueChanged<String?> onSelected;
  const GenreFilterChips({
    super.key,
    required this.categories,
    required this.selectedId,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final chips = <(String?, String)>[
      (null, 'All'),
      ...categories.map((c) => (c.id, c.name)),
    ];
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: chips.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final (id, label) = chips[index];
          final selected = selectedId == id;
          return GestureDetector(
            onTap: () => onSelected(id),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
              decoration: BoxDecoration(
                color: selected ? AppTheme.skyBlue : AppTheme.white,
                borderRadius: BorderRadius.circular(AppTheme.chipRadius),
              ),
              child: Text(
                label,
                style: AppStyles.nunito(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: selected ? AppTheme.white : AppTheme.darkText,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// "Continue Reading/Listening" horizontal shelf.
class ContinueReadingRow extends StatelessWidget {
  final List<BookModel> books;
  final void Function(BookModel) onTap;
  const ContinueReadingRow({
    super.key,
    required this.books,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (books.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const BadgedSectionHeader(emoji: '📖', title: 'Continue Reading'),
        SizedBox(
          height: 250,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: books.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final book = books[index];
              final resolvedCover = book.coverUrl != null
                  ? AppConstants.resolveUrl(book.coverUrl!)
                  : null;
              return SizedBox(
                width: 168,
                child: book.audioFile != null
                    ? AudioBookCard(
                        title: book.title,
                        coverUrl: resolvedCover,
                        author: book.authors.isNotEmpty
                            ? book.authors.first.name
                            : null,
                        rating: book.avgRating,
                        durationSeconds: book.audioFile?.durationSeconds,
                        isPremium: book.isPremium,
                        onTap: () => onTap(book),
                      )
                    : EbookCard(
                        title: book.title,
                        coverUrl: resolvedCover,
                        author: book.authors.isNotEmpty
                            ? book.authors.first.name
                            : null,
                        rating: book.avgRating,
                        isPremium: book.isPremium,
                        onTap: () => onTap(book),
                      ),
              );
            },
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
}

/// "Author Spotlight" horizontal shelf.
class AuthorSpotlightRow extends StatelessWidget {
  final List<AuthorModel> authors;
  final void Function(AuthorModel) onTap;
  const AuthorSpotlightRow({
    super.key,
    required this.authors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (authors.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const BadgedSectionHeader(emoji: '✍️', title: 'Author Spotlight'),
        SizedBox(
          height: 150,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: authors.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final author = authors[index];
              final hasPhoto = author.photoUrl != null &&
                  author.photoUrl!.trim().isNotEmpty;
              final resolvedPhoto = hasPhoto
                  ? AppConstants.resolveUrl(author.photoUrl!)
                  : null;
              final initial =
                  author.name.isNotEmpty ? author.name[0].toUpperCase() : '?';
              return GestureDetector(
                onTap: () => onTap(author),
                child: Container(
                  width: 130,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      AppTheme.clayShadow(
                        color: AppTheme.deepNavy.withValues(alpha: 0.14),
                        blur: 22,
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
                        if (hasPhoto)
                          CachedNetworkImage(
                            imageUrl: resolvedPhoto!,
                            fit: BoxFit.cover,
                            placeholder: (_, _) => Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    AppTheme.sunnyYellow,
                                    AppTheme.skyBlue,
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                              ),
                            ),
                            errorWidget: (_, _, _) =>
                                _buildFallback(initial),
                          )
                        else
                          _buildFallback(initial),
                        const DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.transparent,
                                Color(0xCC1F2A4A),
                              ],
                              stops: [0.35, 1.0],
                            ),
                          ),
                        ),
                        Positioned(
                          left: 12,
                          right: 12,
                          bottom: 12,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                author.name,
                                style: AppStyles.baloo2(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.white,
                                  height: 1.1,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'View Profile',
                                style: AppStyles.nunito(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.gold,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Positioned(
                          top: 10,
                          right: 10,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.gold,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: const Icon(
                              Icons.arrow_forward_rounded,
                              size: 14,
                              color: AppTheme.deepNavy,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildFallback(String initial) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.sunnyYellow, AppTheme.skyBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          initial,
          style: AppStyles.baloo2(
            fontSize: 40,
            fontWeight: FontWeight.w800,
            color: AppTheme.white,
          ),
        ),
      ),
    );
  }
}
