import 'dart:async';
import 'package:dio/dio.dart';

import '../core/constants/api_constants.dart';
import '../core/config/env_config.dart';
import '../core/network/api_client.dart';
import '../models/user_model.dart';
import 'storage_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final Dio _dio = ApiClient().dio;
  final StorageService _storage = StorageService();

  Future<UserModel> login({
    required String emailOrPhone,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.login,
        data: {
          'emailOrPhone': emailOrPhone.trim(),
          'password': password,
          'appCode': EnvConfig.appCode,
        },
      );

      final data = response.data;
      if (data != null && data['success'] == true && data['data'] != null) {
        final authData = data['data'];
        final accessToken = authData['accessToken']?.toString() ?? '';
        final refreshToken = authData['refreshToken']?.toString();
        final userData = authData['user'] ?? {};

        final user = UserModel.fromJson(userData);

        await _storage.saveTokens(
          accessToken: accessToken,
          refreshToken: refreshToken,
        );

        await _storage.saveUserData(
          authId: user.id,
          userId: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profilePic,
          role: user.role,
        );

        return user;
      } else {
        final msg =
            data?['message']?.toString() ??
            'Login failed. Please check credentials.';
        throw Exception(msg);
      }
    } on DioException catch (e) {
      final resData = e.response?.data;
      String? msg;
      if (resData is Map) {
        msg = resData['message']?.toString() ??
            (resData['errors'] is List
                ? (resData['errors'] as List).join(', ')
                : null);
      } else if (resData is String && resData.isNotEmpty) {
        msg = resData;
      }
      msg ??= e.message ?? 'Network error. Please try again.';
      throw Exception(msg);
    }
  }

  Future<UserModel> register({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String password,
  }) async {
    try {
      final payload = <String, dynamic>{
        'firstName': firstName.trim(),
        'lastName': lastName.trim(),
        'password': password,
        'appCode': EnvConfig.appCode,
        'roleCode': EnvConfig.roleCode,
      };
      if (email.trim().isNotEmpty) {
        payload['email'] = email.trim();
      }
      if (phone.trim().isNotEmpty) {
        payload['phone'] = phone.trim();
      }

      final response = await _dio.post(
        ApiConstants.register,
        data: payload,
      );

      final data = response.data;
      if (data != null && data['success'] == true && data['data'] != null) {
        final authData = data['data'];
        final accessToken = authData['accessToken']?.toString() ?? '';
        final refreshToken = authData['refreshToken']?.toString();
        final userData = authData['user'] ?? {};

        final user = UserModel.fromJson(userData);

        await _storage.saveTokens(
          accessToken: accessToken,
          refreshToken: refreshToken,
        );

        await _storage.saveUserData(
          authId: user.id,
          userId: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profilePic,
          role: user.role,
        );

        return user;
      } else {
        throw Exception(data?['message'] ?? 'Registration failed.');
      }
    } on DioException catch (e) {
      final resData = e.response?.data;
      String? msg;
      if (resData is Map) {
        msg = resData['message']?.toString() ??
            (resData['errors'] is List
                ? (resData['errors'] as List).join(', ')
                : null);
      } else if (resData is String && resData.isNotEmpty) {
        msg = resData;
      }
      msg ??= e.message ?? 'Registration error. Please check details.';
      throw Exception(msg);
    }
  }

  Completer<String?>? _refreshCompleter;

  Future<String?> refreshAccessToken() async {
    // If a refresh is already in-flight, return the same future (single-flight)
    if (_refreshCompleter != null) {
      return _refreshCompleter!.future;
    }

    final completer = Completer<String?>();
    _refreshCompleter = completer;

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        completer.complete(null);
        return null;
      }

      final standaloneDio = Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {
            'app-code': EnvConfig.appCode,
            'Content-Type': 'application/json',
          },
        ),
      );

      final response = await standaloneDio.post(
        ApiConstants.refreshToken,
        data: {
          'refreshToken': refreshToken,
          'appCode': EnvConfig.appCode,
        },
      );

      final data = response.data;
      if (data != null && data['data'] != null) {
        final authData = data['data'];
        final newAccessToken = authData['accessToken']?.toString();
        final newRefreshToken = authData['refreshToken']?.toString();
        if (newAccessToken != null && newAccessToken.isNotEmpty) {
          await _storage.saveTokens(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken ?? refreshToken,
          );
          completer.complete(newAccessToken);
          return newAccessToken;
        }
      }
      completer.complete(null);
      return null;
    } catch (_) {
      completer.complete(null);
      return null;
    } finally {
      _refreshCompleter = null;
    }
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }

  Future<UserModel?> getProfile() async {
    try {
      final response = await _dio.get(ApiConstants.getMe);
      if (response.data != null &&
          response.data['success'] == true &&
          response.data['data'] != null) {
        final d = response.data['data'];
        final userObj = (d is Map && d['user'] != null) ? d['user'] : d;
        return UserModel.fromJson(userObj);
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}
