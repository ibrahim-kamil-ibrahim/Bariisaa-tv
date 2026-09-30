import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/di/injection.dart';
import '../../../shared/models/models.dart';

class AuthorProfileRepository {
  final ApiClient _apiClient = getIt<ApiClient>();

  Future<AuthorModel> getAuthor(String authorId) async {
    try {
      final response = await _apiClient.get('/authors/$authorId');
      return AuthorModel.fromJson(response.data['data']);
    } on DioException {
      rethrow;
    }
  }

  Future<List<BookModel>> getAuthorBooks(
    String authorId, {
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiClient.get(
        '/books',
        queryParameters: {'authorId': authorId, 'page': page, 'limit': limit},
      );
      return (response.data['data'] as List)
          .map((e) => BookModel.fromJson(e))
          .toList();
    } on DioException {
      rethrow;
    }
  }
}
