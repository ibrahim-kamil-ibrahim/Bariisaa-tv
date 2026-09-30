import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/history_state.dart';
import '../data/history_repository.dart';
import '../../../shared/models/models.dart';

class HistoryCubit extends Cubit<HistoryState> {
  final HistoryRepository _repository;

  HistoryCubit(this._repository) : super(HistoryInitial());

  void loadHistory() async {
    emit(HistoryLoading());
    try {
      final results = await Future.wait([
        _repository.getReadingHistory(),
        _repository.getListeningHistory(),
      ]);
      if (isClosed) return;
      emit(
        HistoryLoaded(
          readingHistory: (results[0] as List<dynamic>).cast<BookModel>(),
          listeningHistory: (results[1] as List<dynamic>).cast<BookModel>(),
        ),
      );
    } catch (e) {
      if (isClosed) return;
      emit(HistoryError('Failed to load history: $e'));
    }
  }

  void deleteItem(String bookId, String type) async {
    try {
      await _repository.deleteHistoryItem(bookId, type);
      if (isClosed) return;
      loadHistory();
    } catch (e) {
      if (isClosed) return;
      emit(HistoryError('Failed to delete: $e'));
    }
  }

  void clearReading() async {
    try {
      await _repository.clearReadingHistory();
      if (isClosed) return;
      loadHistory();
    } catch (e) {
      if (isClosed) return;
      emit(HistoryError('Failed to clear: $e'));
    }
  }

  void clearListening() async {
    try {
      await _repository.clearListeningHistory();
      if (isClosed) return;
      loadHistory();
    } catch (e) {
      if (isClosed) return;
      emit(HistoryError('Failed to clear: $e'));
    }
  }
}
