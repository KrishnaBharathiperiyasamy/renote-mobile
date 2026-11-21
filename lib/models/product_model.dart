class ProductModel {
  final String id;
  final String name;
  final double price;
  final double qty;
  final String unit;
  final double gst;
  final String? hsn;
  final String? description;
  final String? companyId;
  final bool isFavorite;
  final String? image;
  final String? createdAt;

  ProductModel({
    required this.id,
    required this.name,
    required this.price,
    this.qty = 1.0,
    this.unit = 'pcs',
    this.gst = 0.0,
    this.hsn,
    this.description,
    this.companyId,
    this.isFavorite = false,
    this.image,
    this.createdAt,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unnamed Product',
      price: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      qty: (json['qty'] is num)
          ? (json['qty'] as num).toDouble()
          : double.tryParse(json['qty']?.toString() ?? '1') ?? 1.0,
      unit: json['unit']?.toString() ?? 'pcs',
      gst: (json['gst'] is num)
          ? (json['gst'] as num).toDouble()
          : double.tryParse(json['gst']?.toString() ?? '0') ?? 0.0,
      hsn: json['hsn']?.toString(),
      description: json['description']?.toString(),
      companyId:
          json['companyId']?.toString() ?? json['company_id']?.toString(),
      isFavorite: json['isHeart'] == true,
      image: json['image']?.toString() ?? json['product_image']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }

  ProductModel copyWith({
    String? id,
    String? name,
    double? price,
    double? qty,
    String? unit,
    double? gst,
    String? hsn,
    String? description,
    String? companyId,
    bool? isFavorite,
    String? image,
    String? createdAt,
  }) {
    return ProductModel(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
      qty: qty ?? this.qty,
      unit: unit ?? this.unit,
      gst: gst ?? this.gst,
      hsn: hsn ?? this.hsn,
      description: description ?? this.description,
      companyId: companyId ?? this.companyId,
      isFavorite: isFavorite ?? this.isFavorite,
      image: image ?? this.image,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toJson({required String companyId}) {
    return {
      'companyId': this.companyId ?? companyId,
      'name': name,
      'price': price,
      'qty': qty,
      'unit': unit,
      'gst': gst,
      'hsn': hsn ?? '',
      'description': description ?? '',
    };
  }
}
