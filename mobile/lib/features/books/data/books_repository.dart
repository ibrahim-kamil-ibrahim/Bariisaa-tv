import 'package:flutter/foundation.dart' show compute;
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/models.dart';

/// Top-level helper for compute() — isolate-safe.
List<BookModel> _decodeBooks(List<dynamic> data) =>
    data.map((e) => BookModel.fromJson(e as Map<String, dynamic>)).toList();

/// Book-only data access for the dedicated BooksScreen.
/// Talks to the backend `/books*`, `/categories`, `/authors` endpoints.
class BooksRepository {
  final ApiClient _apiClient;
  final SecureStorageService _storage;

  BooksRepository(this._apiClient, this._storage);

  /// "Top" = most read / most listened (engagement-sorted).
  Future<List<BookModel>> getTrendingBooks({
    int page = 1,
    int limit = 20,
  }) async {
    if (await _storage.isDevMode()) return [];
    try {
      final response = await _apiClient.get(
        '/books/trending',
        queryParameters: {'page': page, 'limit': limit},
      );
      final data = response.data['data'];
      if (data is List) return await compute(_decodeBooks, data);
      return [];
    } catch (e) {
      rethrow;
    }
  }

  /// "New" = most recently added.
  Future<List<BookModel>> getNewReleases({int page = 1, int limit = 20}) async {
    if (await _storage.isDevMode()) return [];
    try {
      final response = await _apiClient.get(
        '/books/new-releases',
        queryParameters: {'page': page, 'limit': limit},
      );
      final data = response.data['data'];
      if (data is List) return await compute(_decodeBooks, data);
      return [];
    } catch (e) {
      rethrow;
    }
  }

  /// Full library with optional genre/category filter (paginated).
  Future<List<BookModel>> getBooks({
    String? categoryId,
    int page = 1,
    int limit = 20,
  }) async {
    if (await _storage.isDevMode()) return [];
    try {
      final params = <String, dynamic>{'page': page, 'limit': limit};
      if (categoryId != null && categoryId.isNotEmpty)
        params['category'] = categoryId;
      final response = await _apiClient.get('/books', queryParameters: params);
      final data = response.data['data'];
      if (data is List) return await compute(_decodeBooks, data);
      return [];
    } catch (e) {
      rethrow;
    }
  }

  /// Genre/category list (for the filter chips).
  Future<List<CategoryModel>> getCategories() async {
    if (await _storage.isDevMode()) return [];
    try {
      final response = await _apiClient.get('/categories');
      final data = response.data['data'];
      if (data is List)
        return data
            .map((e) => CategoryModel.fromJson(e as Map<String, dynamic>))
            .toList();
      return [];
    } catch (e) {
      rethrow;
    }
  }

  /// Authors (for the "Author Spotlight" row).
  Future<List<AuthorModel>> getAuthors({int page = 1, int limit = 10}) async {
    if (await _storage.isDevMode()) return [];
    try {
      final response = await _apiClient.get(
        '/authors',
        queryParameters: {'page': page, 'limit': limit},
      );
      final data = response.data['data'];
      if (data is List)
        return data
            .map((e) => AuthorModel.fromJson(e as Map<String, dynamic>))
            .toList();
      return [];
    } catch (e) {
      rethrow;
    }
  }
}
