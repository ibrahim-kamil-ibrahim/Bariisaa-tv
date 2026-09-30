import '../../../core/network/api_client.dart';
import '../../../core/di/injection.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/models.dart';

class NotificationsRepository {
  final ApiClient _apiClient = getIt<ApiClient>();

  Future<List<NotificationModel>> getNotifications({
    int page = 1,
    int limit = 20,
  }) async {
    if (await getIt<SecureStorageService>().isDevMode()) return [];
    if (!await getIt<SecureStorageService>().isLoggedIn()) return [];
    final response = await _apiClient.get(
      '/notifications',
      queryParameters: {'page': page, 'limit': limit},
    );
    return (response.data['data'] as List)
        .map((e) => NotificationModel.fromJson(e))
        .toList();
  }

  Future<void> markAsRead(String notificationId) async {
    if (await getIt<SecureStorageService>().isDevMode()) return;
    if (!await getIt<SecureStorageService>().isLoggedIn()) return;
    await _apiClient.put('/notifications/$notificationId/read');
  }

  Future<void> markAllAsRead() async {
    if (await getIt<SecureStorageService>().isDevMode()) return;
    if (!await getIt<SecureStorageService>().isLoggedIn()) return;
    await _apiClient.put('/notifications/read-all');
  }

  Future<void> deleteNotification(String notificationId) async {
    if (await getIt<SecureStorageService>().isDevMode()) return;
    if (!await getIt<SecureStorageService>().isLoggedIn()) return;
    await _apiClient.delete('/notifications/$notificationId');
  }

  Future<int> getUnreadCount() async {
    if (await getIt<SecureStorageService>().isDevMode()) return 0;
    if (!await getIt<SecureStorageService>().isLoggedIn()) return 0;
    final response = await _apiClient.get('/notifications/unread-count');
    return response.data['data']['count'] as int? ?? 0;
  }
}
