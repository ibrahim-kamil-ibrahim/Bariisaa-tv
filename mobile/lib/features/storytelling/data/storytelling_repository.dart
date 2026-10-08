import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';

class StorytellingRepository {
  final ApiClient _apiClient;

  StorytellingRepository(this._apiClient);

  Future<List<Map<String, dynamic>>> getStories() async {
    try {
      final response = await _apiClient.get('/storytelling');
      return List<Map<String, dynamic>>.from(response.data['data']);
    } on DioException {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getStoryCategories() async {
    try {
      final response = await _apiClient.get('/storytelling/categories');
      return List<Map<String, dynamic>>.from(response.data['data']);
    } on DioException {
      return [];
    }
  }

  /// GET /storytelling/:id → a single story (includes `videoId` + `isLocked`).
  /// Errors are surfaced to the caller so the detail screen can show a retry.
  Future<Map<String, dynamic>> getStory(String storyId) async {
    final response = await _apiClient.get('/storytelling/$storyId');
    return Map<String, dynamic>.from(response.data['data'] as Map);
  }
}
