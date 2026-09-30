import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../presentation/reviews_cubit.dart';
import '../domain/reviews_state.dart';

class WriteReviewScreen extends StatefulWidget {
  final String bookId;

  const WriteReviewScreen({super.key, required this.bookId});

  @override
  State<WriteReviewScreen> createState() => _WriteReviewScreenState();
}

class _WriteReviewScreenState extends State<WriteReviewScreen> {
  int _rating = 5;
  final _contentController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'Write Review',
      ),
      body: BlocConsumer<ReviewsCubit, ReviewsState>(
        listener: (context, state) {
          if (state is ReviewSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('✅ Review submitted!'),
                backgroundColor: AppTheme.freshGreen,
              ),
            );
            Navigator.pop(context);
          }
          if (state is ReviewsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('😅 ${state.message}'),
                backgroundColor: AppTheme.playfulRed,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is ReviewsLoading) {
            return const LoadingMascot(
              emoji: '⏳',
              message: 'Submitting review...',
            );
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 24),
                  Center(
                    child: Text(
                      'Tap a star to rate',
                      style: AppStyles.baloo2(
                        fontSize: AppTheme.titleSize,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.darkText,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: List.generate(5, (i) {
                        final star = i + 1;
                        return GestureDetector(
                          onTap: () => setState(() => _rating = star),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Icon(
                              star <= _rating ? Icons.star : Icons.star_border,
                              color: Colors.amber,
                              size: 48,
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: Text(
                      _ratingLabels[_rating] ?? '',
                      style: AppStyles.nunito(
                        fontSize: AppTheme.bodySize,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.softGrey,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  Center(
                    child: Text(
                      '💡 A grown-up can help you write this part (optional)',
                      style: AppStyles.nunito(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.charcoal,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _contentController,
                    maxLines: 6,
                    maxLength: 500,
                    decoration: const InputDecoration(
                      labelText: 'Your review (optional)',
                      hintText: 'Share your thoughts about this book...',
                      alignLabelWithHint: true,
                    ),
                  ),
                  const SizedBox(height: 24),
                  BigTapButton(
                    onPressed: state is ReviewsLoading
                        ? null
                        : () {
                            context.read<ReviewsCubit>().submitReview(
                              bookId: widget.bookId,
                              rating: _rating.toDouble(),
                              content: _contentController.text.trim().isNotEmpty
                                  ? _contentController.text.trim()
                                  : null,
                            );
                          },
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('⭐', style: TextStyle(fontSize: 24)),
                        const SizedBox(width: 8),
                        Text(
                          'Submit Review',
                          style: AppStyles.nunito(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.white,
                          ),
                        ),
                      ],
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

  static const _ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };
}
