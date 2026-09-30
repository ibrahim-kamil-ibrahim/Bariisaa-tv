import 'package:equatable/equatable.dart';
import '../../../shared/models/models.dart';

const _unset = Object();

abstract class BooksState extends Equatable {
  const BooksState();

  @override
  List<Object?> get props => [];
}

class BooksInitial extends BooksState {}

class BooksLoading extends BooksState {}

class BooksLoaded extends BooksState {
  final String? selectedCategoryId;
  final List<CategoryModel> categories;
  final List<BookModel> books;
  final List<BookModel> continueReading;
  final List<AuthorModel> authors;
  final int page;
  final bool hasMore;
  final bool isLoadingMore;

  const BooksLoaded({
    this.selectedCategoryId,
    this.categories = const [],
    this.books = const [],
    this.continueReading = const [],
    this.authors = const [],
    this.page = 1,
    this.hasMore = true,
    this.isLoadingMore = false,
  });

  BooksLoaded copyWith({
    Object? selectedCategoryId = _unset,
    List<CategoryModel>? categories,
    List<BookModel>? books,
    List<BookModel>? continueReading,
    List<AuthorModel>? authors,
    int? page,
    bool? hasMore,
    bool? isLoadingMore,
  }) {
    return BooksLoaded(
      selectedCategoryId: identical(selectedCategoryId, _unset)
          ? this.selectedCategoryId
          : selectedCategoryId as String?,
      categories: categories ?? this.categories,
      books: books ?? this.books,
      continueReading: continueReading ?? this.continueReading,
      authors: authors ?? this.authors,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    );
  }

  @override
  List<Object?> get props => [
    selectedCategoryId,
    categories,
    books,
    continueReading,
    authors,
    page,
    hasMore,
    isLoadingMore,
  ];
}

class BooksError extends BooksState {
  final String message;

  const BooksError(this.message);

  @override
  List<Object?> get props => [message];
}
