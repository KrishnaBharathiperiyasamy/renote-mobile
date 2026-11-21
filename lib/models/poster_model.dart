class PosterModel {
  final String id;
  final String posterId;
  final String posterName;
  final String posterTitle;
  final String productName;
  final String? productDescription;
  final double? productPrice;
  final String? productImage;
  final String? companyLogo;
  final String? companyId;
  final String template;
  final String templateCategory;
  final String colorThemeId;
  final String bgTypeId;
  final String? customBgColor;
  final String fontFamilyId;
  final String? fontColor;
  final String aspectRatio;
  final double logoZoom;
  final double productZoom;
  final double logoPositionX;
  final double logoPositionY;
  final double productPositionX;
  final double productPositionY;
  final List<Map<String, dynamic>> stickers;
  final bool isFavorite;
  final String? createdAt;

  PosterModel({
    required this.id,
    required this.posterId,
    required this.posterName,
    required this.posterTitle,
    required this.productName,
    this.productDescription,
    this.productPrice,
    this.productImage,
    this.companyLogo,
    this.companyId,
    this.template = 'frame1',
    this.templateCategory = 'Classic',
    this.colorThemeId = 'flame-orange',
    this.bgTypeId = 'clean-white',
    this.customBgColor,
    this.fontFamilyId = 'sans',
    this.fontColor,
    this.aspectRatio = '3:4',
    this.logoZoom = 1.0,
    this.productZoom = 1.0,
    this.logoPositionX = 0.0,
    this.logoPositionY = 0.0,
    this.productPositionX = 0.0,
    this.productPositionY = 0.0,
    this.stickers = const [],
    this.isFavorite = false,
    this.createdAt,
  });

  factory PosterModel.fromJson(Map<String, dynamic> json) {
    // Parse logo position
    double logoX = 0.0;
    double logoY = 0.0;
    if (json['logo_position'] is Map) {
      logoX = (json['logo_position']['x'] as num?)?.toDouble() ?? 0.0;
      logoY = (json['logo_position']['y'] as num?)?.toDouble() ?? 0.0;
    }

    // Parse product position
    double prodX = 0.0;
    double prodY = 0.0;
    if (json['product_position'] is Map) {
      prodX = (json['product_position']['x'] as num?)?.toDouble() ?? 0.0;
      prodY = (json['product_position']['y'] as num?)?.toDouble() ?? 0.0;
    }

    // Parse stickers
    final rawStickers = json['stickers'] is List
        ? (json['stickers'] as List)
        : [];
    final stickersList = rawStickers
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();

    return PosterModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      posterId: json['posterId']?.toString() ?? 'POS-1',
      posterName:
          json['poster_name']?.toString() ??
          json['poster_title']?.toString() ??
          'Untitled Poster',
      posterTitle:
          json['poster_title']?.toString() ??
          json['poster_name']?.toString() ??
          'SPECIAL OFFER',
      productName: json['product_name']?.toString() ?? 'Featured Product',
      productDescription: json['product_description']?.toString(),
      productPrice: (json['product_price'] is num)
          ? (json['product_price'] as num).toDouble()
          : double.tryParse(json['product_price']?.toString() ?? ''),
      productImage: json['product_image']?.toString(),
      companyLogo: json['company_logo']?.toString(),
      companyId: json['company_id'] is Map
          ? json['company_id']['_id']?.toString()
          : json['company_id']?.toString(),
      template: json['template']?.toString() ?? 'frame1',
      templateCategory: json['templateCategory']?.toString() ?? 'Classic',
      colorThemeId: json['colorThemeId']?.toString() ?? 'flame-orange',
      bgTypeId: json['bgTypeId']?.toString() ?? 'clean-white',
      customBgColor: json['customBgColor']?.toString(),
      fontFamilyId: json['fontFamilyId']?.toString() ?? 'sans',
      fontColor: json['fontColor']?.toString(),
      aspectRatio: json['aspect_ratio']?.toString() ?? '3:4',
      logoZoom: (json['logo_zoom'] is num)
          ? (json['logo_zoom'] as num).toDouble()
          : 1.0,
      productZoom: (json['product_zoom'] is num)
          ? (json['product_zoom'] as num).toDouble()
          : 1.0,
      logoPositionX: logoX,
      logoPositionY: logoY,
      productPositionX: prodX,
      productPositionY: prodY,
      stickers: stickersList,
      isFavorite: json['isHeart'] == true,
      createdAt: json['createdAt']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (posterId.isNotEmpty) 'posterId': posterId,
      'poster_title': posterTitle,
      'poster_name': posterName,
      'product_name': productName,
      if (productDescription != null) 'product_description': productDescription,
      if (productPrice != null) 'product_price': productPrice,
      if (productImage != null) 'product_image': productImage,
      if (companyLogo != null) 'company_logo': companyLogo,
      if (companyId != null && companyId!.isNotEmpty) 'company_id': companyId,
      'template': template,
      'templateCategory': templateCategory,
      'colorThemeId': colorThemeId,
      'bgTypeId': bgTypeId,
      if (customBgColor != null) 'customBgColor': customBgColor,
      'fontFamilyId': fontFamilyId,
      if (fontColor != null) 'fontColor': fontColor,
      'aspect_ratio': aspectRatio,
      'logo_zoom': logoZoom,
      'product_zoom': productZoom,
      'logo_position': {'x': logoPositionX, 'y': logoPositionY},
      'product_position': {'x': productPositionX, 'y': productPositionY},
      'stickers': stickers,
    };
  }

  PosterModel copyWith({
    String? id,
    String? posterId,
    String? posterName,
    String? posterTitle,
    String? productName,
    String? productDescription,
    double? productPrice,
    String? productImage,
    String? companyLogo,
    String? companyId,
    String? template,
    String? templateCategory,
    String? colorThemeId,
    String? bgTypeId,
    String? customBgColor,
    String? fontFamilyId,
    String? fontColor,
    String? aspectRatio,
    double? logoZoom,
    double? productZoom,
    double? logoPositionX,
    double? logoPositionY,
    double? productPositionX,
    double? productPositionY,
    List<Map<String, dynamic>>? stickers,
    bool? isFavorite,
    String? createdAt,
  }) {
    return PosterModel(
      id: id ?? this.id,
      posterId: posterId ?? this.posterId,
      posterName: posterName ?? this.posterName,
      posterTitle: posterTitle ?? this.posterTitle,
      productName: productName ?? this.productName,
      productDescription: productDescription ?? this.productDescription,
      productPrice: productPrice ?? this.productPrice,
      productImage: productImage ?? this.productImage,
      companyLogo: companyLogo ?? this.companyLogo,
      companyId: companyId ?? this.companyId,
      template: template ?? this.template,
      templateCategory: templateCategory ?? this.templateCategory,
      colorThemeId: colorThemeId ?? this.colorThemeId,
      bgTypeId: bgTypeId ?? this.bgTypeId,
      customBgColor: customBgColor ?? this.customBgColor,
      fontFamilyId: fontFamilyId ?? this.fontFamilyId,
      fontColor: fontColor ?? this.fontColor,
      aspectRatio: aspectRatio ?? this.aspectRatio,
      logoZoom: logoZoom ?? this.logoZoom,
      productZoom: productZoom ?? this.productZoom,
      logoPositionX: logoPositionX ?? this.logoPositionX,
      logoPositionY: logoPositionY ?? this.logoPositionY,
      productPositionX: productPositionX ?? this.productPositionX,
      productPositionY: productPositionY ?? this.productPositionY,
      stickers: stickers ?? this.stickers,
      isFavorite: isFavorite ?? this.isFavorite,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
