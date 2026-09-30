import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/models.dart';

class AuthRepository {
  final ApiClient _api;
  final SecureStorageService _storage;

  AuthRepository(this._api, this._storage);

  Future<bool> isLoggedIn() => _storage.isLoggedIn();

  Future<UserModel?> restoreSession() async {
    final token = await _storage.getAccessToken();
    if (token == null) return null;
    try {
      final res = await _api.get('/users/profile');
      final data = res.data['data'];
      if (data is Map<String, dynamic>) return UserModel.fromJson(data);
      return null;
    } on DioException {
      await _storage.clearAuthData();
      _api.clearCachedToken();
      return null;
    }
  }

  Future<UserModel> signupEmail({
    required String name,
    required String email,
    required String password,
    int? age,
    String? gender,
    String? avatar,
  }) async {
    if (kDebugMode) {
      debugPrint('[AuthRepository] signupEmail: POST /auth/signup/email');
    }

    final res = await _api.post(
      '/auth/signup/email',
      data: {
        'name': name,
        'email': email,
        'password': password,
        if (age != null || gender != null || avatar != null)
          'profileData': {
            if (age != null) 'age': age,
            if (gender != null) 'gender': gender,
            if (avatar != null) 'avatar': avatar,
          },
      },
    );

    if (kDebugMode) {
      debugPrint('[AuthRepository] signupEmail response: ${res.statusCode}');
    }

    final data = res.data['data'];
    if (data == null || data is! Map<String, dynamic>) {
      if (kDebugMode) {
        debugPrint('[AuthRepository] signupEmail: invalid response data');
        debugPrint('[AuthRepository] Full response: ${res.data}');
      }
      throw Exception('Invalid response from server');
    }

    // Store tokens BEFORE returning so subsequent OTP calls can use them
    await _saveAuthData(data);

    final userData = data['user'];
    if (userData == null || userData is! Map<String, dynamic>) {
      throw Exception('Invalid user data from server');
    }

    if (kDebugMode) {
      debugPrint('[AuthRepository] signupEmail: tokens stored, user received');
    }

    return UserModel.fromJson(userData);
  }

  Future<UserModel> signupPhone({
    required String name,
    required String phone,
    required String password,
    int? age,
    String? gender,
    String? avatar,
  }) async {
    if (kDebugMode) {
      debugPrint('[AuthRepository] signupPhone: POST /auth/signup/phone');
    }

    final res = await _api.post(
      '/auth/signup/phone',
      data: {
        'name': name,
        'phone': phone,
        'password': password,
        if (age != null || gender != null || avatar != null)
          'profileData': {
            if (age != null) 'age': age,
            if (gender != null) 'gender': gender,
            if (avatar != null) 'avatar': avatar,
          },
      },
    );

    if (kDebugMode) {
      debugPrint('[AuthRepository] signupPhone response: ${res.statusCode}');
    }

    final data = res.data['data'];
    if (data == null || data is! Map<String, dynamic>) {
      if (kDebugMode) {
        debugPrint('[AuthRepository] signupPhone: invalid response data');
        debugPrint('[AuthRepository] Full response: ${res.data}');
      }
      throw Exception('Invalid response from server');
    }

    await _saveAuthData(data);

    final userData = data['user'];
    if (userData == null || userData is! Map<String, dynamic>) {
      throw Exception('Invalid user data from server');
    }

    return UserModel.fromJson(userData);
  }

  Future<UserModel> signupUsername({
    required String name,
    required String username,
    required String password,
    int? age,
    String? gender,
    String? avatar,
  }) async {
    if (kDebugMode) {
      debugPrint('[AuthRepository] signupUsername: POST /auth/signup/username');
    }

    final res = await _api.post(
      '/auth/signup/username',
      data: {
        'name': name,
        'username': username,
        'password': password,
        if (age != null || gender != null || avatar != null)
          'profileData': {
            if (age != null) 'age': age,
            if (gender != null) 'gender': gender,
            if (avatar != null) 'avatar': avatar,
          },
      },
    );

    if (kDebugMode) {
      debugPrint('[AuthRepository] signupUsername response: ${res.statusCode}');
    }

    final data = res.data['data'];
    if (data == null || data is! Map<String, dynamic>) {
      if (kDebugMode) {
        debugPrint('[AuthRepository] signupUsername: invalid response data');
        debugPrint('[AuthRepository] Full response: ${res.data}');
      }
      throw Exception('Invalid response from server');
    }

    await _saveAuthData(data);

    final userData = data['user'];
    if (userData == null || userData is! Map<String, dynamic>) {
      throw Exception('Invalid user data from server');
    }

    if (kDebugMode) {
      debugPrint('[AuthRepository] signupUsername: tokens stored, user received');
    }

    return UserModel.fromJson(userData);
  }

  Future<UserModel> login({
    required String identifier,
    required String password,
  }) async {
    final isEmail = identifier.contains('@');

    if (kDebugMode) {
      debugPrint(
        '[AuthRepository] login: POST /auth/login (${isEmail ? 'email' : 'phone'})',
      );
    }

    final res = await _api.post(
      '/auth/login',
      data: {
        if (isEmail) 'email': identifier else 'phone': identifier,
        'password': password,
      },
    );

    if (kDebugMode) {
      debugPrint('[AuthRepository] login response: ${res.statusCode}');
    }

    final data = res.data['data'];
    if (data == null || data is! Map<String, dynamic>) {
      if (kDebugMode) {
        debugPrint('[AuthRepository] login: invalid response data');
        debugPrint('[AuthRepository] Full response: ${res.data}');
      }
      throw Exception('Invalid response from server');
    }

    await _saveAuthData(data);

    final userData = data['user'];
    if (userData == null || userData is! Map<String, dynamic>) {
      throw Exception('Invalid user data from server');
    }

    return UserModel.fromJson(userData);
  }

  Future<UserModel> loginUsername({
    required String username,
    required String password,
  }) async {
    if (kDebugMode) {
      debugPrint('[AuthRepository] loginUsername: POST /auth/login/username');
    }

    final res = await _api.post(
      '/auth/login/username',
      data: {
        'username': username,
        'password': password,
      },
    );

    if (kDebugMode) {
      debugPrint('[AuthRepository] loginUsername response: ${res.statusCode}');
    }

    final data = res.data['data'];
    if (data == null || data is! Map<String, dynamic>) {
      if (kDebugMode) {
        debugPrint('[AuthRepository] loginUsername: invalid response data');
        debugPrint('[AuthRepository] Full response: ${res.data}');
      }
      throw Exception('Invalid response from server');
    }

    await _saveAuthData(data);

    final userData = data['user'];
    if (userData == null || userData is! Map<String, dynamic>) {
      throw Exception('Invalid user data from server');
    }

    return UserModel.fromJson(userData);
  }

  Future<void> logout() async {
    final refreshToken = await _storage.getRefreshToken();
    if (refreshToken != null) {
      try {
        await _api.post('/auth/logout', data: {'refreshToken': refreshToken});
      } catch (_) {}
    }
    await _storage.clearAuthData();
    _api.clearCachedToken();
  }

  Future<void> sendEmailOtp(String email) async {
    if (kDebugMode) {
      debugPrint(
        '[AuthRepository] sendEmailOtp: POST /auth/profile/email/send-otp',
      );
    }
    await _api.post('/auth/profile/email/send-otp', data: {'email': email});
  }

  Future<void> verifyEmailOtp(String email, String code) async {
    if (kDebugMode) {
      debugPrint(
        '[AuthRepository] verifyEmailOtp: POST /auth/profile/email/verify',
      );
    }
    await _api.post(
      '/auth/profile/email/verify',
      data: {'email': email, 'code': code},
    );
  }

  Future<void> sendPhoneOtp(String phone) async {
    if (kDebugMode) {
      debugPrint(
        '[AuthRepository] sendPhoneOtp: POST /auth/profile/phone/send-otp',
      );
    }
    await _api.post('/auth/profile/phone/send-otp', data: {'phone': phone});
  }

  Future<void> verifyPhoneOtp(String phone, String code) async {
    if (kDebugMode) {
      debugPrint(
        '[AuthRepository] verifyPhoneOtp: POST /auth/profile/phone/verify',
      );
    }
    await _api.post(
      '/auth/profile/phone/verify',
      data: {'phone': phone, 'code': code},
    );
  }

  Future<void> _saveAuthData(Map<String, dynamic> data) async {
    final accessToken = data['accessToken'] as String?;
    final refreshToken = data['refreshToken'] as String?;
    final userId = (data['user'] as Map<String, dynamic>?)?['id'] as String?;

    if (kDebugMode) {
      debugPrint('[AuthRepository] _saveAuthData:');
      debugPrint(
        '  accessToken: ${accessToken != null ? 'present (${accessToken.length} chars)' : 'MISSING'}',
      );
      debugPrint(
        '  refreshToken: ${refreshToken != null ? 'present (${refreshToken.length} chars)' : 'MISSING'}',
      );
      debugPrint('  userId: ${userId ?? 'MISSING'}');
    }

    final futures = <Future<void>>[];
    if (accessToken != null && accessToken.isNotEmpty) {
      futures.add(_storage.setAccessToken(accessToken));
    }
    if (refreshToken != null && refreshToken.isNotEmpty) {
      futures.add(_storage.setRefreshToken(refreshToken));
    }
    if (userId != null && userId.isNotEmpty) {
      futures.add(_storage.setUserId(userId));
    }
    if (futures.isNotEmpty) {
      await Future.wait(futures);
    }
  }
}
