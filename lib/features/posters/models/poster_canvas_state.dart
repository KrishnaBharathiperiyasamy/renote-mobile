import 'package:flutter/material.dart';

import '../../../models/poster_model.dart';
import 'poster_template_data.dart';

class CanvasStickerItem {
  final String id;
  final String stickerTypeId;
  final String label;
  final Color bgColor;
  final Color textColor;
  double x; // percentage -0.5 to 0.5 relative to canvas center
  double y; // percentage -0.5 to 0.5 relative to canvas center
  double scale;
  double rotation; // radians

  CanvasStickerItem({
    required this.id,
    required this.stickerTypeId,
    required this.label,
    required this.bgColor,
    required this.textColor,
    this.x = 0.0,
    this.y = 0.0,
    this.scale = 1.0,
    this.rotation = 0.0,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'stickerTypeId': stickerTypeId,
    'label': label,
    'bgColor': bgColor.toARGB32(),
    'textColor': textColor.toARGB32(),
    'x': x,
    'y': y,
    'scale': scale,
    'rotation': rotation,
  };

  factory CanvasStickerItem.fromJson(Map<String, dynamic> json) {
    Color parseColor(dynamic c, Color fallback) {
      if (c is int) return Color(c);
      if (c is String) {
        final hex = c.replaceFirst('#', '');
        final val = int.tryParse(hex, radix: 16);
        if (val != null) {
          return hex.length <= 6 ? Color(0xFF000000 | val) : Color(val);
        }
      }
      return fallback;
    }

    return CanvasStickerItem(
      id:
          json['id']?.toString() ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      stickerTypeId: json['stickerTypeId']?.toString() ?? 'sale',
      label: json['label']?.toString() ?? 'SALE',
      bgColor: parseColor(json['bgColor'], const Color(0xFFDC2626)),
      textColor: parseColor(json['textColor'], Colors.white),
      x: (json['x'] as num?)?.toDouble() ?? 0.0,
      y: (json['y'] as num?)?.toDouble() ?? 0.0,
      scale: (json['scale'] as num?)?.toDouble() ?? 1.0,
      rotation: (json['rotation'] as num?)?.toDouble() ?? 0.0,
    );
  }

  CanvasStickerItem clone() {
    return CanvasStickerItem(
      id: id,
      stickerTypeId: stickerTypeId,
      label: label,
      bgColor: bgColor,
      textColor: textColor,
      x: x,
      y: y,
      scale: scale,
      rotation: rotation,
    );
  }
}

class PosterEditorController extends ChangeNotifier {
  PosterModel _poster;
  List<CanvasStickerItem> _stickers = [];
  String? _selectedElementId;
  final List<PosterModel> _undoStack = [];
  final List<PosterModel> _redoStack = [];

  // Local image paths picked from device (null if using remote URL or none)
  String? _localProductImagePath;
  String? _localLogoPath;

  PosterEditorController({required PosterModel initialPoster})
    : _poster = initialPoster {
    _initStickers();
  }

  void _initStickers() {
    _stickers = _poster.stickers
        .map((s) => CanvasStickerItem.fromJson(s))
        .toList();
  }

  PosterModel get poster => _poster;
  List<CanvasStickerItem> get stickers => List.unmodifiable(_stickers);
  String? get selectedElementId => _selectedElementId;
  bool get canUndo => _undoStack.isNotEmpty;
  bool get canRedo => _redoStack.isNotEmpty;
  String? get localProductImagePath => _localProductImagePath;
  String? get localLogoPath => _localLogoPath;

  PosterThemePalette get currentTheme =>
      PosterDefinitions.getTheme(_poster.colorThemeId);
  PosterTemplateInfo get currentTemplate =>
      PosterDefinitions.getTemplate(_poster.template);

  void _recordHistory() {
    _undoStack.add(
      _poster.copyWith(stickers: _stickers.map((s) => s.toJson()).toList()),
    );
    _redoStack.clear();
  }

  void selectElement(String? id) {
    if (_selectedElementId != id) {
      _selectedElementId = id;
      notifyListeners();
    }
  }

  void undo() {
    if (!canUndo) return;
    final previous = _undoStack.removeLast();
    _redoStack.add(
      _poster.copyWith(stickers: _stickers.map((s) => s.toJson()).toList()),
    );
    _poster = previous;
    _initStickers();
    _selectedElementId = null;
    notifyListeners();
  }

  void redo() {
    if (!canRedo) return;
    final next = _redoStack.removeLast();
    _undoStack.add(
      _poster.copyWith(stickers: _stickers.map((s) => s.toJson()).toList()),
    );
    _poster = next;
    _initStickers();
    _selectedElementId = null;
    notifyListeners();
  }

  void setTemplate(String templateId, String category) {
    _recordHistory();
    _poster = _poster.copyWith(
      template: templateId,
      templateCategory: category,
    );
    notifyListeners();
  }

  void setColorTheme(String themeId) {
    _recordHistory();
    _poster = _poster.copyWith(colorThemeId: themeId);
    notifyListeners();
  }

  void setAspectRatio(String ratio) {
    _recordHistory();
    _poster = _poster.copyWith(aspectRatio: ratio);
    notifyListeners();
  }

  void setFontFamily(String fontId) {
    _recordHistory();
    _poster = _poster.copyWith(fontFamilyId: fontId);
    notifyListeners();
  }

  void updateTexts({
    String? posterTitle,
    String? posterName,
    String? productName,
    String? productDescription,
    double? productPrice,
    String? fontColor,
  }) {
    _recordHistory();
    _poster = _poster.copyWith(
      posterTitle: posterTitle ?? _poster.posterTitle,
      posterName: posterName ?? _poster.posterName,
      productName: productName ?? _poster.productName,
      productDescription: productDescription ?? _poster.productDescription,
      productPrice: productPrice ?? _poster.productPrice,
      fontColor: fontColor ?? _poster.fontColor,
    );
    notifyListeners();
  }

  void setProductImage({String? remoteUrl, String? localPath}) {
    _recordHistory();
    _localProductImagePath = localPath;
    _poster = _poster.copyWith(productImage: remoteUrl ?? localPath);
    notifyListeners();
  }

  void setCompanyLogo({String? remoteUrl, String? localPath}) {
    _recordHistory();
    _localLogoPath = localPath;
    _poster = _poster.copyWith(companyLogo: remoteUrl ?? localPath);
    notifyListeners();
  }

  void updateProductPosition(double dx, double dy) {
    _poster = _poster.copyWith(
      productPositionX: _poster.productPositionX + dx,
      productPositionY: _poster.productPositionY + dy,
    );
    notifyListeners();
  }

  void setProductZoom(double zoom) {
    _poster = _poster.copyWith(productZoom: zoom.clamp(0.2, 3.0));
    notifyListeners();
  }

  void updateLogoPosition(double dx, double dy) {
    _poster = _poster.copyWith(
      logoPositionX: _poster.logoPositionX + dx,
      logoPositionY: _poster.logoPositionY + dy,
    );
    notifyListeners();
  }

  void setLogoZoom(double zoom) {
    _poster = _poster.copyWith(logoZoom: zoom.clamp(0.2, 3.0));
    notifyListeners();
  }

  void addSticker(PosterStickerData stickerData) {
    _recordHistory();
    final newSticker = CanvasStickerItem(
      id: 'sticker_${DateTime.now().millisecondsSinceEpoch}',
      stickerTypeId: stickerData.id,
      label: stickerData.label,
      bgColor: stickerData.bgColor,
      textColor: stickerData.textColor,
      x: 0.0,
      y: 0.15,
      scale: 1.0,
    );
    _stickers.add(newSticker);
    _selectedElementId = newSticker.id;
    _poster = _poster.copyWith(
      stickers: _stickers.map((s) => s.toJson()).toList(),
    );
    notifyListeners();
  }

  void updateStickerPosition(String id, double dx, double dy) {
    final s = _stickers.firstWhere(
      (item) => item.id == id,
      orElse: () => _stickers.first,
    );
    s.x += dx;
    s.y += dy;
    _poster = _poster.copyWith(
      stickers: _stickers.map((e) => e.toJson()).toList(),
    );
    notifyListeners();
  }

  void updateStickerTransform(String id, {double? scale, double? rotation}) {
    final s = _stickers.firstWhere(
      (item) => item.id == id,
      orElse: () => _stickers.first,
    );
    if (scale != null) s.scale = scale.clamp(0.4, 2.5);
    if (rotation != null) s.rotation = rotation;
    _poster = _poster.copyWith(
      stickers: _stickers.map((e) => e.toJson()).toList(),
    );
    notifyListeners();
  }

  void removeSticker(String id) {
    _recordHistory();
    _stickers.removeWhere((s) => s.id == id);
    if (_selectedElementId == id) _selectedElementId = null;
    _poster = _poster.copyWith(
      stickers: _stickers.map((s) => s.toJson()).toList(),
    );
    notifyListeners();
  }

  PosterModel preparePosterForSave() {
    return _poster.copyWith(
      stickers: _stickers.map((s) => s.toJson()).toList(),
    );
  }
}
