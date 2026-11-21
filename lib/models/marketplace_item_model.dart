class MarketplaceItemModel {
  final String id;
  final String title;
  final String category;
  final String? subcategory;
  final double price;
  final String image;
  final bool isVideo;
  final String condition;
  final String location;
  final String timeAgo;
  final int likesCount;
  final int dislikesCount;
  final int viewsCount;
  final double averageRating;
  final int ratingsCount;
  final bool isFavorite;
  final bool isSold;
  final String? description;
  final String phone;
  final String whatsapp;
  final String companyName;
  final String? companyLogo;
  final String? companyAddress;
  final String? companyCity;
  final String? companyGst;
  final String? sellerName;
  final String? createdAt;

  MarketplaceItemModel({
    required this.id,
    required this.title,
    required this.category,
    this.subcategory,
    required this.price,
    required this.image,
    this.isVideo = false,
    this.condition = 'Brand New',
    this.location = 'India',
    this.timeAgo = 'Recently',
    this.likesCount = 0,
    this.dislikesCount = 0,
    this.viewsCount = 0,
    this.averageRating = 5.0,
    this.ratingsCount = 0,
    this.isFavorite = false,
    this.isSold = false,
    this.description,
    this.phone = '9092024444',
    this.whatsapp = '9092024444',
    this.companyName = 'ReNote Merchant',
    this.companyLogo,
    this.companyAddress,
    this.companyCity,
    this.companyGst,
    this.sellerName,
    this.createdAt,
  });

  factory MarketplaceItemModel.fromJson(Map<String, dynamic> json) {
    // Resolve Title
    final title =
        json['title']?.toString() ??
        json['marketplaceTitle']?.toString() ??
        json['poster_title']?.toString() ??
        json['product_name']?.toString() ??
        json['poster_name']?.toString() ??
        'Featured Product';

    // Resolve Category
    final category =
        json['category']?.toString() ??
        json['marketplaceCategory']?.toString() ??
        json['templateCategory']?.toString() ??
        'General';

    // Resolve Price
    double parsedPrice = 0.0;
    final rawPrice =
        json['price'] ?? json['marketplacePrice'] ?? json['product_price'];
    if (rawPrice is num) {
      parsedPrice = rawPrice.toDouble();
    } else if (rawPrice != null) {
      parsedPrice = double.tryParse(rawPrice.toString()) ?? 0.0;
    }

    // Resolve Image
    final image =
        json['image']?.toString() ??
        json['product_image']?.toString() ??
        json['company_logo']?.toString() ??
        '';

    // Resolve Company & Seller info
    String cName = 'ReNote Merchant';
    String? cLogo;
    String? cAddress;
    String? cCity;
    String? cGst;
    String cPhone = '9092024444';

    if (json['company_id'] is Map) {
      final comp = json['company_id'] as Map;
      if (comp['name'] != null) cName = comp['name'].toString();
      if (comp['logo'] != null) cLogo = comp['logo'].toString();
      if (comp['address'] != null) cAddress = comp['address'].toString();
      if (comp['city'] != null) cCity = comp['city'].toString();
      if (comp['gstNo'] != null) cGst = comp['gstNo'].toString();
      if (comp['phone'] != null) cPhone = comp['phone'].toString();
    } else if (json['companyName'] != null) {
      cName = json['companyName'].toString();
      cLogo = json['companyLogo']?.toString();
    }

    String? sName;
    if (json['user_id'] is Map) {
      final u = json['user_id'] as Map;
      final f = u['firstName']?.toString() ?? '';
      final l = u['lastName']?.toString() ?? '';
      final full = '$f $l'.trim();
      if (full.isNotEmpty) sName = full;
      if (cPhone == '9092024444' && u['phoneNumber'] != null) {
        cPhone = u['phoneNumber'].toString();
      }
    }

    // Contact info
    final phone =
        json['phone']?.toString() ?? json['contactPhone']?.toString() ?? cPhone;
    final whatsapp =
        json['whatsapp']?.toString() ??
        json['whatsappNumber']?.toString() ??
        phone;

    // Resolve Location
    final location =
        json['location']?.toString() ??
        json['marketplaceCity']?.toString() ??
        cCity ??
        'India';

    // Time Ago calculation
    String timeString = json['timeAgo']?.toString() ?? '';
    if (timeString.isEmpty && json['createdAt'] != null) {
      try {
        final dt = DateTime.parse(json['createdAt'].toString());
        final diff = DateTime.now().difference(dt);
        if (diff.inDays > 0) {
          timeString = '${diff.inDays}d ago';
        } else if (diff.inHours > 0) {
          timeString = '${diff.inHours}h ago';
        } else if (diff.inMinutes > 0) {
          timeString = '${diff.inMinutes}m ago';
        } else {
          timeString = 'Just now';
        }
      } catch (_) {
        timeString = 'Recently';
      }
    }
    if (timeString.isEmpty) timeString = 'Recently';

    return MarketplaceItemModel(
      id:
          json['_id']?.toString() ??
          json['id']?.toString() ??
          json['posterId']?.toString() ??
          '',
      title: title,
      category: category,
      subcategory:
          json['subcategory']?.toString() ??
          json['marketplaceSubcategory']?.toString(),
      price: parsedPrice,
      image: image,
      isVideo: json['isVideo'] == true,
      condition: json['condition']?.toString() ?? 'Brand New',
      location: location,
      timeAgo: timeString,
      likesCount: (json['likesCount'] as num?)?.toInt() ?? 0,
      dislikesCount: (json['dislikesCount'] as num?)?.toInt() ?? 0,
      viewsCount: (json['viewsCount'] as num?)?.toInt() ?? 0,
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 5.0,
      ratingsCount: (json['ratingsCount'] as num?)?.toInt() ?? 0,
      isFavorite: json['isFavorite'] == true,
      isSold: json['isSold'] == true,
      description:
          json['description']?.toString() ??
          json['marketplaceDescription']?.toString() ??
          json['product_description']?.toString(),
      phone: phone,
      whatsapp: whatsapp,
      companyName: cName,
      companyLogo: cLogo,
      companyAddress: cAddress,
      companyCity: cCity,
      companyGst: cGst,
      sellerName: sName,
      createdAt:
          json['createdAt']?.toString() ?? json['publishedAt']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'category': category,
      if (subcategory != null) 'subcategory': subcategory,
      'price': price,
      'image': image,
      'isVideo': isVideo,
      'condition': condition,
      'location': location,
      'timeAgo': timeAgo,
      'likesCount': likesCount,
      'dislikesCount': dislikesCount,
      'viewsCount': viewsCount,
      'averageRating': averageRating,
      'ratingsCount': ratingsCount,
      'isFavorite': isFavorite,
      'isSold': isSold,
      if (description != null) 'description': description,
      'phone': phone,
      'whatsapp': whatsapp,
      'companyName': companyName,
      if (companyLogo != null) 'companyLogo': companyLogo,
      if (companyAddress != null) 'companyAddress': companyAddress,
      if (companyCity != null) 'companyCity': companyCity,
      if (companyGst != null) 'companyGst': companyGst,
      if (sellerName != null) 'sellerName': sellerName,
      if (createdAt != null) 'createdAt': createdAt,
    };
  }

  MarketplaceItemModel copyWith({
    String? id,
    String? title,
    String? category,
    String? subcategory,
    double? price,
    String? image,
    bool? isVideo,
    String? condition,
    String? location,
    String? timeAgo,
    int? likesCount,
    int? dislikesCount,
    int? viewsCount,
    double? averageRating,
    int? ratingsCount,
    bool? isFavorite,
    bool? isSold,
    String? description,
    String? phone,
    String? whatsapp,
    String? companyName,
    String? companyLogo,
    String? companyAddress,
    String? companyCity,
    String? companyGst,
    String? sellerName,
    String? createdAt,
  }) {
    return MarketplaceItemModel(
      id: id ?? this.id,
      title: title ?? this.title,
      category: category ?? this.category,
      subcategory: subcategory ?? this.subcategory,
      price: price ?? this.price,
      image: image ?? this.image,
      isVideo: isVideo ?? this.isVideo,
      condition: condition ?? this.condition,
      location: location ?? this.location,
      timeAgo: timeAgo ?? this.timeAgo,
      likesCount: likesCount ?? this.likesCount,
      dislikesCount: dislikesCount ?? this.dislikesCount,
      viewsCount: viewsCount ?? this.viewsCount,
      averageRating: averageRating ?? this.averageRating,
      ratingsCount: ratingsCount ?? this.ratingsCount,
      isFavorite: isFavorite ?? this.isFavorite,
      isSold: isSold ?? this.isSold,
      description: description ?? this.description,
      phone: phone ?? this.phone,
      whatsapp: whatsapp ?? this.whatsapp,
      companyName: companyName ?? this.companyName,
      companyLogo: companyLogo ?? this.companyLogo,
      companyAddress: companyAddress ?? this.companyAddress,
      companyCity: companyCity ?? this.companyCity,
      companyGst: companyGst ?? this.companyGst,
      sellerName: sellerName ?? this.sellerName,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
