import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

class AuthState {
  final bool isLoading;
  final bool isLoggedIn;
  final UserModel? user;
  final String? errorMessage;

  AuthState({
    this.isLoading = false,
    this.isLoggedIn = false,
    this.user,
    this.errorMessage,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isLoggedIn,
    UserModel? user,
    String? errorMessage,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      user: user ?? this.user,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  final AuthService _authService = AuthService();
  final StorageService _storage = StorageService();

  @override
  AuthState build() {
    Future.microtask(() => checkInitialAuth());
    return AuthState(isLoading: true);
  }

  Future<void> checkInitialAuth() async {
    final loggedIn = _storage.isLoggedIn();
    final authId = _storage.getAuthId();

    if (loggedIn && authId != null) {
      final user = UserModel(
        id: authId,
        email: _storage.getEmail(),
        phone: _storage.getPhone(),
        firstName: _storage.getFirstName(),
        lastName: _storage.getLastName(),
        profilePic: _storage.getProfileImageUrl(),
        role: _storage.getRole(),
      );
      state = state.copyWith(isLoading: false, isLoggedIn: true, user: user);
    } else {
      state = state.copyWith(isLoading: false, isLoggedIn: false);
    }
  }

  Future<bool> login(String emailOrPhone, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final user = await _authService.login(
        emailOrPhone: emailOrPhone,
        password: password,
      );
      state = state.copyWith(isLoading: false, isLoggedIn: true, user: user);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  Future<bool> register({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final user = await _authService.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        password: password,
      );
      state = state.copyWith(isLoading: false, isLoggedIn: true, user: user);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = AuthState(isLoggedIn: false, user: null);
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);
