import 'package:flutter/services.dart';

class SecurityService {
  static const MethodChannel _channel = MethodChannel(
    'com.naik.naik_mobile/security',
  );

  static Future<bool> isDeviceCompromised() async {
    try {
      final compromised = await _channel.invokeMethod<bool>(
        'isDeviceCompromised',
      );
      return compromised ?? false;
    } on MissingPluginException {
      return false;
    }
  }
}
