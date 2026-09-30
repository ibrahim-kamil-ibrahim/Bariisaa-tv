import 'package:equatable/equatable.dart';
import '../../../shared/models/models.dart';

abstract class DiscoveryState extends Equatable {
  const DiscoveryState();
  @override
  List<Object?> get props => [];
}

class DiscoveryInitial extends DiscoveryState {}

class DiscoveryLoading extends DiscoveryState {}

class SearchLoaded extends DiscoveryState {
  final String query;
  final List<BookModel> results;
  final String? selectedCategory;
  final String? selectedLanguage;
  const SearchLoaded({
    this.query = '',
    this.results = const [],
    this.selectedCategory,
    this.selectedLanguage,
  });
  @override
  List<Object?> get props => [
    query,
    results,
    selectedCategory,
    selectedLanguage,
  ];
}

class CategoriesLoaded extends DiscoveryState {
  final List<CategoryModel> categories;
  final List<BookModel> books;
  final List<CategoryModel> exploreCategories;
  final List<BookModel> recommendations;

  /// Pre-filtered on the cubit isolate — never compute inside build().
  final List<BookModel> ebooks;
  final List<BookModel> audiobooks;

  /// Home-screen Music shelf (raw /music payloads).
  final List<Map<String, dynamic>> music;

  /// Home-screen Stories shelf (raw /storytelling payloads).
  final List<Map<String, dynamic>> stories;

  /// Unified featured content for hero carousel (music + books + stories).
  final List<Map<String, dynamic>> featuredContent;

  const CategoriesLoaded(
    this.categories, {
    this.books = const [],
    this.exploreCategories = const [],
    this.recommendations = const [],
    this.ebooks = const [],
    this.audiobooks = const [],
    this.music = const [],
    this.stories = const [],
    this.featuredContent = const [],
  });

  CategoriesLoaded copyWith({
    List<CategoryModel>? categories,
    List<BookModel>? books,
    List<CategoryModel>? exploreCategories,
    List<BookModel>? recommendations,
    List<BookModel>? ebooks,
    List<BookModel>? audiobooks,
    List<Map<String, dynamic>>? music,
    List<Map<String, dynamic>>? stories,
    List<Map<String, dynamic>>? featuredContent,
  }) {
    return CategoriesLoaded(
      categories ?? this.categories,
      books: books ?? this.books,
      exploreCategories: exploreCategories ?? this.exploreCategories,
      recommendations: recommendations ?? this.recommendations,
      ebooks: ebooks ?? this.ebooks,
      audiobooks: audiobooks ?? this.audiobooks,
      music: music ?? this.music,
      stories: stories ?? this.stories,
      featuredContent: featuredContent ?? this.featuredContent,
    );
  }

  @override
  List<Object?> get props => [
    categories,
    books,
    exploreCategories,
    recommendations,
    ebooks,
    audiobooks,
    music,
    stories,
    featuredContent,
  ];
}

class BookDetailLoaded extends DiscoveryState {
  final BookModel book;
  final List<ReviewModel> reviews;
  final List<BookModel> relatedBooks;
  const BookDetailLoaded({
    required this.book,
    this.reviews = const [],
    this.relatedBooks = const [],
  });
  @override
  List<Object?> get props => [book, reviews, relatedBooks];
}

class DiscoveryError extends DiscoveryState {
  final String message;
  const DiscoveryError(this.message);
  @override
  List<Object?> get props => [message];
}
