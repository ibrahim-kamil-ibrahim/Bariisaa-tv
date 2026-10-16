import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/discovery_state.dart';
import '../data/discovery_repository.dart';
import '../../../shared/models/models.dart';

/// Cubit for the home/discovery screen: loads categories, the "For You" shelf
/// (recommendations + hardcoded fallback), and individual book details.
class DiscoveryCubit extends Cubit<DiscoveryState> {
  final DiscoveryRepository _repository;

  DiscoveryCubit(this._repository) : super(DiscoveryInitial());

  void searchBooks({
    required String query,
    String? categoryId,
    String? language,
  }) async {
    // Don't emit DiscoveryLoading — the home screen shares this cubit and
    // would flash its full-page shimmer while search results load. The
    // search screen shows its own loading indicator.
    try {
      final results = await _repository.searchBooks(
        query: query,
        categoryId: categoryId,
        language: language,
      );
      if (isClosed) return;
      emit(
        SearchLoaded(
          query: query,
          results: results,
          selectedCategory: categoryId,
          selectedLanguage: language,
        ),
      );
    } catch (e) {
      if (isClosed) return;
      emit(DiscoveryError('Failed to search: $e'));
    }
  }

  void loadCategories() async {
    // Only show the full-page shimmer on first load / explicit retry.
    // Refreshing while content is already on screen must not blank the UI.
    if (state is! CategoriesLoaded) emit(DiscoveryLoading());

    Future<T> guard<T>(Future<T> future, T fallback) async {
      try {
        return await future;
      } catch (e) {
        if (kDebugMode) debugPrint('discovery load failed: $e');
        return fallback;
      }
    }

    // First paint: categories + recommendations (above-the-fold content).
    final first = await Future.wait<dynamic>([
      guard(_repository.getCategories(), <CategoryModel>[]),
      guard(_repository.getRecommendations(limit: 8), <BookModel>[]),
    ]);
    if (isClosed) return;

    final categories = first[0] as List<CategoryModel>;
    final books = first[1] as List<BookModel>;
    final ebooks = books.where((b) => b.pdfFile != null).toList();
    final audiobooks = books.where((b) => b.audioFile != null).toList();

    if (categories.isEmpty && books.isEmpty) {
      emit(
        const DiscoveryError(
          'Unable to load the home screen. Check your internet connection and try again.',
        ),
      );
      return;
    }

    emit(
      CategoriesLoaded(
        categories,
        recommendations: books,
        ebooks: ebooks,
        audiobooks: audiobooks,
      ),
    );

    // Supplementary shelves: load after first paint so the screen is never
    // blocked by the slowest call.
    final rest = await Future.wait<dynamic>([
      guard(_repository.getExploreCategories(), <CategoryModel>[]),
      guard(_repository.getMusicTracks(limit: 10), <Map<String, dynamic>>[]),
      guard(_repository.getStories(limit: 10), <Map<String, dynamic>>[]),
      guard(_repository.getFeaturedMusic(limit: 5), <Map<String, dynamic>>[]),
    ]);
    if (isClosed) return;

    final featuredMusicList = rest[3] as List<Map<String, dynamic>>;
    final storiesList = rest[2] as List<Map<String, dynamic>>;
    final featuredContent = <Map<String, dynamic>>[];

    for (final m in featuredMusicList) {
      featuredContent.add({
        'type': 'music',
        'id': '${m['id'] ?? ''}',
        'title': '${m['title'] ?? 'Untitled'}',
        'subtitle': '${m['artist'] ?? ''}',
        'coverUrl': m['coverUrl'],
        'emoji': '🎵',
        'badge': 'MUSIC',
      });
    }

    for (final book in ebooks.take(3)) {
      featuredContent.add({
        'type': 'book',
        'id': book.id,
        'title': book.title,
        'subtitle': book.authors.map((a) => a.name).join(', '),
        'coverUrl': book.coverUrl,
        'description': book.description,
        'emoji': '📖',
        'badge': 'BOOK',
      });
    }

    for (final ab in audiobooks.take(3)) {
      featuredContent.add({
        'type': 'audio',
        'id': ab.id,
        'title': ab.title,
        'subtitle': ab.authors.map((a) => a.name).join(', '),
        'coverUrl': ab.coverUrl,
        'description': ab.description,
        'emoji': '🎧',
        'badge': 'AUDIO',
      });
    }

    for (final s in storiesList.take(3)) {
      featuredContent.add({
        'type': 'story',
        'id': '${s['id'] ?? ''}',
        'title': '${s['title'] ?? 'Untitled'}',
        'subtitle': '${s['author'] ?? ''}',
        'coverUrl': s['coverUrl'],
        'emoji': '📖',
        'badge': 'STORY',
      });
    }
    featuredContent.shuffle();

    if (isClosed) return;
    emit(
      CategoriesLoaded(
        categories,
        recommendations: books,
        exploreCategories: rest[0] as List<CategoryModel>,
        ebooks: ebooks,
        audiobooks: audiobooks,
        music: rest[1] as List<Map<String, dynamic>>,
        stories: storiesList,
        featuredContent: featuredContent.take(12).toList(),
      ),
    );
  }

  void loadBookDetail(String bookId) async {
    emit(DiscoveryLoading());
    try {
      BookModel? book;
      List<ReviewModel> reviews = [];
      List<BookModel> relatedBooks = [];

      try {
        book = await _repository.getBookDetail(bookId);
      } catch (e) {
        if (kDebugMode) debugPrint('getBookDetail failed: $e');
        rethrow;
      }

      final results = await Future.wait([
        _repository.getBookReviews(bookId).catchError((e) => <ReviewModel>[]),
        _repository.getRelatedBooks(bookId).catchError((e) => <BookModel>[]),
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
      emit(DiscoveryError('Failed to load book: $e'));
    }
  }

  Future<void> toggleFavorite(String bookId) async {
    try {
      await _repository.toggleFavorite(bookId);
    } catch (e) {
      if (kDebugMode) debugPrint('toggleFavorite failed: $e');
    }
  }
}
