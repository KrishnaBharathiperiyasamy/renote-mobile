import 'dart:convert';
import 'package:dio/dio.dart';

import '../../services/storage_service.dart';
import '../../services/auth_service.dart';
import '../config/env_config.dart';
import '../routing/app_router.dart';

DateTime? getJwtExpiration(String? token) {
  if (token == null || token.isEmpty) return null;
  try {
    final parts = token.split('.');
    if (parts.length != 3) return null;
    final normalized = base64Url.normalize(parts[1]);
    final payloadString = utf8.decode(base64Url.decode(normalized));
    final map = jsonDecode(payloadString);
    if (map is Map && map['exp'] != null) {
      final expSeconds = map['exp'] as int;
      return DateTime.fromMillisecondsSinceEpoch(expSeconds * 1000);
    }
  } catch (_) {}
  return null;
}

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'app-code': EnvConfig.appCode,
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // If sending FormData (multipart upload), clear static application/json
          // so Dio computes the correct multipart/form-data boundary automatically!
          if (options.data is FormData) {
            options.headers.remove('Content-Type');
            options.headers.remove('content-type');
            options.contentType = null;
          }
          final token = await StorageService().getAccessToken();
          options.headers.remove('Authorization');
          options.headers.remove('authorization');
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          options.headers['app-code'] = EnvConfig.appCode;
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          final statusCode = error.response?.statusCode;
          final requestPath = error.requestOptions.path;

          // Never attempt refresh on auth endpoints (login, register, refresh-token)
          final isAuthEndpoint = requestPath.contains('/auth/login') ||
              requestPath.contains('/auth/refresh-token') ||
              requestPath.contains('/auth/register');

          final isAlreadyRetried = error.requestOptions.extra['_isRetry'] == true;

          // Handle 401 Unauthorized for protected APIs
          if (statusCode == 401 && !isAuthEndpoint && !isAlreadyRetried) {
            try {
              // Single-flight refresh token operation
              final newToken = await AuthService().refreshAccessToken();

              if (newToken != null && newToken.isNotEmpty) {
                final options = error.requestOptions;
                options.headers.remove('Authorization');
                options.headers.remove('authorization');
                options.headers['Authorization'] = 'Bearer $newToken';
                options.headers['app-code'] = EnvConfig.appCode;
                options.extra['_isRetry'] = true;

                // Handle FormData cloning for upload retry
                if (options.data is FormData) {
                  options.headers.remove('Content-Type');
                  options.headers.remove('content-type');
                  options.contentType = null;
                  final original = options.data as FormData;
                  options.data = original.clone();
                }

                final response = await dio.fetch(options);
                return handler.resolve(response);
              } else {
                // Refresh failed (invalid/revoked/expired refresh token)
                await StorageService().clearAll();
                try {
                  AppRouter.router.go('/login');
                } catch (_) {}
                return handler.next(error);
              }
            } catch (retryError) {
              if (retryError is DioException) {
                return handler.next(retryError);
              }
              return handler.next(error);
            }
          }

          return handler.next(error);
        },
      ),
    );
  }
}
