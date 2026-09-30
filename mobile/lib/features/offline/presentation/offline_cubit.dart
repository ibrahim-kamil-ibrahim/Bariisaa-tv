import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/offline_state.dart';
import '../data/offline_repository.dart';
import '../../../shared/models/models.dart';

class OfflineCubit extends Cubit<OfflineState> {
  final OfflineRepository _repository;

  OfflineCubit(this._repository) : super(OfflineInitial());

  void loadDownloads() async {
    emit(OfflineLoading());
    try {
      final results = await Future.wait<dynamic>([
        _repository.getDownloads(),
        _repository.getStorageUsed(),
      ]);
      if (isClosed) return;
      emit(OfflineLoaded(downloads: results[0] as List<DownloadItemModel>, storageUsed: results[1] as int));
    } catch (e) {
      if (isClosed) return;
      emit(OfflineError('Failed to load downloads: $e'));
    }
  }

  void startDownload(BookModel book, String type) async {
    if (state is OfflineLoaded) {
      final downloads = (state as OfflineLoaded).downloads;
      final existing = downloads
          .where((d) => d.bookId == book.id && d.type == type)
          .toList();
      if (existing.any(
        (d) => d.status == 'downloading' || d.status == 'completed',
      ))
        return;
      emit(
        (state as OfflineLoaded).copyWith(
          downloads: [
            ...downloads,
            DownloadItemModel(
              bookId: book.id,
              title: book.title,
              type: type,
              status: 'downloading',
            ),
          ],
        ),
      );
    }
    DateTime lastProgressEmission = DateTime.now();
    await _repository.startDownload(
      book,
      type,
      onProgress: (progress) {
        if (isClosed) return;
        final now = DateTime.now();
        if (progress < 1.0 &&
            now.difference(lastProgressEmission).inMilliseconds < 250) {
          return; // throttle progress updates
        }
        lastProgressEmission = now;
        if (state is OfflineLoaded) {
          final currentDownloads = (state as OfflineLoaded).downloads;
          final updated = currentDownloads.map((d) {
            if (d.bookId == book.id && d.type == type) {
              return DownloadItemModel(
                bookId: d.bookId,
                title: d.title,
                coverUrl: d.coverUrl,
                type: d.type,
                totalBytes: d.totalBytes,
                downloadedBytes: (d.totalBytes * progress).round(),
                status: progress >= 1.0 ? 'completed' : 'downloading',
              );
            }
            return d;
          }).toList();
          emit((state as OfflineLoaded).copyWith(downloads: updated));
        }
      },
    );
    if (isClosed) return;
    loadDownloads();
  }

  void pauseDownload(String bookId) async {
    _repository.pauseDownload(bookId);
    if (isClosed) return;
    loadDownloads();
  }

  void resumeDownload(DownloadItemModel item) async {
    await _repository.resumeDownload(item);
    if (isClosed) return;
    loadDownloads();
  }

  void deleteDownload(String bookId, String type) async {
    await _repository.deleteDownload(bookId, type);
    if (isClosed) return;
    loadDownloads();
  }

  void clearAllDownloads() async {
    await _repository.clearAllDownloads();
    if (isClosed) return;
    loadDownloads();
  }
}
