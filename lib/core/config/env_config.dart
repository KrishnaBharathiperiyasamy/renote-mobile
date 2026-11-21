import 'package:flutter/foundation.dart';

enum Environment { development, production }

class EnvConfig {
  EnvConfig._();

  // Production HTTPS Endpoints (renote.co.in)
  static const String prodAuthBaseUrl = 'https://renote.co.in';
  static const String prodDataBaseUrl = 'https://renote.co.in';

  // Environment Mode: in release mode, automatically defaults to production HTTPS
  // Can also be explicitly set at compile-time via --dart-define=ENV=production / development
  static const String _envDefine = String.fromEnvironment(
    'ENV',
    defaultValue: '',
  );

  static Environment get currentEnvironment {
    if (_envDefine == 'development') {
      return Environment.development;
    }
    if (_envDefine == 'production') {
      return Environment.production;
    }
    // In local web development (localhost), default to local development backend
    // unless explicitly set to production via --dart-define=ENV=production
    if (kIsWeb) {
      return Environment.development;
    }
    if (kReleaseMode) {
      return Environment.production;
    }
    return Environment.development;
  }

  static bool get isProduction => currentEnvironment == Environment.production;

  // Development LAN/host IP
  static String get defaultDevHost {
    if (kIsWeb) return 'localhost';
    try {
      if (defaultTargetPlatform == TargetPlatform.windows ||
          defaultTargetPlatform == TargetPlatform.macOS ||
          defaultTargetPlatform == TargetPlatform.linux) {
        return 'localhost';
      }
      if (defaultTargetPlatform == TargetPlatform.android) {
        return '192.168.1.62';
      }
    } catch (_) {
      // Platform not supported or test environment
    }
    return 'localhost';
  }

  static String get defaultHost => defaultDevHost;

  // Active Base URLs
  static String _activeAuthUrl = '';
  static String _activeDataUrl = '';

  static String get authBaseUrl {
    if (_activeAuthUrl.isNotEmpty) return _activeAuthUrl;
    return isProduction ? prodAuthBaseUrl : 'http://$defaultDevHost:3005';
  }

  static set authBaseUrl(String url) => _activeAuthUrl = url;

  static String get dataBaseUrl {
    if (_activeDataUrl.isNotEmpty) return _activeDataUrl;
    return isProduction ? prodDataBaseUrl : 'http://$defaultDevHost:6003';
  }

  static set dataBaseUrl(String url) => _activeDataUrl = url;

  static const String appCode = 'RENOTE';
  static const String roleCode = 'USER';

  // For developer settings / dynamic testing only
  static void updateHost(String newHost) {
    _activeAuthUrl = 'http://$newHost:3005';
    _activeDataUrl = 'http://$newHost:6003';
  }

  static void resetToDefault() {
    _activeAuthUrl = '';
    _activeDataUrl = '';
  }
}
