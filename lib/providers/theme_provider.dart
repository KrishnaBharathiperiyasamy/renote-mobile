import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/storage_service.dart';

class ThemeNotifier extends Notifier<ThemeMode> {
  final StorageService _storageService = StorageService();

  @override
  ThemeMode build() {
    final savedMode = _storageService.getThemeMode();
    return savedMode == 'dark' ? ThemeMode.dark : ThemeMode.light;
  }

  bool get isDark => state == ThemeMode.dark;

  void toggleTheme() {
    final nextMode = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    state = nextMode;
    _storageService.saveThemeMode(nextMode == ThemeMode.dark ? 'dark' : 'light');
  }

  void setTheme(ThemeMode mode) {
    state = mode;
    _storageService.saveThemeMode(mode == ThemeMode.dark ? 'dark' : 'light');
  }
}

final themeProvider = NotifierProvider<ThemeNotifier, ThemeMode>(
  ThemeNotifier.new,
);
