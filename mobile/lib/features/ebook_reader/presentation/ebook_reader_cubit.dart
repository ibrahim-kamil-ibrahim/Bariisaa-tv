import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/ebook_reader_state.dart';
import '../data/ebook_reader_repository.dart';
import '../../../shared/models/models.dart';
import '../../../core/constants/app_constants.dart';

class EbookReaderCubit extends Cubit<EbookReaderState> {
  final EbookReaderRepository _repository;
  Timer? _progressTimer;

  EbookReaderCubit(this._repository) : super(EbookReaderInitial());

  Future<void> loadBook(BookModel book) async {
    emit(EbookReaderLoading());
    try {
      final pdfUrl = book.pdfFile?.fileUrl;
      String? localPath;
      if (pdfUrl != null) {
        localPath = await _repository.downloadPdf(pdfUrl);
      }
      final bookmarks = await _repository.getBookmarks(book.id);
      if (isClosed) return;
      emit(
        EbookReaderLoaded(
          book: book,
          localPdfPath: localPath,
          bookmarks: bookmarks,
        ),
      );
      _startProgressSync(book.id);
    } catch (e) {
      if (isClosed) return;
      emit(EbookReaderError('Failed to load ebook: $e'));
    }
  }

  void setTheme(String theme) {
    if (state is EbookReaderLoaded) {
      emit((state as EbookReaderLoaded).copyWith(theme: theme));
    }
  }

  void setFontSize(double fontSize) {
    if (state is EbookReaderLoaded) {
      emit(
        (state as EbookReaderLoaded).copyWith(
          fontSize: fontSize.clamp(
            AppConstants.minFontSize,
            AppConstants.maxFontSize,
          ),
        ),
      );
    }
  }

  void increaseFontSize() {
    if (state is EbookReaderLoaded) {
      final current = (state as EbookReaderLoaded).fontSize;
      setFontSize(current + AppConstants.fontSizeStep);
    }
  }

  void decreaseFontSize() {
    if (state is EbookReaderLoaded) {
      final current = (state as EbookReaderLoaded).fontSize;
      setFontSize(current - AppConstants.fontSizeStep);
    }
  }

  void setFontFamily(String fontFamily) {
    if (state is EbookReaderLoaded) {
      emit((state as EbookReaderLoaded).copyWith(fontFamily: fontFamily));
    }
  }

  void setCurrentPage(int page) {
    if (state is EbookReaderLoaded) {
      emit((state as EbookReaderLoaded).copyWith(currentPage: page));
    }
  }

  Future<void> addBookmark({String? label}) async {
    if (state is EbookReaderLoaded) {
      final loaded = state as EbookReaderLoaded;
      try {
        await _repository.addBookmark(
          bookId: loaded.book.id,
          position: loaded.currentPage.toString(),
          label: label,
        );
        final bookmarks = await _repository.getBookmarks(loaded.book.id);
        if (isClosed) return;
        emit(loaded.copyWith(bookmarks: bookmarks));
      } catch (_) {
        if (kDebugMode) debugPrint('[EbookReader] addBookmark failed');
      }
    }
  }

  Future<void> deleteBookmark(String bookmarkId) async {
    if (state is EbookReaderLoaded) {
      final loaded = state as EbookReaderLoaded;
      try {
        await _repository.deleteBookmark(bookmarkId);
        final bookmarks = await _repository.getBookmarks(loaded.book.id);
        if (isClosed) return;
        emit(loaded.copyWith(bookmarks: bookmarks));
      } catch (_) {
        if (kDebugMode) debugPrint('[EbookReader] deleteBookmark failed');
      }
    }
  }

  void _startProgressSync(String bookId) {
    _progressTimer?.cancel();
    int? _lastSyncedPage;
    _progressTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (isClosed) {
        _progressTimer?.cancel();
        return;
      }
      if (state is EbookReaderLoaded) {
        final loaded = state as EbookReaderLoaded;
        if (loaded.currentPage == _lastSyncedPage) return;
        _lastSyncedPage = loaded.currentPage;
        _repository.saveProgress(
          bookId: bookId,
          position: loaded.currentPage.toString(),
          page: loaded.currentPage,
        );
      }
    });
  }

  @override
  Future<void> close() {
    _progressTimer?.cancel();
    return super.close();
  }
}
