import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show compute;
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/models.dart';

/// Top-level function required by compute() — must be free of context.
List<BookModel> _decodeBooks(List<dynamic> data) =>
    data.map((e) => BookModel.fromJson(e as Map<String, dynamic>)).toList();

List<CategoryModel> _decodeCategories(List<dynamic> data) =>
    data.map((e) => CategoryModel.fromJson(e as Map<String, dynamic>)).toList();

BookModel _decodeSingleBook(Map<String, dynamic> data) =>
    BookModel.fromJson(data);

List<ReviewModel> _decodeReviews(List<dynamic> data) =>
    data.map((e) => ReviewModel.fromJson(e as Map<String, dynamic>)).toList();

class DiscoveryRepository {
  final ApiClient _apiClient;
  final SecureStorageService _storage;

  DiscoveryRepository(this._apiClient, this._storage);

  Future<List<BookModel>> searchBooks({
    required String query,
    String? categoryId,
    String? language,
    int page = 1,
    int limit = 20,
  }) async {
    if (await _storage.isDevMode()) return [];
    try {
      final params = <String, dynamic>{
        'search': query,
        'page': page,
        'limit': limit,
      };
      if (categoryId != null) params['category'] = categoryId;
      if (language != null) params['language'] = language;
      final response = await _apiClient.get('/books', queryParameters: params);
      final data = response.data['data'];
      if (data is List)
        return data
            .map((e) => BookModel.fromJson(e as Map<String, dynamic>))
            .toList();
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<List<CategoryModel>> getCategories() async {
    if (await _storage.isDevMode()) return [];
    try {
      final response = await _apiClient.get('/categories');
      final data = response.data['data'];
      if (data is List) return await compute(_decodeCategories, data);
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<BookModel> getBookDetail(String bookId) async {
    try {
      final response = await _apiClient.get('/books/$bookId');
      return await compute(_decodeSingleBook, response.data['data'] as Map<String, dynamic>);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<ReviewModel>> getBookReviews(
    String bookId, {
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _apiClient.get(
        '/reviews/book/$bookId',
        queryParameters: {'page': page, 'limit': limit},
      );
      final data = response.data['data'];
      if (data is List) return await compute(_decodeReviews, data);
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<List<CategoryModel>> getExploreCategories() async {
    if (await _storage.isDevMode()) return [];
    try {
      final response = await _apiClient.get('/categories/explore');
      final data = response.data['data'];
      if (data is List) return await compute(_decodeCategories, data);
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<List<BookModel>> getRecommendations({int limit = 8}) async {
    if (await _storage.isDevMode()) return [];
    try {
      final res = await _apiClient.get(
        '/recommendations',
        queryParameters: {'limit': limit},
      );
      final data = res.data['data'];
      if (data is List) return await compute(_decodeBooks, data);
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<List<BookModel>> getFallbackBooks({int limit = 8}) async {
    if (await _storage.isDevMode()) return [];
    try {
      final res = await _apiClient.get(
        '/recommendations/fallback',
        queryParameters: {'limit': limit},
      );
      final data = res.data['data'];
      if (data is List)
        return data
            .map((e) => BookModel.fromJson(e as Map<String, dynamic>))
            .toList();
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<List<BookModel>> getRelatedBooks(String bookId) async {
    if (await _storage.isDevMode()) return [];
    try {
      final response = await _apiClient.get(
        '/books/$bookId/related',
        queryParameters: {'limit': 10},
      );
      final data = response.data['data'];
      if (data is List) return await compute(_decodeBooks, data);
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<List<BookModel>> getBooksByCategory(
    String categoryId, {
    int page = 1,
    int limit = 20,
  }) async {
    if (await _storage.isDevMode()) return [];
    try {
      final response = await _apiClient.get(
        '/books',
        queryParameters: {'category': categoryId, 'page': page, 'limit': limit},
      );
      final data = response.data['data'];
      if (data is List) return await compute(_decodeBooks, data);
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getMusicTracks({int limit = 10}) async {
    if (await _storage.isDevMode()) return [];
    try {
      final response = await _apiClient.get(
        '/music',
        queryParameters: {'limit': limit},
      );
      return List<Map<String, dynamic>>.from(response.data['data'] ?? []);
    } on DioException {
      // Music shelf is supplementary on home — don't fail the whole page.
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getFeaturedMusic({int limit = 5}) async {
    if (await _storage.isDevMode()) return [];
    try {
      final response = await _apiClient.get(
        '/music/featured',
        queryParameters: {'limit': limit},
      );
      return List<Map<String, dynamic>>.from(response.data['data'] ?? []);
    } on DioException {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getStories({int limit = 10}) async {
    if (await _storage.isDevMode()) return [];
    try {
      final response = await _apiClient.get(
        '/storytelling',
        queryParameters: {'limit': limit},
      );
      return List<Map<String, dynamic>>.from(response.data['data'] ?? []);
    } on DioException {
      // Stories shelf is supplementary on home — don't fail the whole page.
      return [];
    }
  }

  Future<void> toggleFavorite(String bookId) async {
    if (await _storage.isDevMode()) return;
    if (!await _storage.isLoggedIn()) return;
    await _apiClient.post('/favorites/toggle', data: {'bookId': bookId});
  }
}
