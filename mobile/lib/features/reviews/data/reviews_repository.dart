import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/di/injection.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/models.dart';

class ReviewsRepository {
  final ApiClient _apiClient = getIt<ApiClient>();

  Future<List<ReviewModel>> getReviews(
    String bookId, {
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _apiClient.get(
        '/reviews/book/$bookId',
        queryParameters: {'page': page, 'limit': limit},
      );
      return (response.data['data'] as List)
          .map((e) => ReviewModel.fromJson(e))
          .toList();
    } on DioException {
      rethrow;
    }
  }

  Future<Map<String, int>> getRatingDistribution(String bookId) async {
    try {
      final response = await _apiClient.get('/reviews/book/$bookId/rating');
      return Map<String, int>.from(
        response.data['data']['distribution'] as Map,
      );
    } on DioException {
      return {};
    }
  }

  Future<void> submitReview({
    required String bookId,
    required double rating,
    String? content,
  }) async {
    if (await getIt<SecureStorageService>().isDevMode()) return;
    if (!await getIt<SecureStorageService>().isLoggedIn())
      throw Exception('Not authenticated');
    try {
      await _apiClient.post(
        '/reviews',
        data: {'bookId': bookId, 'rating': rating, 'content': content},
      );
    } on DioException {
      rethrow;
    }
  }

  Future<void> deleteReview(String reviewId) async {
    if (!await getIt<SecureStorageService>().isLoggedIn())
      throw Exception('Not authenticated');
    try {
      await _apiClient.delete('/reviews/$reviewId');
    } on DioException {
      rethrow;
    }
  }
}
