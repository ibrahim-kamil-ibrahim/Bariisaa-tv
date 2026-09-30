import '../../../core/network/api_client.dart';
import '../../../core/di/injection.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/models.dart';

class FavoritesRepository {
  final ApiClient _apiClient = getIt<ApiClient>();

  Future<List<BookModel>> getFavorites({int page = 1, int limit = 20}) async {
    if (await getIt<SecureStorageService>().isDevMode()) return [];
    if (!await getIt<SecureStorageService>().isLoggedIn()) return [];
    final response = await _apiClient.get(
      '/favorites',
      queryParameters: {'page': page, 'limit': limit},
    );
    return (response.data['data'] as List)
        .map((e) => BookModel.fromJson(e['book']))
        .toList();
  }

  Future<void> removeFavorite(String bookId) async {
    if (await getIt<SecureStorageService>().isDevMode()) return;
    if (!await getIt<SecureStorageService>().isLoggedIn()) return;
    await _apiClient.post('/favorites/toggle', data: {'bookId': bookId});
  }
}
