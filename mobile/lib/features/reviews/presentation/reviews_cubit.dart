import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/reviews_state.dart';
import '../data/reviews_repository.dart';
import '../../../shared/models/models.dart';

class ReviewsCubit extends Cubit<ReviewsState> {
  final ReviewsRepository _repository;

  ReviewsCubit(this._repository) : super(ReviewsInitial());

  void loadReviews(String bookId) async {
    emit(ReviewsLoading());
    try {
      final results = await Future.wait([
        _repository.getReviews(bookId),
        _repository.getRatingDistribution(bookId),
      ]);
      emit(
        ReviewsLoaded(
          reviews: (results[0] as List<dynamic>).cast<ReviewModel>(),
          ratingDistribution: results[1] as Map<String, int>,
        ),
      );
    } catch (e) {
      emit(ReviewsError('Failed to load reviews: $e'));
    }
  }

  void submitReview({
    required String bookId,
    required double rating,
    String? content,
  }) async {
    emit(ReviewsLoading());
    try {
      await _repository.submitReview(
        bookId: bookId,
        rating: rating,
        content: content,
      );
      emit(const ReviewSuccess('Review submitted'));
      loadReviews(bookId);
    } catch (e) {
      emit(ReviewsError('Failed to submit: $e'));
    }
  }
}
