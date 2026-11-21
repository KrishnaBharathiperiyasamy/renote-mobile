import 'package:flutter/material.dart';

class PosterTemplateInfo {
  final String id;
  final String name;
  final String category;
  final String description;
  final Color primaryColor;
  final String layoutStyle; // 'center_hero', 'split_card', 'diagonal_banner', 'minimal_clean', 'magazine_header', 'corporate_business', 'luxury_dark'

  const PosterTemplateInfo({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.primaryColor,
    required this.layoutStyle,
  });
}

class PosterThemePalette {
  final String id;
  final String name;
  final Color primary;
  final Color primaryDark;
  final Color primaryLight;
  final Color canvasBg;
  final Color cardBg;
  final Color textPrimary;
  final Color textSecondary;
  final Color priceBg;
  final Color priceText;
  final bool isDark;

  const PosterThemePalette({
    required this.id,
    required this.name,
    required this.primary,
    required this.primaryDark,
    required this.primaryLight,
    required this.canvasBg,
    required this.cardBg,
    required this.textPrimary,
    required this.textSecondary,
    required this.priceBg,
    required this.priceText,
    this.isDark = false,
  });
}

class PosterFontOption {
  final String id;
  final String name;
  final String category;
  final TextStyle textStyle;

  const PosterFontOption({
    required this.id,
    required this.name,
    required this.category,
    required this.textStyle,
  });
}

class PosterStickerData {
  final String id;
  final String label;
  final Color bgColor;
  final Color textColor;
  final IconData? icon;

  const PosterStickerData({
    required this.id,
    required this.label,
    required this.bgColor,
    required this.textColor,
    this.icon,
  });
}

class PosterDefinitions {
  PosterDefinitions._();

  static const List<String> categories = [
    'All',
    'Classic',
    'Minimal',
    'Creative',
    'Business',
    'Premium',
    'Blank',
  ];

  static const List<PosterTemplateInfo> templates = [
    PosterTemplateInfo(
      id: 'frame1',
      name: 'Classic Hero Sale',
      category: 'Classic',
      description: 'Bold top sale banner with central product hero spotlight and bottom price tag.',
      primaryColor: Color(0xFFFF6B00),
      layoutStyle: 'center_hero',
    ),
    PosterTemplateInfo(
      id: 'frame2',
      name: 'Retail Modern Card',
      category: 'Classic',
      description:
          'Clean framed card with corner discount badge and prominent title.',
      primaryColor: Color(0xFFEA580C),
      layoutStyle: 'split_card',
    ),
    PosterTemplateInfo(
      id: 'frame3',
      name: 'Ribbon Spotlight',
      category: 'Classic',
      description: 'Curved graphical ribbon accent with floating brand logo.',
      primaryColor: Color(0xFFF97316),
      layoutStyle: 'diagonal_banner',
    ),
    PosterTemplateInfo(
      id: 'frame7',
      name: 'Clean Editorial',
      category: 'Minimal',
      description:
          'Sophisticated typography, high white space, subtle framing lines.',
      primaryColor: Color(0xFF1E293B),
      layoutStyle: 'minimal_clean',
    ),
    PosterTemplateInfo(
      id: 'frame8',
      name: 'Studio Minimal',
      category: 'Minimal',
      description:
          'Monochrome minimalist layout with oversized product focal point.',
      primaryColor: Color(0xFF475569),
      layoutStyle: 'minimal_clean',
    ),
    PosterTemplateInfo(
      id: 'frame11',
      name: 'Neon Diagonal Splash',
      category: 'Creative',
      description:
          'Dynamic diagonal color angle with high-energy sticker placement.',
      primaryColor: Color(0xFF7C3AED),
      layoutStyle: 'diagonal_banner',
    ),
    PosterTemplateInfo(
      id: 'frame12',
      name: 'Bold Dual-Tone',
      category: 'Creative',
      description:
          'Contrasting dual-color block background with modern badges.',
      primaryColor: Color(0xFF0284C7),
      layoutStyle: 'magazine_header',
    ),
    PosterTemplateInfo(
      id: 'frame13',
      name: 'Corporate Catalogue',
      category: 'Business',
      description: 'Structured enterprise header, verified official seal, contact footer strip.',
      primaryColor: Color(0xFF1E3A8A),
      layoutStyle: 'corporate_business',
    ),
    PosterTemplateInfo(
      id: 'frame14',
      name: 'Executive Showcase',
      category: 'Business',
      description:
          'Sleek executive card with company credentials and specs list.',
      primaryColor: Color(0xFF0F766E),
      layoutStyle: 'corporate_business',
    ),
    PosterTemplateInfo(
      id: 'frame15',
      name: 'Royal Gold Luxury',
      category: 'Premium',
      description:
          'Deep obsidian backdrop with metallic gold trim and star badges.',
      primaryColor: Color(0xFFD97706),
      layoutStyle: 'luxury_dark',
    ),
    PosterTemplateInfo(
      id: 'frame16',
      name: 'Obsidian Velvet',
      category: 'Premium',
      description: 'Dark mode luxury showcase with radiant gradient edge glow.',
      primaryColor: Color(0xFFE11D48),
      layoutStyle: 'luxury_dark',
    ),
    PosterTemplateInfo(
      id: 'frame0',
      name: 'Blank Custom Canvas',
      category: 'Blank',
      description: 'Complete creative freedom with unconstrained drag-and-drop elements.',
      primaryColor: Color(0xFF64748B),
      layoutStyle: 'center_hero',
    ),
  ];

  static const List<PosterThemePalette> colorThemes = [
    PosterThemePalette(
      id: 'flame-orange',
      name: 'Flame Orange (ReNote)',
      primary: Color(0xFFFF6B00),
      primaryDark: Color(0xFFE63900),
      primaryLight: Color(0xFFFFF7ED),
      canvasBg: Colors.white,
      cardBg: Color(0xFFFFF7ED),
      textPrimary: Color(0xFF0F172A),
      textSecondary: Color(0xFF64748B),
      priceBg: Color(0xFFFF6B00),
      priceText: Colors.white,
    ),
    PosterThemePalette(
      id: 'electric-blue',
      name: 'Royal Sapphire',
      primary: Color(0xFF2563EB),
      primaryDark: Color(0xFF1D4ED8),
      primaryLight: Color(0xFFEFF6FF),
      canvasBg: Color(0xFFF8FAFC),
      cardBg: Color(0xFFEFF6FF),
      textPrimary: Color(0xFF0F172A),
      textSecondary: Color(0xFF64748B),
      priceBg: Color(0xFF2563EB),
      priceText: Colors.white,
    ),
    PosterThemePalette(
      id: 'emerald-green',
      name: 'Emerald Gold',
      primary: Color(0xFF059669),
      primaryDark: Color(0xFF047857),
      primaryLight: Color(0xFFECFDF5),
      canvasBg: Color(0xFFF7FEE7),
      cardBg: Color(0xFFECFDF5),
      textPrimary: Color(0xFF064E3B),
      textSecondary: Color(0xFF047857),
      priceBg: Color(0xFF059669),
      priceText: Colors.white,
    ),
    PosterThemePalette(
      id: 'cyber-violet',
      name: 'Cyber Violet',
      primary: Color(0xFF7C3AED),
      primaryDark: Color(0xFF6D28D9),
      primaryLight: Color(0xFFF5F3FF),
      canvasBg: Color(0xFFFAF5FF),
      cardBg: Color(0xFFF5F3FF),
      textPrimary: Color(0xFF2E1065),
      textSecondary: Color(0xFF6D28D9),
      priceBg: Color(0xFF7C3AED),
      priceText: Colors.white,
    ),
    PosterThemePalette(
      id: 'sunset-gold',
      name: 'Sunset Amber',
      primary: Color(0xFFD97706),
      primaryDark: Color(0xFFB45309),
      primaryLight: Color(0xFFFFFBEB),
      canvasBg: Color(0xFFFFFBEB),
      cardBg: Colors.white,
      textPrimary: Color(0xFF78350F),
      textSecondary: Color(0xFF92400E),
      priceBg: Color(0xFFD97706),
      priceText: Colors.white,
    ),
    PosterThemePalette(
      id: 'midnight-dark',
      name: 'Midnight Obsidian',
      primary: Color(0xFFFF6B00),
      primaryDark: Color(0xFFE63900),
      primaryLight: Color(0xFF1E293B),
      canvasBg: Color(0xFF0F172A),
      cardBg: Color(0xFF1E293B),
      textPrimary: Colors.white,
      textSecondary: Color(0xFF94A3B8),
      priceBg: Color(0xFFFF6B00),
      priceText: Colors.white,
      isDark: true,
    ),
  ];

  static const Map<String, double> aspectRatios = {
    '3:4': 3 / 4,
    '1:1': 1.0,
    '9:16': 9 / 16,
    '16:9': 16 / 9,
  };

  static const List<PosterStickerData> stickers = [
    PosterStickerData(
      id: 'sale',
      label: 'BIG SALE',
      bgColor: Color(0xFFDC2626),
      textColor: Colors.white,
    ),
    PosterStickerData(
      id: 'discount_50',
      label: '50% OFF',
      bgColor: Color(0xFFFF6B00),
      textColor: Colors.white,
    ),
    PosterStickerData(
      id: 'hot_deal',
      label: 'HOT DEAL 🔥',
      bgColor: Color(0xFFEA580C),
      textColor: Colors.white,
    ),
    PosterStickerData(
      id: 'new_arrival',
      label: 'NEW ARRIVAL',
      bgColor: Color(0xFF2563EB),
      textColor: Colors.white,
    ),
    PosterStickerData(
      id: 'best_quality',
      label: 'PREMIUM QUALITY ★',
      bgColor: Color(0xFF059669),
      textColor: Colors.white,
    ),
    PosterStickerData(
      id: 'limited_offer',
      label: 'LIMITED STOCK',
      bgColor: Color(0xFF7C3AED),
      textColor: Colors.white,
    ),
    PosterStickerData(
      id: 'verified',
      label: '100% ORIGINAL ✔',
      bgColor: Color(0xFF0F172A),
      textColor: Color(0xFFFFD54F),
    ),
  ];

  static PosterThemePalette getTheme(String id) {
    return colorThemes.firstWhere(
      (t) => t.id == id,
      orElse: () => colorThemes.first,
    );
  }

  static PosterTemplateInfo getTemplate(String id) {
    return templates.firstWhere(
      (t) => t.id == id,
      orElse: () => templates.first,
    );
  }
}
