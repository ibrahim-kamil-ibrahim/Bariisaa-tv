import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

class ApiClient {
  late final Dio dio;
  final FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  /// Cached access token held in memory to avoid reading secure storage
  /// on every request. Updated in refreshAccessToken() and cleared on logout.
  String? _cachedAccessToken;

  /// Invoked when the session is definitively dead (server rejected the
  /// refresh token). Wired by the DI setup to AuthCubit so the UI can route
  /// the user to the login screen.
  void Function()? onSessionExpired;

  void _notifySessionExpired() {
    try {
      onSessionExpired?.call();
    } catch (_) {}
  }

  /// Bare Dio (no interceptors) used ONLY for the refresh call itself, so a
  /// failed refresh can never re-enter the refresh interceptor (infinite loop).
  late final Dio _refreshDio;

  bool _isRefreshing = false;
  final List<Completer<void>> _refreshQueue = [];

  /// Endpoints where a 401 means "bad credentials", NOT "expired token".
  static const List<String> _noRefreshPaths = [
    '/auth/login',
    '/auth/login/username',
    '/auth/logout',
    '/auth/google',
    '/auth/signup',
    '/auth/signup/email',
    '/auth/signup/phone',
    '/auth/signup/username',
    '/auth/refresh-token',
    '/auth/profile/email/verify',
    '/auth/profile/phone/verify',
    '/auth/profile/email/send-otp',
    '/auth/profile/phone/send-otp',
    '/auth/upgrade/password',
  ];

  /// Public paths that MUST NOT send an Authorization header, even if a
  /// cached token exists. This prevents stale tokens from being sent to
  /// public endpoints (signup, login, etc.) which reject them.
  static const List<String> _publicAuthPaths = [
    '/auth/signup',
    '/auth/signup/email',
    '/auth/signup/phone',
    '/auth/signup/username',
    '/auth/login',
    '/auth/login/username',
    '/auth/google',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/refresh-token',
  ];

  bool _isAuthPath(String path) {
    final p = path.split('?').first;
    return _noRefreshPaths.any((e) => p == e || p.startsWith('$e/'));
  }

  bool _isPublicAuthPath(String path) {
    final p = path.split('?').first;
    return _publicAuthPaths.any((e) => p == e || p.startsWith('$e/'));
  }

  ApiClient() {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.apiBaseUrl,
        connectTimeout: AppConstants.connectTimeout,
        receiveTimeout: AppConstants.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _refreshDio = Dio(
      BaseOptions(
        baseUrl: AppConstants.apiBaseUrl,
        connectTimeout: AppConstants.connectTimeout,
        receiveTimeout: AppConstants.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.addAll([_authInterceptor(), _refreshTokenInterceptor()]);
  }

  Future<String?> _safeStorageRead({required String key}) async {
    try {
      return await _secureStorage.read(key: key);
    } catch (_) {
      return null;
    }
  }

  /// Clear cached token (call on logout or when token is known invalid).
  void clearCachedToken() {
    _cachedAccessToken = null;
  }

  /// Native JWT refresh via `POST /auth/refresh-token` (rotates both tokens).
  Future<void> refreshAccessToken() async {
    String? refreshToken;
    try {
      refreshToken = await _secureStorage.read(
        key: AppConstants.refreshTokenKey,
      );
    } catch (_) {}
    if (refreshToken == null) {
      throw Exception('No refresh token');
    }

    try {
      final response = await _refreshDio.post(
        '/auth/refresh-token',
        data: {'refreshToken': refreshToken},
      );
      final data = response.data['data'] as Map<String, dynamic>;
      final newAccessToken = data['accessToken'] as String;
      final newRefreshToken = data['refreshToken'] as String;

      _cachedAccessToken = newAccessToken;
      try {
        await _secureStorage.write(
          key: AppConstants.accessTokenKey,
          value: newAccessToken,
        );
      } catch (_) {}
      try {
        await _secureStorage.write(
          key: AppConstants.refreshTokenKey,
          value: newRefreshToken,
        );
      } catch (_) {}
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout) {
        throw Exception('Network error during token refresh');
      }
      if (e.response?.statusCode == 401) {
        try {
          await _secureStorage.delete(key: AppConstants.accessTokenKey);
        } catch (_) {}
        try {
          await _secureStorage.delete(key: AppConstants.refreshTokenKey);
        } catch (_) {}
        _cachedAccessToken = null;
        _notifySessionExpired();
      }
      throw Exception('Token refresh failed');
    } catch (e) {
      throw Exception('Token refresh failed: $e');
    }
  }

  Interceptor _authInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) async {
        final path = options.path.split('?').first;

        // Public auth endpoints (signup, login, etc.) must NEVER send a
        // token. If a stale token is cached, clear it so it doesn't leak
        // into public requests.
        if (_isPublicAuthPath(path)) {
          if (_cachedAccessToken != null) {
            _cachedAccessToken = null;
          }
          // Do NOT attach Authorization header for public paths
          handler.next(options);
          return;
        }

        // Protected endpoints: attach token if available
        if (_cachedAccessToken != null) {
          options.headers['Authorization'] = 'Bearer $_cachedAccessToken';
        } else {
          String? token;
          try {
            token = await _secureStorage.read(key: AppConstants.accessTokenKey);
          } catch (_) {}
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
            _cachedAccessToken = token;
          }
        }
        handler.next(options);
      },
    );
  }

  Interceptor _refreshTokenInterceptor() {
    return InterceptorsWrapper(
      onError: (error, handler) async {
        final requestPath = error.requestOptions.path;
        final isRetry =
            error.requestOptions.extra['retriedAfterRefresh'] == true;

        if (error.response?.statusCode == 401 &&
            !_isAuthPath(requestPath) &&
            !isRetry) {
          String? refreshToken;
          try {
            refreshToken = await _secureStorage.read(
              key: AppConstants.refreshTokenKey,
            );
          } catch (_) {}
          if (refreshToken == null) {
            try {
              await _secureStorage.delete(key: AppConstants.accessTokenKey);
            } catch (_) {}
            try {
              await _secureStorage.delete(key: AppConstants.refreshTokenKey);
            } catch (_) {}
            _cachedAccessToken = null;
            if (error.requestOptions.headers['Authorization'] != null) {
              _notifySessionExpired();
            }
            return handler.reject(error);
          }

          if (_isRefreshing) {
            final completer = Completer<void>();
            _refreshQueue.add(completer);
            try {
              await completer.future;
            } catch (_) {
              return handler.reject(error);
            }

            final newToken =
                _cachedAccessToken ??
                await _safeStorageRead(key: AppConstants.accessTokenKey);
            if (newToken != null) {
              try {
                error.requestOptions.headers['Authorization'] =
                    'Bearer $newToken';
                error.requestOptions.extra['retriedAfterRefresh'] = true;
                final retryResponse = await dio.fetch(error.requestOptions);
                return handler.resolve(retryResponse);
              } catch (retryErr) {
                if (retryErr is DioException) {
                  return handler.reject(retryErr);
                }
                return handler.reject(error);
              }
            }
            return handler.reject(error);
          }

          _isRefreshing = true;

          try {
            await refreshAccessToken();
            String? newAccessToken;
            try {
              newAccessToken =
                  _cachedAccessToken ??
                  await _secureStorage.read(key: AppConstants.accessTokenKey);
            } catch (_) {}

            if (newAccessToken != null) {
              error.requestOptions.headers['Authorization'] =
                  'Bearer $newAccessToken';
              error.requestOptions.extra['retriedAfterRefresh'] = true;
              final retryResponse = await dio.fetch(error.requestOptions);

              for (final completer in _refreshQueue) {
                if (!completer.isCompleted) completer.complete();
              }
              _refreshQueue.clear();

              return handler.resolve(retryResponse);
            } else {
              throw Exception('Access token null after refresh');
            }
          } catch (e) {
            if (kDebugMode) debugPrint('[ApiClient] Token refresh failed: $e');
            for (final completer in _refreshQueue) {
              if (!completer.isCompleted) completer.completeError(e);
            }
            _refreshQueue.clear();
            _cachedAccessToken = null;
          } finally {
            _isRefreshing = false;
          }
        }
        handler.reject(error);
      },
    );
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) =>
      dio.get(path, queryParameters: queryParameters);

  Future<Response> post(String path, {dynamic data}) =>
      dio.post(path, data: data);

  Future<Response> put(String path, {dynamic data}) =>
      dio.put(path, data: data);

  Future<Response> patch(String path, {dynamic data}) =>
      dio.patch(path, data: data);

  Future<Response> delete(String path, {dynamic data}) =>
      dio.delete(path, data: data);
}
