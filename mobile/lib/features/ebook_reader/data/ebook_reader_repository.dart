import 'package:dio/dio.dart';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/models.dart';

class EbookReaderRepository {
  final ApiClient _apiClient;
  final SecureStorageService _storage;

  EbookReaderRepository(this._apiClient, this._storage);

  Future<String?> downloadPdf(String fileUrl) async {
    if (kIsWeb) return null;
    if (await _storage.isDevMode()) return null;
    try {
      final dir = await getApplicationDocumentsDirectory();
      final fileName = fileUrl.split('/').last;
      final filePath = '${dir.path}/ebooks/$fileName';
      final file = File(filePath);
      if (await file.exists()) return filePath;
      await file.create(recursive: true);
      await _apiClient.dio.download(fileUrl, filePath);
      return filePath;
    } on DioException {
      return null;
    }
  }

  Future<void> saveProgress({
    required String bookId,
    required String position,
    required int page,
    int totalPages = 100,
  }) async {
    if (await _storage.isDevMode()) return;
    if (!await _storage.isLoggedIn()) return;
    try {
      await _apiClient.put(
        '/history/reading/progress',
        data: {
          'bookId': bookId,
          'lastPosition': position,
          'progressPercent': page > 0 && totalPages > 0
              ? (page / totalPages * 100).clamp(0, 100).toDouble()
              : 0,
        },
      );
    } on DioException {
      // silently fail
    }
  }

  Future<Map<String, dynamic>?> getSavedProgress(String bookId) async {
    if (await _storage.isDevMode()) return null;
    if (!await _storage.isLoggedIn()) return null;
    try {
      final response = await _apiClient.get(
        '/history/reading/continue',
        queryParameters: {'limit': 50},
      );
      final books = response.data['data'] as List;
      final match = books.firstWhere(
        (e) => e['bookId'] == bookId || e['book']['id'] == bookId,
        orElse: () => null,
      );
      if (match == null) return null;
      return match as Map<String, dynamic>?;
    } on DioException {
      return null;
    }
  }

  Future<List<BookmarkModel>> getBookmarks(String bookId) async {
    if (!await _storage.isLoggedIn()) return [];
    try {
      final response = await _apiClient.get('/bookmarks/book/$bookId');
      return (response.data['data'] as List)
          .map((e) => BookmarkModel.fromJson(e))
          .toList();
    } on DioException {
      return [];
    }
  }

  Future<void> addBookmark({
    required String bookId,
    String? position,
    String? label,
  }) async {
    if (await _storage.isDevMode()) return;
    if (!await _storage.isLoggedIn()) return;
    try {
      await _apiClient.post(
        '/bookmarks',
        data: {
          'bookId': bookId,
          'type': 'PDF',
          'position': position,
          'label': label,
        },
      );
    } on DioException {
      rethrow;
    }
  }

  Future<void> deleteBookmark(String bookmarkId) async {
    if (!await _storage.isLoggedIn()) return;
    try {
      await _apiClient.delete('/bookmarks/$bookmarkId');
    } on DioException {
      rethrow;
    }
  }
}
