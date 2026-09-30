import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/network/api_client.dart';
import '../../core/di/injection.dart';

class ScreenThemeModel {
  final String screenKey;
  final String label;
  final String? avatarImageUrl;
  final String? avatarLabel;
  final int version;

  const ScreenThemeModel({
    required this.screenKey,
    required this.label,
    this.avatarImageUrl,
    this.avatarLabel,
    this.version = 1,
  });

  factory ScreenThemeModel.fromJson(Map<String, dynamic> json) =>
      ScreenThemeModel(
        screenKey: json['screenKey'] as String,
        label: json['label'] as String,
        avatarImageUrl: json['avatarImageUrl'] as String?,
        avatarLabel: json['avatarLabel'] as String?,
        version: json['version'] as int? ?? 1,
      );
}

/// Fetches `GET /screen-themes` and caches the response locally so the app
/// keeps working offline (falls back to the last-known theme, then to bundled
/// fallback assets in `ThemedScreenScaffold`).
class ScreenThemeRepository {
  final ApiClient _apiClient = getIt<ApiClient>();
  final FlutterSecureStorage _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _cacheKey = 'screen_themes_cache';
  static const _cacheAtKey = 'screen_themes_cache_at';

  Future<List<ScreenThemeModel>> fetchThemes() async {
    try {
      final response = await _apiClient.get('/screen-themes');
      final data = response.data['data'] as List<dynamic>;
      try {
        await _storage.write(key: _cacheKey, value: jsonEncode(data));
      } catch (_) {}
      try {
        await _storage.write(
          key: _cacheAtKey,
          value: DateTime.now().millisecondsSinceEpoch.toString(),
        );
      } catch (_) {}
      return data
          .map((e) => ScreenThemeModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      final cached = await _loadCache();
      if (cached.isNotEmpty) return cached;
      rethrow;
    }
  }

  Future<List<ScreenThemeModel>> _loadCache() async {
    try {
      final json = await _storage.read(key: _cacheKey);
      if (json == null || json.isEmpty) return [];
      final list = jsonDecode(json) as List<dynamic>;
      return list
          .map((e) => ScreenThemeModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }
}
