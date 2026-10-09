import 'package:flutter/foundation.dart' show kReleaseMode;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

class SecureStorageService {
  final FlutterSecureStorage _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  bool _devModeCache = false;
  bool _devModeChecked = false;

  bool get isDevModeCached => _devModeChecked ? _devModeCache : false;

  Future<String?> _safeReadString(Future<String?> Function() operation) async {
    try {
      return await operation();
    } catch (e) {
      final errorString = e.toString();
      if (errorString.contains('InvalidKeyException') ||
          errorString.contains('BadPaddingException') ||
          errorString.contains('KeyStoreException') ||
          errorString.contains('StorageCipher') ||
          errorString.contains('unwrap key')) {
        try {
          await _storage.deleteAll();
        } catch (_) {}
        try {
          return await operation();
        } catch (_) {
          return null;
        }
      }
      return null;
    }
  }

  Future<void> _safeWrite(Future<void> Function() operation) async {
    try {
      await operation();
    } catch (e) {
      final errorString = e.toString();
      if (errorString.contains('InvalidKeyException') ||
          errorString.contains('BadPaddingException') ||
          errorString.contains('KeyStoreException') ||
          errorString.contains('StorageCipher') ||
          errorString.contains('unwrap key')) {
        try {
          await _storage.deleteAll();
        } catch (_) {}
        try {
          await operation();
        } catch (_) {}
      }
    }
  }

  Future<String?> read({required String key}) =>
      _safeReadString(() => _storage.read(key: key));

  Future<void> write({required String key, required String value}) =>
      _safeWrite(() => _storage.write(key: key, value: value));

  Future<String?> getAccessToken() =>
      _safeReadString(() => _storage.read(key: AppConstants.accessTokenKey));
  Future<void> setAccessToken(String token) =>
      _safeWrite(() => _storage.write(key: AppConstants.accessTokenKey, value: token));

  Future<String?> getRefreshToken() =>
      _safeReadString(() => _storage.read(key: AppConstants.refreshTokenKey));
  Future<void> setRefreshToken(String token) =>
      _safeWrite(() => _storage.write(key: AppConstants.refreshTokenKey, value: token));

  Future<String?> getUserId() =>
      _safeReadString(() => _storage.read(key: AppConstants.userIdKey));
  Future<void> setUserId(String id) =>
      _safeWrite(() => _storage.write(key: AppConstants.userIdKey, value: id));

  Future<String?> getCachedUser() =>
      _safeReadString(() => _storage.read(key: AppConstants.cachedUserKey));
  Future<void> setCachedUser(String json) =>
      _safeWrite(() => _storage.write(key: AppConstants.cachedUserKey, value: json));

  Future<String?> getDeviceId() =>
      _safeReadString(() => _storage.read(key: AppConstants.deviceIdKey));
  Future<void> setDeviceId(String id) =>
      _safeWrite(() => _storage.write(key: AppConstants.deviceIdKey, value: id));

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await setAccessToken(accessToken);
    await setRefreshToken(refreshToken);
  }

  Future<bool> isLoggedIn() async {
    final accessToken = await getAccessToken();
    if (accessToken != null) return true;
    final refreshToken = await getRefreshToken();
    return refreshToken != null;
  }

  Future<bool> isDevMode() async {
    if (kReleaseMode) return false;
    final val = await _safeReadString(() => _storage.read(key: AppConstants.devModeKey));
    _devModeCache = val == 'true';
    _devModeChecked = true;
    return _devModeCache;
  }

  Future<void> setDevMode(bool enabled) async {
    await _safeWrite(() => _storage.write(
      key: AppConstants.devModeKey,
      value: enabled ? 'true' : 'false',
    ));
  }

  Future<void> clearDevMode() async {
    await _safeWrite(() => _storage.delete(key: AppConstants.devModeKey));
  }

  Future<void> clearAuthData() async {
    await _safeWrite(() => _storage.delete(key: AppConstants.accessTokenKey));
    await _safeWrite(() => _storage.delete(key: AppConstants.refreshTokenKey));
    await _safeWrite(() => _storage.delete(key: AppConstants.userIdKey));
    await _safeWrite(() => _storage.delete(key: AppConstants.deviceIdKey));
    await _safeWrite(() => _storage.delete(key: AppConstants.cachedUserKey));
  }

  Future<void> clearHasUsedGuest() =>
      _safeWrite(() => _storage.delete(key: 'has_used_guest'));

  Future<bool> hasUsedGuest() async {
    final val = await _safeReadString(() => _storage.read(key: 'has_used_guest'));
    return val == 'true';
  }

  Future<void> setHasUsedGuest() async {
    await _safeWrite(() => _storage.write(key: 'has_used_guest', value: 'true'));
  }

  Future<void> clearAll() async {
    final usedGuest = await hasUsedGuest();
    final guestProfile = await _safeReadString(() => _storage.read(key: 'guest_profile'));
    await _safeWrite(() => _storage.deleteAll());
    if (usedGuest) {
      await setHasUsedGuest();
    }
    if (guestProfile != null) {
      await _safeWrite(() => _storage.write(key: 'guest_profile', value: guestProfile));
    }
  }
}
