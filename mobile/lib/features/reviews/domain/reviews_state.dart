import 'package:equatable/equatable.dart';
import '../../../shared/models/models.dart';

abstract class ReviewsState extends Equatable {
  const ReviewsState();

  @override
  List<Object?> get props => [];
}

class ReviewsInitial extends ReviewsState {}

class ReviewsLoading extends ReviewsState {}

class ReviewsLoaded extends ReviewsState {
  final List<ReviewModel> reviews;
  final Map<String, int> ratingDistribution;

  const ReviewsLoaded({
    this.reviews = const [],
    this.ratingDistribution = const {},
  });

  @override
  List<Object?> get props => [reviews, ratingDistribution];
}

class ReviewSuccess extends ReviewsState {
  final String message;

  const ReviewSuccess(this.message);

  @override
  List<Object?> get props => [message];
}

class ReviewsError extends ReviewsState {
  final String message;

  const ReviewsError(this.message);

  @override
  List<Object?> get props => [message];
}
