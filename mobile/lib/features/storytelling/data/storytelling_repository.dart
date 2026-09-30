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
}
