class DocumentItem {
  String product;
  double price;
  double qty;
  String unit;
  double gst;
  String hsn;

  DocumentItem({
    required this.product,
    required this.price,
    this.qty = 1.0,
    this.unit = 'Pcs',
    this.gst = 0.0,
    this.hsn = '',
  });

  double get amount => price * qty;
  double get taxAmount => amount * (gst / 100);
  double get totalWithTax => amount + taxAmount;

  factory DocumentItem.fromJson(Map<String, dynamic> json) {
    return DocumentItem(
      product: json['name']?.toString() ?? json['product']?.toString() ?? '',
      price: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      qty: (json['quantity'] is num)
          ? (json['quantity'] as num).toDouble()
          : (json['qty'] is num)
          ? (json['qty'] as num).toDouble()
          : double.tryParse(
                  json['quantity']?.toString() ??
                      json['qty']?.toString() ??
                      '1',
                ) ??
                1.0,
      unit: json['unit']?.toString() ?? 'Pcs',
      gst: (json['gst'] is num)
          ? (json['gst'] as num).toDouble()
          : double.tryParse(json['gst']?.toString() ?? '0') ?? 0.0,
      hsn: json['hsn']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': product,
      'quantity': qty,
      'price': price,
      'unit': unit,
      'gst': gst,
      'hsn': hsn,
      'amount': amount,
    };
  }
}

class QuotationModel {
  final String id;
  final String estimateId;
  final String? vendorCompanyName;
  final String? vendorCompanyId;
  final String? customerName;
  final String? customerPhone;
  final String? customerEmail;
  final String? customerAddress;
  final String? customerCity;
  final String? customerGstNo;
  final List<DocumentItem> items;
  final double subtotal;
  final double taxAmount;
  final double totalAmount;
  final double discount;
  final String? date;
  final String? notes;
  final bool isFavorite;

  QuotationModel({
    required this.id,
    required this.estimateId,
    this.vendorCompanyName,
    this.vendorCompanyId,
    this.customerName,
    this.customerPhone,
    this.customerEmail,
    this.customerAddress,
    this.customerCity,
    this.customerGstNo,
    this.items = const [],
    this.subtotal = 0.0,
    this.taxAmount = 0.0,
    this.totalAmount = 0.0,
    this.discount = 0.0,
    this.date,
    this.notes,
    this.isFavorite = false,
  });

  String? get customerCompanyName => customerName;

  QuotationModel copyWith({
    String? id,
    String? estimateId,
    String? vendorCompanyName,
    String? vendorCompanyId,
    String? customerName,
    String? customerPhone,
    String? customerEmail,
    String? customerAddress,
    String? customerCity,
    String? customerGstNo,
    List<DocumentItem>? items,
    double? subtotal,
    double? taxAmount,
    double? totalAmount,
    double? discount,
    String? date,
    String? notes,
    bool? isFavorite,
  }) {
    return QuotationModel(
      id: id ?? this.id,
      estimateId: estimateId ?? this.estimateId,
      vendorCompanyName: vendorCompanyName ?? this.vendorCompanyName,
      vendorCompanyId: vendorCompanyId ?? this.vendorCompanyId,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      customerEmail: customerEmail ?? this.customerEmail,
      customerAddress: customerAddress ?? this.customerAddress,
      customerCity: customerCity ?? this.customerCity,
      customerGstNo: customerGstNo ?? this.customerGstNo,
      items: items ?? this.items,
      subtotal: subtotal ?? this.subtotal,
      taxAmount: taxAmount ?? this.taxAmount,
      totalAmount: totalAmount ?? this.totalAmount,
      discount: discount ?? this.discount,
      date: date ?? this.date,
      notes: notes ?? this.notes,
      isFavorite: isFavorite ?? this.isFavorite,
    );
  }

  factory QuotationModel.fromJson(Map<String, dynamic> json) {
    // 1. Parse products / items
    final rawProducts = json['products'] is List
        ? (json['products'] as List)
        : (json['items'] is List ? (json['items'] as List) : []);
    final itemsList = rawProducts
        .map((e) => DocumentItem.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();

    // 2. Parse company info
    String? compName;
    String? compId;
    if (json['company_id'] is List && (json['company_id'] as List).isNotEmpty) {
      final firstComp = (json['company_id'] as List).first;
      if (firstComp is Map) {
        compName = firstComp['name']?.toString();
        compId = firstComp['_id']?.toString() ?? firstComp['id']?.toString();
      } else if (firstComp is String) {
        compId = firstComp;
      }
    } else if (json['vendorCompany'] is Map) {
      compName = json['vendorCompany']['name']?.toString();
      compId = json['vendorCompany']['_id']?.toString();
    } else if (json['companyName'] != null) {
      compName = json['companyName']?.toString();
    }

    // 3. Parse customer info
    String? custName;
    String? custPhone;
    String? custEmail;
    String? custAddress;
    String? custCity;
    String? custGstNo;
    if (json['customers'] is List && (json['customers'] as List).isNotEmpty) {
      final firstCust = (json['customers'] as List).first;
      if (firstCust is Map) {
        custName = firstCust['name']?.toString();
        custPhone =
            firstCust['phoneNumber']?.toString() ??
            firstCust['phone']?.toString();
        custEmail = firstCust['email']?.toString();
        custAddress = firstCust['address']?.toString();
        custCity = firstCust['city']?.toString();
        custGstNo = firstCust['gstNo']?.toString();
      }
    } else if (json['customerCompany'] is Map) {
      custName = json['customerCompany']['name']?.toString();
      custPhone = json['customerCompany']['phone']?.toString();
    } else if (json['customerName'] != null) {
      custName = json['customerName']?.toString();
    }

    // 4. Calculations
    double calcSubtotal = 0.0;
    double calcTax = 0.0;
    for (final item in itemsList) {
      calcSubtotal += item.amount;
      calcTax += item.taxAmount;
    }

    double finalTotal = (json['total'] is num)
        ? (json['total'] as num).toDouble()
        : (json['totalAmount'] is num)
        ? (json['totalAmount'] as num).toDouble()
        : (calcSubtotal + calcTax);

    return QuotationModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      estimateId:
          json['estimateID']?.toString() ??
          json['estimateId']?.toString() ??
          json['quotationId']?.toString() ??
          'EST-001',
      vendorCompanyName: compName,
      vendorCompanyId: compId,
      customerName: custName ?? 'Valued Customer',
      customerPhone: custPhone,
      customerEmail: custEmail,
      customerAddress: custAddress,
      customerCity: custCity,
      customerGstNo: custGstNo,
      items: itemsList,
      subtotal: calcSubtotal,
      taxAmount: calcTax,
      totalAmount: finalTotal,
      discount: (json['discount'] is num)
          ? (json['discount'] as num).toDouble()
          : 0.0,
      date: json['createdAt']?.toString() ?? json['date']?.toString(),
      notes: json['notes']?.toString(),
      isFavorite: json['isHeart'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'estimateID': estimateId,
      'company_id': vendorCompanyId != null && vendorCompanyId!.isNotEmpty
          ? [vendorCompanyId]
          : [],
      'customers': [
        {
          'name': customerName ?? 'Valued Customer',
          'phoneNumber': customerPhone ?? '',
          'email': customerEmail ?? '',
          'address': customerAddress ?? '',
          'city': customerCity ?? '',
          'gstNo': customerGstNo ?? '',
        },
      ],
      'products': items.map((e) => e.toJson()).toList(),
    };
  }
}
