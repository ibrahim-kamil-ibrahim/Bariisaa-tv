import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';

class MyCaptainRepository {
  final ApiClient _apiClient;

  MyCaptainRepository(this._apiClient);

  Future<List<Map<String, dynamic>>> getAchievements() async {
    try {
      final response = await _apiClient.get('/my-captain/achievements');
      return List<Map<String, dynamic>>.from(response.data['data']);
    } on DioException {
      return [];
    }
  }

  Future<Map<String, dynamic>> getCaptainProfile() async {
    try {
      final response = await _apiClient.get('/my-captain/profile');
      return Map<String, dynamic>.from(response.data['data'] ?? {});
    } on DioException {
      return {};
    }
  }

  Future<List<Map<String, dynamic>>> getLeaderboard() async {
    try {
      final response = await _apiClient.get('/my-captain/leaderboard');
      return List<Map<String, dynamic>>.from(response.data['data']);
    } on DioException {
      return [];
    }
  }
}
