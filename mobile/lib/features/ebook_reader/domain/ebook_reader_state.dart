import 'package:equatable/equatable.dart';
import '../../../shared/models/models.dart';

abstract class EbookReaderState extends Equatable {
  const EbookReaderState();

  @override
  List<Object?> get props => [];
}

class EbookReaderInitial extends EbookReaderState {}

class EbookReaderLoading extends EbookReaderState {}

class EbookReaderLoaded extends EbookReaderState {
  final BookModel book;
  final String? localPdfPath;
  final String theme;
  final double fontSize;
  final String fontFamily;
  final List<BookmarkModel> bookmarks;
  final int currentPage;

  const EbookReaderLoaded({
    required this.book,
    this.localPdfPath,
    this.theme = 'light',
    this.fontSize = 16.0,
    this.fontFamily = 'Inter',
    this.bookmarks = const [],
    this.currentPage = 0,
  });

  EbookReaderLoaded copyWith({
    BookModel? book,
    String? localPdfPath,
    String? theme,
    double? fontSize,
    String? fontFamily,
    List<BookmarkModel>? bookmarks,
    int? currentPage,
  }) {
    return EbookReaderLoaded(
      book: book ?? this.book,
      localPdfPath: localPdfPath ?? this.localPdfPath,
      theme: theme ?? this.theme,
      fontSize: fontSize ?? this.fontSize,
      fontFamily: fontFamily ?? this.fontFamily,
      bookmarks: bookmarks ?? this.bookmarks,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props => [
    book,
    localPdfPath,
    theme,
    fontSize,
    fontFamily,
    bookmarks,
    currentPage,
  ];
}

class EbookReaderError extends EbookReaderState {
  final String message;

  const EbookReaderError(this.message);

  @override
  List<Object?> get props => [message];
}
