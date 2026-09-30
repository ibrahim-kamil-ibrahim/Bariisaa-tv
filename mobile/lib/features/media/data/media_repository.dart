import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/models/models.dart';

/// Media/video repository — talks to the secure video API.
///
/// Video bytes always stream directly from Cloudflare R2 via a short-lived
/// signed URL; they never pass through the backend.
class MediaRepository {
  final ApiClient _apiClient;

  MediaRepository(this._apiClient);

  /// GET /media/videos/:id/play → { url, expiresIn, thumbnailUrl, durationSeconds }
  /// The backend authorizes the user (subscription check for PREMIUM) and
  /// returns a short-lived signed R2 URL.
  Future<Map<String, dynamic>> getVideoPlaybackUrl(String videoId) async {
    final response = await _apiClient.get('/media/videos/$videoId/play');
    return response.data['data'] as Map<String, dynamic>;
  }

  /// GET /media/videos/:id → video metadata.
  Future<VideoModel> getVideo(String videoId) async {
    final response = await _apiClient.get('/media/videos/$videoId');
    return VideoModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  /// Download a video to local storage for offline playback.
  Future<String> downloadVideo(String videoId) async {
    final play = await getVideoPlaybackUrl(videoId);
    final url = play['url'] as String;
    final dir = await getApplicationDocumentsDirectory();
    final filePath = '${dir.path}/videos/$videoId.mp4';
    final file = File(filePath);
    if (await file.exists()) return filePath;
    await file.create(recursive: true);
    await _apiClient.dio.download(url, filePath);
    return filePath;
  }

  /// Delete an offline-downloaded video.
  Future<void> deleteOfflineVideo(String videoId) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/videos/$videoId.mp4');
      if (await file.exists()) await file.delete();
    } on DioException {
      // nothing to clean up
    }
  }
}
