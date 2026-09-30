import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/books_state.dart';
import '../data/books_repository.dart';
import '../../../shared/models/models.dart';
import '../../../features/history/data/history_repository.dart';

class BooksCubit extends Cubit<BooksState> {
  final BooksRepository _repository;
  final HistoryRepository _historyRepository;

  BooksCubit(this._repository, this._historyRepository) : super(BooksInitial());

  Future<void> loadInitial() async {
    emit(BooksLoading());
    try {
      final results = await Future.wait<dynamic>([
        _repository.getCategories(),
        _repository.getAuthors(limit: 10),
        _historyRepository.getRecentBooks(limit: 5),
        _repository.getNewReleases(page: 1, limit: 20),
      ]);
      if (isClosed) return;
      final books = results[3] as List<BookModel>;
      emit(
        BooksLoaded(
          categories: results[0] as List<CategoryModel>,
          authors: results[1] as List<AuthorModel>,
          continueReading: results[2] as List<BookModel>,
          books: books,
          page: 1,
          hasMore: books.length >= 20,
        ),
      );
    } catch (e) {
      if (isClosed) return;
      emit(BooksError('Failed to load books: $e'));
    }
  }

  Future<void> selectCategory(String? categoryId) async {
    if (state is! BooksLoaded) return;
    final current = state as BooksLoaded;
    emit(
      current.copyWith(
        selectedCategoryId: categoryId,
        isLoadingMore: true,
        page: 1,
        hasMore: true,
      ),
    );
    await _fetchBooks(reset: true);
  }

  Future<void> loadMore() async {
    if (state is! BooksLoaded) return;
    final current = state as BooksLoaded;
    if (current.isLoadingMore || !current.hasMore) return;
    emit(current.copyWith(isLoadingMore: true));
    await _fetchBooks(reset: false);
  }

  Future<void> _fetchBooks({required bool reset}) async {
    if (state is! BooksLoaded) return;
    final current = state as BooksLoaded;
    final page = reset ? 1 : current.page + 1;
    try {
      final List<BookModel> fetched;
      if (current.selectedCategoryId != null) {
        fetched = await _repository.getBooks(
          categoryId: current.selectedCategoryId,
          page: page,
          limit: 20,
        );
      } else {
        fetched = await _repository.getNewReleases(page: page, limit: 20);
      }

      if (isClosed) return;
      final books = reset ? fetched : [...current.books, ...fetched];
      emit(
        current.copyWith(
          books: books,
          page: page,
          hasMore: fetched.isNotEmpty,
          isLoadingMore: false,
        ),
      );
    } catch (e) {
      if (isClosed) return;
      if (reset) {
        emit(BooksError('Failed to load books: $e'));
      } else {
        emit(current.copyWith(isLoadingMore: false));
      }
    }
  }

  Future<void> refresh() => loadInitial();
}
