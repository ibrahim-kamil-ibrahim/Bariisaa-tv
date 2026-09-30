import 'package:equatable/equatable.dart';
import '../../../shared/models/models.dart';

abstract class BookDetailState extends Equatable {
  const BookDetailState();
  @override
  List<Object?> get props => [];
}

class BookDetailInitial extends BookDetailState {}

class BookDetailLoading extends BookDetailState {}

class BookDetailLoaded extends BookDetailState {
  final BookModel book;
  final List<ReviewModel> reviews;
  final List<BookModel> relatedBooks;

  const BookDetailLoaded({
    required this.book,
    this.reviews = const [],
    this.relatedBooks = const [],
  });

  BookDetailLoaded copyWith({
    BookModel? book,
    List<ReviewModel>? reviews,
    List<BookModel>? relatedBooks,
  }) {
    return BookDetailLoaded(
      book: book ?? this.book,
      reviews: reviews ?? this.reviews,
      relatedBooks: relatedBooks ?? this.relatedBooks,
    );
  }

  @override
  List<Object?> get props => [book, reviews, relatedBooks];
}

class BookDetailError extends BookDetailState {
  final String message;
  const BookDetailError(this.message);
  @override
  List<Object?> get props => [message];
}
