import '../../../core/network/api_client.dart';
import '../../../core/di/injection.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/models.dart';

class HistoryRepository {
  final ApiClient _apiClient = getIt<ApiClient>();

  Future<List<BookModel>> getReadingHistory({
    int page = 1,
    int limit = 20,
  }) async {
    if (await getIt<SecureStorageService>().isDevMode()) return [];
    if (!await getIt<SecureStorageService>().isLoggedIn()) return [];
    final response = await _apiClient.get(
      '/history/reading',
      queryParameters: {'page': page, 'limit': limit},
    );
    return (response.data['data'] as List)
        .map((e) => BookModel.fromJson(e['book']))
        .toList();
  }

  Future<List<BookModel>> getListeningHistory({
    int page = 1,
    int limit = 20,
  }) async {
    if (await getIt<SecureStorageService>().isDevMode()) return [];
    if (!await getIt<SecureStorageService>().isLoggedIn()) return [];
    final response = await _apiClient.get(
      '/history/listening',
      queryParameters: {'page': page, 'limit': limit},
    );
    return (response.data['data'] as List)
        .map((e) => BookModel.fromJson(e['book']))
        .toList();
  }

  Future<List<BookModel>> getRecentBooks({int limit = 5}) async {
    if (await getIt<SecureStorageService>().isDevMode()) return [];
    if (!await getIt<SecureStorageService>().isLoggedIn()) return [];
    final reading = await getReadingHistory(limit: limit);
    final listening = await getListeningHistory(limit: limit);
    final all = [...reading, ...listening];
    // Return unique books by ID, taking the first occurrence (most recent)
    final seen = <String>{};
    final unique = all.where((b) => seen.add(b.id)).toList();
    return unique.take(limit).toList();
  }

  Future<void> clearReadingHistory() async {
    if (await getIt<SecureStorageService>().isDevMode()) return;
    if (!await getIt<SecureStorageService>().isLoggedIn()) return;
    await _apiClient.delete('/history/reading/all');
  }

  Future<void> clearListeningHistory() async {
    if (await getIt<SecureStorageService>().isDevMode()) return;
    if (!await getIt<SecureStorageService>().isLoggedIn()) return;
    await _apiClient.delete('/history/listening/all');
  }

  Future<void> deleteHistoryItem(String bookId, String type) async {
    if (await getIt<SecureStorageService>().isDevMode()) return;
    if (!await getIt<SecureStorageService>().isLoggedIn()) return;
    await _apiClient.delete('/history/$type/$bookId');
  }
}
