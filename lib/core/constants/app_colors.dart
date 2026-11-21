import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Primary Brand Palette (ReNote Flame Orange) ──
  static const Color primary = Color(0xFFFF6B1A);
  static const Color primaryDeep = Color(0xFFFF5722);
  static const Color primaryDark = Color(0xFFE85D04);
  static const Color primaryLight = Color(0xFFFFA040);
  static const Color primaryAmber = Color(0xFFFFD54F);
  static const Color primaryBg = Color(0xFFFFF7ED);
  static const Color primaryGlow = Color(0x33FF6B1A);

  // ── Gradient Stops for ReNote Flame Logo ──
  static const Color flameRed = Color(0xFFE85D04);
  static const Color flameOrange = Color(0xFFFF6B1A);
  static const Color flameAmber = Color(0xFFFFA040);
  static const Color flameYellow = Color(0xFFFFD54F);

  // ── Original Next.js Dark Mode Palette (globals.css & login/page.tsx) ──
  static const Color darkBg = Color(0xFF0A0A0B);
  static const Color darkBgSecondary = Color(0xFF0D0E12);
  static const Color darkSurface = Color(0xFF121215);
  static const Color darkCard = Color(0xFF16181E);
  static const Color darkCardBorder = Color(
    0x14FFFFFF,
  ); // rgba(255, 255, 255, 0.08)
  static const Color darkInputBg = Color(0xFF16161A);
  static const Color darkInputBorder = Color(0xFF272730);
  static const Color darkTextPrimary = Color(0xFFFFFFFF);
  static const Color darkTextSecondary = Color(0xFF8E95A5);
  static const Color darkTextMuted = Color(0xFF71717A);

  // ── Original Next.js Light Mode Palette ──
  static const Color scaffoldBg = Color(0xFFF8F9FC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceMuted = Color(0xFFF3F4F6);
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textMuted = Color(0xFF9CA3AF);
  static const Color textInverse = Color(0xFFFFFFFF);

  // ── Borders & Dividers ──
  static const Color border = Color(0xFFE5E7EB);
  static const Color borderLight = Color(0xFFF1F5F9);
  static const Color borderDark = Color(0xFF272730);
  static const Color cardBorder = border;
  static const Color inputBg = surfaceMuted;
  static const Color inputBorder = border;

  // ── Semantic Status Colors ──
  static const Color success = Color(0xFF10B981);
  static const Color successBg = Color(0xFFECFDF5);
  static const Color danger = Color(0xFFEF4444);
  static const Color dangerBg = Color(0xFFFEF2F2);
  static const Color error = danger;
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningBg = Color(0xFFFFFBEB);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoBg = Color(0xFFEFF6FF);

  // ── Official Gradients ──
  static const LinearGradient brandFlameGrad = LinearGradient(
    begin: Alignment.bottomLeft,
    end: Alignment.topRight,
    colors: [Color(0xFFE85D04), Color(0xFFFF6B1A)],
  );

  static const LinearGradient brandFlameInner = LinearGradient(
    begin: Alignment.bottomLeft,
    end: Alignment.topRight,
    colors: [Color(0xFFFF6B1A), Color(0xFFFFA040)],
  );

  static const LinearGradient flameGradient = LinearGradient(
    begin: Alignment.bottomLeft,
    end: Alignment.topRight,
    colors: [flameRed, flameOrange, flameAmber],
  );

  static const LinearGradient flameInnerGradient = LinearGradient(
    begin: Alignment.bottomLeft,
    end: Alignment.topRight,
    colors: [flameOrange, flameYellow],
  );

  static const LinearGradient primaryButtonGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [primaryDark, primary],
  );
}
