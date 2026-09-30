import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naik_mobile/shared/styles.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/navigation/app_router.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/models/models.dart';
import '../presentation/reviews_cubit.dart';
import '../domain/reviews_state.dart';

class ReviewsScreen extends StatelessWidget {
  final String bookId;

  const ReviewsScreen({super.key, required this.bookId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: context.read<ReviewsCubit>()..loadReviews(bookId),
      child: Scaffold(
        backgroundColor: AppTheme.creamBg,
        appBar: BariisaaAppBar(
          title: 'Reviews',
        ),
        body: BlocBuilder<ReviewsCubit, ReviewsState>(
          builder: (context, state) {
            if (state is ReviewsLoading) {
              return const LoadingMascot(
                emoji: '📖',
                message: 'Loading reviews...',
              );
            }
            if (state is ReviewsError) {
              return FunErrorState(
                message: state.message,
                onRetry: () => context.read<ReviewsCubit>().loadReviews(bookId),
              );
            }
            if (state is ReviewsLoaded) {
              final total = state.reviews.length;
              final avg = total > 0
                  ? state.reviews.map((r) => r.rating).reduce((a, b) => a + b) /
                        total
                  : 0.0;
              final itemCount = state.reviews.isEmpty
                  ? 1
                  : state.reviews.length + 2;
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: itemCount,
                itemBuilder: (context, index) {
                  if (index == 0) {
                    return _buildRatingDistribution(context, state, total, avg);
                  }
                  if (index == 1) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${state.reviews.length} reviews',
                            style: AppStyles.nunito(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.darkText,
                            ),
                          ),
                          BigTapButton(
                            onPressed: () => context.push(
                              AppRoutes.writeReview.replaceFirst(
                                ':bookId',
                                bookId,
                              ),
                            ),
                            color: AppTheme.skyBlue,
                            height: 48,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 10,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text(
                                  '✏️',
                                  style: TextStyle(fontSize: 20),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Write',
                                  style: AppStyles.nunito(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }
                  if (state.reviews.isEmpty) {
                    return const FunEmptyState(
                      emoji: '📭',
                      title: 'No reviews yet',
                      subtitle: 'Be the first to share your thoughts!',
                    );
                  }
                  return _buildReviewTile(context, state.reviews[index - 2]);
                },
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildRatingDistribution(
    BuildContext context,
    ReviewsLoaded state,
    int total,
    double avg,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppTheme.cardDecoration(),
      child: Row(
        children: [
          Column(
            children: [
              Text(
                avg.toStringAsFixed(1),
                style: AppStyles.baloo2(
                  fontSize: 40,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.sunnyYellow,
                ),
              ),
              const SizedBox(height: 4),
              const Text('⭐⭐⭐⭐⭐', style: TextStyle(fontSize: 16)),
            ],
          ),
          const SizedBox(width: 24),
          Expanded(
            child: Column(
              children: List.generate(5, (i) {
                final star = 5 - i;
                final count = state.ratingDistribution[star.toString()] ?? 0;
                final ratio = total > 0 ? count / total : 0.0;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Row(
                    children: [
                      Text(
                        '$star',
                        style: AppStyles.nunito(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.darkText,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: LinearProgressIndicator(
                            value: ratio,
                            backgroundColor: AppTheme.softGrey,
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              AppTheme.sunnyYellow,
                            ),
                            minHeight: 10,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '$count',
                        style: AppStyles.nunito(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.softGrey,
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewTile(BuildContext context, ReviewModel review) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: AppTheme.cardDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: AppTheme.skyBlue.withValues(alpha: 0.15),
                  child: Text(
                    review.user.name[0].toUpperCase(),
                    style: AppStyles.nunito(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.skyBlue,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        review.user.name,
                        style: AppStyles.nunito(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.darkText,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Text(
                            '⭐' * review.rating.round(),
                            style: const TextStyle(fontSize: 14),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _formatDate(review.createdAt),
                            style: AppStyles.nunito(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.softGrey,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (review.content != null) ...[
              const SizedBox(height: 10),
              Text(
                review.content!,
                style: AppStyles.nunito(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.darkText,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${date.day}/${date.month}/${date.year}';
  }
}
