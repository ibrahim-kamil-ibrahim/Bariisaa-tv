import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/styles.dart';
import '../models/models.dart';

/// 50/50 horizontal book card: left = info (title + author), right = cover image.
/// Default size = 168×200 for horizontal shelves; [BookCard5050.list] renders
/// full-width (list column) with the same 50/50 split.
class BookCard5050 extends StatelessWidget {
  final BookModel book;
  final VoidCallback onTap;
  final VoidCallback? onPlay;
  final VoidCallback? onRead;
  final double? fixedWidth;

  const BookCard5050({
    super.key,
    required this.book,
    required this.onTap,
    this.onPlay,
    this.onRead,
    this.fixedWidth = 168,
  });

  /// Full-width variant for vertical list columns (Books / Audio Books lists).
  const BookCard5050.list({
    super.key,
    required this.book,
    required this.onTap,
    this.onPlay,
    this.onRead,
  }) : fixedWidth = null;

  @override
  Widget build(BuildContext context) {
    final title = book.title;
    final author = book.authors.isNotEmpty ? book.authors.first.name : null;
    final category = book.categories.isNotEmpty
        ? book.categories.first.name
        : null;
    final rating = book.avgRating;
    final isAudio = book.audioFile != null;
    final isPdf = book.pdfFile != null;
    final durationSec = book.audioFile?.durationSeconds;

    return SizedBox(
      height: 200,
      width: fixedWidth,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              color: AppTheme.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.deepNavy.withValues(alpha: 0.10),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              children: [
                // LEFT — 50% information text column
                Expanded(
                  flex: 1,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(14, 14, 10, 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (category != null && category.isNotEmpty) ...[
                          Text(
                            category.toUpperCase(),
                            style: AppStyles.nunito(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.playfulRed,
                              letterSpacing: 1.1,
                            ),
                          ),
                          const SizedBox(height: 3),
                        ],
                        Text(
                          title,
                          style: AppStyles.baloo2(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.darkNavy,
                            height: 1.15,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (author != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            'By $author',
                            style: AppStyles.nunito(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.charcoal,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        const SizedBox(height: 6),
                        // Meta row: rating + duration/PDF chips. Each chip is
                        // Flexible so text can ellipsize instead of overflowing
                        // the ~60px-wide left half of the card.
                        Row(
                          children: [
                            if (rating > 0) ...[
                              const Icon(
                                Icons.star_rounded,
                                size: 13,
                                color: AppTheme.sunnyYellow,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                rating.toStringAsFixed(1),
                                style: AppStyles.nunito(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.darkNavy,
                                ),
                              ),
                              const SizedBox(width: 6),
                            ],
                            if (isAudio && durationSec != null)
                              Flexible(
                                child: _miniMetaChip(
                                  Icons.timer_outlined,
                                  _formatDuration(durationSec),
                                ),
                              ),
                            if (isPdf)
                              Flexible(
                                child: _miniMetaChip(
                                  Icons.picture_as_pdf_rounded,
                                  'PDF',
                                ),
                              ),
                          ],
                        ),
                        // Action button on its own row — the meta row above is
                        // too narrow (half of a 168px card) to also hold it.
                        if (onPlay != null) ...[
                          const SizedBox(height: 8),
                          _actionPill(
                            onTap: onPlay!,
                            icon: Icons.play_arrow_rounded,
                            label: 'PLAY',
                            background: AppTheme.sunnyYellow,
                            foreground: AppTheme.darkNavy,
                          ),
                        ] else if (onRead != null) ...[
                          const SizedBox(height: 8),
                          _actionPill(
                            onTap: onRead!,
                            icon: Icons.menu_book_rounded,
                            label: 'READ',
                            background: AppTheme.gold,
                            foreground: AppTheme.deepPurple,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                // Vertical divider between text and cover
                const VerticalDivider(
                  width: 1,
                  thickness: 1,
                  color: AppTheme.lightPurple,
                ),
                // RIGHT — 50% cover image
                Expanded(
                  flex: 1,
                  child: ClipRRect(
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(16),
                      bottomLeft: Radius.circular(16),
                    ),
                    child: book.coverUrl != null && book.coverUrl!.isNotEmpty
                        ? Image.network(
                            book.coverUrl!,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: double.infinity,
                            loadingBuilder: (context, child, progress) {
                              if (progress == null) return child;
                              return Container(
                                color: AppTheme.creamBg,
                                child: Center(
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      AppTheme.sunnyYellow,
                                    ),
                                  ),
                                ),
                              );
                            },
                            errorBuilder: (context, error, stack) =>
                                _coverFallback(),
                          )
                        : _coverFallback(),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _miniMetaChip(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 11, color: AppTheme.charcoal),
        const SizedBox(width: 3),
        Flexible(
          child: Text(
            label,
            style: AppStyles.nunito(
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
              color: AppTheme.charcoal,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _actionPill({
    required VoidCallback onTap,
    required IconData icon,
    required String label,
    required Color background,
    required Color foreground,
  }) {
    return Align(
      alignment: Alignment.centerLeft,
      child: GestureDetector(
        onTap: onTap,
        // FittedBox.scaleDown: renders the pill at natural size when it fits,
        // and uniformly scales it down on narrow cards — works at every size.
        child: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
            decoration: BoxDecoration(
              color: background,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 14, color: foreground),
                const SizedBox(width: 3),
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
          ),
        ),
      ),
    );
  }

  Widget _coverFallback() {
    return Container(
      color: AppTheme.creamBg,
      child: Center(
        child: Text(
          book.audioFile != null ? '🎧' : '📖',
          style: const TextStyle(fontSize: 32),
        ),
      ),
    );
  }

  String _formatDuration(int totalSec) {
    final h = totalSec ~/ 3600;
    final m = (totalSec % 3600) ~/ 60;
    final s = totalSec % 60;
    if (h > 0) return '${h}h ${m}m';
    if (m > 0) return '${m}m ${s}s';
    return '${s}s';
  }
}
