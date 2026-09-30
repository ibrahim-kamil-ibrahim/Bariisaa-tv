import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/book_detail_state.dart';
import '../data/discovery_repository.dart';
import '../../../shared/models/models.dart';

class BookDetailCubit extends Cubit<BookDetailState> {
  final DiscoveryRepository _repository;

  BookDetailCubit(this._repository) : super(BookDetailInitial());

  Future<void> loadBookDetail(String bookId) async {
    emit(BookDetailLoading());
    try {
      BookModel? book;
      List<ReviewModel> reviews = [];
      List<BookModel> relatedBooks = [];

      // Fetch book detail (required), reviews and related books (optional)
      try {
        book = await _repository.getBookDetail(bookId);
      } catch (e) {
        if (kDebugMode) debugPrint('getBookDetail failed: $e');
        rethrow; // Book detail is critical — fail entirely
      }

      // Reviews and related books can fail gracefully
      final results = await Future.wait([
        _repository.getBookReviews(bookId).catchError((e) {
          if (kDebugMode) debugPrint('getBookReviews failed: $e');
          return <ReviewModel>[];
        }),
        _repository.getRelatedBooks(bookId).catchError((e) {
          if (kDebugMode) debugPrint('getRelatedBooks failed: $e');
          return <BookModel>[];
        }),
      ]);

      reviews = (results[0] as List<dynamic>).cast<ReviewModel>();
      relatedBooks = (results[1] as List<dynamic>).cast<BookModel>();

      if (isClosed) return;
      emit(
        BookDetailLoaded(
          book: book,
          reviews: reviews,
          relatedBooks: relatedBooks,
        ),
      );
    } catch (e) {
      if (isClosed) return;
      emit(BookDetailError('Failed to load book: $e'));
    }
  }

  Future<void> toggleFavorite(String bookId) async {
    try {
      await _repository.toggleFavorite(bookId);
      await loadBookDetail(bookId);
    } catch (e) {
      if (kDebugMode) debugPrint('toggleFavorite failed: $e');
    }
  }
}
