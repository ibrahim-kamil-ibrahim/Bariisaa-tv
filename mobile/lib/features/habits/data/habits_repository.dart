import '../../../core/network/api_client.dart';

class HabitsRepository {
  final ApiClient _api;

  HabitsRepository(this._api);

  Future<List<dynamic>> fetchHabits({int page = 1, int limit = 50}) async {
    final res = await _api.get(
      '/habits',
      queryParameters: {'page': page, 'limit': limit},
    );
    return res.data['data'] as List<dynamic>;
  }

  Future<Map<String, dynamic>> fetchHabitById(String id) async {
    final res = await _api.get('/habits/$id');
    return res.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> completeHabit(String id, {String? date}) async {
    final res = await _api.post(
      '/habits/$id/complete',
      data: date != null ? {'date': date} : {},
    );
    return res.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchMyStats() async {
    final res = await _api.get('/habits/my/stats');
    return res.data['data'] as Map<String, dynamic>;
  }

  Future<List<dynamic>> fetchMyProgress({
    int page = 1,
    int limit = 30,
    String? habitId,
  }) async {
    final params = <String, dynamic>{'page': page, 'limit': limit};
    if (habitId != null) params['habitId'] = habitId;
    final res = await _api.get('/habits/my/progress', queryParameters: params);
    return res.data['data'] as List<dynamic>;
  }
}
