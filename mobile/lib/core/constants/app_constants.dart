import 'package:flutter/foundation.dart'
    show kReleaseMode, defaultTargetPlatform, TargetPlatform;

class AppConstants {
  static const String appName = 'Bariisaa Tv';

  static const String prodBaseUrl = 'https://api.bariisaa.com/api/v1';
  static const String devAndroidBaseUrl = 'http://10.0.2.2:3000/api/v1';
  static const String devDesktopBaseUrl = 'http://localhost:3000/api/v1';

  static bool get _isDevMode => !kReleaseMode;

  static String get apiBaseUrl {
    if (!_isDevMode) return prodBaseUrl;
    if (defaultTargetPlatform == TargetPlatform.android)
      return devAndroidBaseUrl;
    return devDesktopBaseUrl;
  }

  /// Resolve a backend URL (may be http://localhost:3000/...) to the
  /// correct host for the current platform.
  static String resolveUrl(String url) {
    if (url.startsWith('http://localhost:3000')) {
      final base = apiBaseUrl.replaceAll('/api/v1', '');
      return url.replaceFirst('http://localhost:3000', base);
    }
    if (url.startsWith('http://127.0.0.1:3000')) {
      final base = apiBaseUrl.replaceAll('/api/v1', '');
      return url.replaceFirst('http://127.0.0.1:3000', base);
    }
    return url;
  }

  static const int maxDevices = 5;
  static const int pageSize = 20;

  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userIdKey = 'user_id';
  static const String deviceIdKey = 'device_id';
  static const String devModeKey = 'dev_mode';

  static const double audioSkipForward = 30;
  static const double audioSkipBackward = 10;
  static const double minPlaybackSpeed = 0.5;
  static const double maxPlaybackSpeed = 3.0;
  static const double playbackSpeedStep = 0.25;

  static const List<double> playbackSpeeds = [
    0.5,
    0.75,
    1.0,
    1.25,
    1.5,
    1.75,
    2.0,
    2.25,
    2.5,
    2.75,
    3.0,
  ];
  static const List<int> sleepTimerMinutes = [5, 10, 15, 30, 45, 60];

  static const double minFontSize = 8.0;
  static const double maxFontSize = 32.0;
  static const double fontSizeStep = 2.0;

  static const List<String> fontFamilies = [
    'Nunito',
    'Inter',
    'Georgia',
    'Palatino',
  ];
}
