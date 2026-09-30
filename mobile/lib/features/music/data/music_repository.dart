import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';

class MusicRepository {
  final ApiClient _apiClient;

  MusicRepository(this._apiClient);

  Future<List<Map<String, dynamic>>> getMusic() async {
    final response = await _apiClient.get('/music');
    return List<Map<String, dynamic>>.from(response.data['data']);
  }

  Future<List<Map<String, dynamic>>> getMusicGenres() async {
    final response = await _apiClient.get('/music/genres');
    return List<Map<String, dynamic>>.from(response.data['data']);
  }

  /// GET /music/:id/play → { url } — resolves local vs signed storage URLs.
  Future<String?> getPlayUrl(String trackId) async {
    try {
      final response = await _apiClient.get('/music/$trackId/play');
      final url = response.data['data']?['url'];
      return url is String && url.isNotEmpty ? url : null;
    } on DioException {
      return null;
    }
  }
}
