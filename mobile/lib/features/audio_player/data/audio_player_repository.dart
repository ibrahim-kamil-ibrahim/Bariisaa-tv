import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/models.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';

class AudioPlayerRepository {
  final ApiClient _apiClient;
  final SecureStorageService _storage;

  AudioPlayerRepository(this._apiClient, this._storage);

  Future<List<BookmarkModel>> getBookmarks(String bookId) async {
    if (await _storage.isDevMode()) return [];
    if (!await _storage.isLoggedIn()) return [];
    try {
      final response = await _apiClient.get('/bookmarks/book/$bookId');
      return (response.data['data'] as List)
          .map((e) => BookmarkModel.fromJson(e))
          .toList();
    } on DioException {
      rethrow;
    }
  }

  Future<void> addBookmark({
    required String bookId,
    required String type,
    String? position,
    String? label,
    int? timestampSeconds,
  }) async {
    if (await _storage.isDevMode()) return;
    if (!await _storage.isLoggedIn()) return;
    try {
      await _apiClient.post(
        '/bookmarks',
        data: {
          'bookId': bookId,
          'type': type,
          'position': position,
          'label': label,
          'timestampSeconds': timestampSeconds,
        },
      );
    } on DioException {
      rethrow;
    }
  }

  Future<void> deleteBookmark(String bookmarkId) async {
    if (await _storage.isDevMode()) return;
    if (!await _storage.isLoggedIn()) return;
    try {
      await _apiClient.delete('/bookmarks/$bookmarkId');
    } on DioException {
      rethrow;
    }
  }

  Future<void> saveProgress({
    required String bookId,
    required int positionSeconds,
  }) async {
    if (await _storage.isDevMode()) return;
    if (!await _storage.isLoggedIn()) return;
    try {
      await _apiClient.put(
        '/history/listening/progress',
        data: {'bookId': bookId, 'lastTimestampSec': positionSeconds},
      );
    } on DioException {
      // silently fail for progress
    }
  }

  Future<int> getSavedProgress(String bookId) async {
    if (await _storage.isDevMode()) return 0;
    if (!await _storage.isLoggedIn()) return 0;
    try {
      final response = await _apiClient.get(
        '/history/listening/continue',
        queryParameters: {'limit': 50},
      );
      final books = response.data['data'] as List;
      final match = books.firstWhere(
        (e) => e['bookId'] == bookId || e['book']['id'] == bookId,
        orElse: () => null,
      );
      if (match == null) return 0;
      return match['lastTimestampSec'] as int? ?? 0;
    } on DioException {
      return 0;
    }
  }

  Future<String?> downloadAudioFile(String fileUrl) async {
    if (await _storage.isDevMode()) return null;
    try {
      final dir = await getApplicationDocumentsDirectory();
      final fileName = fileUrl.split('/').last;
      final filePath = '${dir.path}/audio/$fileName';
      final file = File(filePath);
      if (await file.exists()) return filePath;

      await file.create(recursive: true);
      await _apiClient.dio.download(fileUrl, filePath);
      return filePath;
    } on DioException {
      return null;
    }
  }
}
