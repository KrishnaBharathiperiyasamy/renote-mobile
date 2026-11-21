import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  SharedPreferences? _prefs;

  String? _inMemoryAccessToken;
  String? _inMemoryRefreshToken;
  String? _inMemoryUserId;
  String? _inMemoryAuthId;
  String? _inMemoryEmail;
  String? _inMemoryPhone;
  String? _inMemoryFirstName;
  String? _inMemoryLastName;
  String? _inMemoryProfileImageUrl;
  String? _inMemoryRole;
  String? _inMemoryThemeMode;

  Future<SharedPreferences?> _getSafePrefs() async {
    if (_prefs != null) return _prefs;
    try {
      _prefs = await SharedPreferences.getInstance();
    } catch (_) {}
    return _prefs;
  }

  Future<void> init() async {
    final prefs = await _getSafePrefs();
    if (prefs != null) {
      _inMemoryAccessToken ??= prefs.getString('token');
      _inMemoryRefreshToken ??= prefs.getString('refreshToken');
      _inMemoryAuthId ??= prefs.getString('authId');
      _inMemoryUserId ??= prefs.getString('userId');
      _inMemoryEmail ??= prefs.getString('email');
      _inMemoryPhone ??= prefs.getString('phone');
      _inMemoryFirstName ??= prefs.getString('firstName');
      _inMemoryLastName ??= prefs.getString('lastName');
      _inMemoryProfileImageUrl ??= prefs.getString('profileImageUrl');
      _inMemoryRole ??= prefs.getString('role');
      _inMemoryThemeMode ??= prefs.getString('app_theme_mode');
    }
  }

  // Token Management
  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    _inMemoryAccessToken = accessToken;
    _inMemoryRefreshToken = refreshToken;
    try {
      await _secureStorage.write(key: 'accessToken', value: accessToken);
      if (refreshToken != null) {
        await _secureStorage.write(key: 'refreshToken', value: refreshToken);
      }
    } catch (_) {}
    final prefs = await _getSafePrefs();
    await prefs?.setString('token', accessToken);
    if (refreshToken != null) {
      await prefs?.setString('refreshToken', refreshToken);
    }
  }

  Future<String?> getAccessToken() async {
    if (_inMemoryAccessToken != null && _inMemoryAccessToken!.isNotEmpty) {
      return _inMemoryAccessToken;
    }
    try {
      final token = await _secureStorage.read(key: 'accessToken');
      if (token != null && token.isNotEmpty) {
        _inMemoryAccessToken = token;
        return token;
      }
    } catch (_) {}
    final prefs = await _getSafePrefs();
    final prefToken = prefs?.getString('token');
    if (prefToken != null && prefToken.isNotEmpty) {
      _inMemoryAccessToken = prefToken;
    }
    return prefToken;
  }

  Future<String?> getRefreshToken() async {
    if (_inMemoryRefreshToken != null && _inMemoryRefreshToken!.isNotEmpty) {
      return _inMemoryRefreshToken;
    }
    try {
      final token = await _secureStorage.read(key: 'refreshToken');
      if (token != null && token.isNotEmpty) {
        _inMemoryRefreshToken = token;
        return token;
      }
    } catch (_) {}
    final prefs = await _getSafePrefs();
    final prefRefreshToken = prefs?.getString('refreshToken');
    if (prefRefreshToken != null && prefRefreshToken.isNotEmpty) {
      _inMemoryRefreshToken = prefRefreshToken;
    }
    return prefRefreshToken;
  }

  // User details
  Future<void> saveUserData({
    required String authId,
    required String userId,
    String? email,
    String? phone,
    String? firstName,
    String? lastName,
    String? profileImageUrl,
    String? role,
  }) async {
    _inMemoryAuthId = authId;
    _inMemoryUserId = userId;
    _inMemoryEmail = email;
    _inMemoryPhone = phone;
    _inMemoryFirstName = firstName;
    _inMemoryLastName = lastName;
    _inMemoryProfileImageUrl = profileImageUrl;
    _inMemoryRole = role;

    final prefs = await _getSafePrefs();
    await prefs?.setString('authId', authId);
    await prefs?.setString('userId', userId);
    if (email != null) {
      await prefs?.setString('email', email);
    }
    if (phone != null) {
      await prefs?.setString('phone', phone);
    }
    if (firstName != null) {
      await prefs?.setString('firstName', firstName);
    }
    if (lastName != null) {
      await prefs?.setString('lastName', lastName);
    }
    if (profileImageUrl != null) {
      await prefs?.setString('profileImageUrl', profileImageUrl);
    }
    if (role != null) {
      await prefs?.setString('role', role);
    }
    await prefs?.setBool('isLoggedIn', true);
  }

  String? getAuthId() => _inMemoryAuthId ?? _prefs?.getString('authId');
  String? getUserId() => _inMemoryUserId ?? _prefs?.getString('userId');
  String? getEmail() => _inMemoryEmail ?? _prefs?.getString('email');
  String? getPhone() => _inMemoryPhone ?? _prefs?.getString('phone');
  String? getFirstName() => _inMemoryFirstName ?? _prefs?.getString('firstName');
  String? getLastName() => _inMemoryLastName ?? _prefs?.getString('lastName');
  String? getFullName() {
    final f = getFirstName() ?? '';
    final l = getLastName() ?? '';
    return '$f $l'.trim();
  }

  String? getProfileImageUrl() =>
      _inMemoryProfileImageUrl ?? _prefs?.getString('profileImageUrl');
  String? getRole() => _inMemoryRole ?? _prefs?.getString('role');
  bool isLoggedIn() => _prefs?.getBool('isLoggedIn') ?? false;

  // Theme Mode Persistence
  Future<void> saveThemeMode(String mode) async {
    _inMemoryThemeMode = mode;
    final prefs = await _getSafePrefs();
    await prefs?.setString('app_theme_mode', mode);
  }

  String getThemeMode() =>
      _inMemoryThemeMode ?? _prefs?.getString('app_theme_mode') ?? 'light';

  // Clear all session data on logout
  Future<void> clearAll() async {
    _inMemoryAccessToken = null;
    _inMemoryRefreshToken = null;
    _inMemoryUserId = null;
    _inMemoryAuthId = null;
    _inMemoryEmail = null;
    _inMemoryPhone = null;
    _inMemoryFirstName = null;
    _inMemoryLastName = null;
    _inMemoryProfileImageUrl = null;
    _inMemoryRole = null;
    try {
      await _secureStorage.deleteAll();
    } catch (_) {}
    try {
      await _prefs?.clear();
    } catch (_) {}
  }
}
