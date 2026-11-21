import 'quotation_model.dart';

const Map<String, String> _gstStateCodes = {
  "01": "jammu and kashmir",
  "02": "himachal pradesh",
  "03": "punjab",
  "04": "chandigarh",
  "05": "uttarakhand",
  "06": "haryana",
  "07": "delhi",
  "08": "rajasthan",
  "09": "uttar pradesh",
  "10": "bihar",
  "11": "sikkim",
  "12": "arunachal pradesh",
  "13": "nagaland",
  "14": "manipur",
  "15": "mizoram",
  "16": "tripura",
  "17": "meghalaya",
  "18": "assam",
  "19": "west bengal",
  "20": "jharkhand",
  "21": "odisha",
  "22": "chhattisgarh",
  "23": "madhya pradesh",
  "24": "gujarat",
  "25": "daman and diu",
  "26": "dadra and nagar haveli",
  "27": "maharashtra",
  "29": "karnataka",
  "30": "goa",
  "31": "lakshadweep",
  "32": "kerala",
  "33": "tamil nadu",
  "34": "puducherry",
  "35": "andaman and nicobar islands",
  "36": "telangana",
  "37": "andhra pradesh",
  "38": "ladakh",
};

String extractGstStateCode(
  String? gstNo,
  String? stateText,
  String? addressText,
) {
  final gst = (gstNo ?? '').trim();
  if (gst.length >= 2 && RegExp(r'^\d{2}').hasMatch(gst)) {
    return gst.substring(0, 2);
  }
  final state = (stateText ?? '').trim().toLowerCase();
  if (state.isNotEmpty) {
    for (final entry in _gstStateCodes.entries) {
      if (state.contains(entry.value) || entry.value.contains(state)) {
        return entry.key;
      }
    }
    return state;
  }
  final combined = (addressText ?? '').trim().toLowerCase();
  for (final entry in _gstStateCodes.entries) {
    if (combined.contains(entry.value)) {
      return entry.key;
    }
  }
  return '';
}

String numberToWordsIndian(double numVal) {
  if (numVal.isNaN || numVal <= 0) return 'Zero Rupees Only';
  final rupees = numVal.floor();
  final paise = ((numVal - numVal.floor()) * 100).round();

  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  String inWords(int n) {
    if (n < 20) return a[n];
    if (n < 100) return '${b[n ~/ 10]}${n % 10 != 0 ? ' ${a[n % 10]}' : ''}';
    if (n < 1000) {
      return '${a[n ~/ 100]} Hundred${n % 100 != 0 ? ' ${inWords(n % 100)}' : ''}';
    }
    if (n < 100000) {
      return '${inWords(n ~/ 1000)} Thousand${n % 1000 != 0 ? ' ${inWords(n % 1000)}' : ''}';
    }
    if (n < 10000000) {
      return '${inWords(n ~/ 100000)} Lakh${n % 100000 != 0 ? ' ${inWords(n % 100000)}' : ''}';
    }
    return '${inWords(n ~/ 10000000)} Crore${n % 10000000 != 0 ? ' ${inWords(n % 10000000)}' : ''}';
  }

  var result = '${inWords(rupees)} Rupees';
  if (paise > 0) {
    result += ' and ${inWords(paise)} Paise';
  }
  return '$result Only';
}

class InvoiceModel {
  final String id;
  final String invoiceId;
  final String? vendorCompanyName;
  final String? vendorCompanyId;
  final String? vendorGstNo;
  final String? vendorState;
  final String? customerName;
  final String? customerPhone;
  final String? customerEmail;
  final String? customerAddress;
  final String? customerCity;
  final String? customerState;
  final String? customerGstNo;
  final List<DocumentItem> items;
  final double subtotal;
  final double taxAmount;
  final double totalAmount;
  final double discount;
  final String status;
  final String? dueDate;
  final String? date;
  final String? notes;
  final bool isFavorite;

  InvoiceModel({
    required this.id,
    required this.invoiceId,
    this.vendorCompanyName,
    this.vendorCompanyId,
    this.vendorGstNo,
    this.vendorState,
    this.customerName,
    this.customerPhone,
    this.customerEmail,
    this.customerAddress,
    this.customerCity,
    this.customerState,
    this.customerGstNo,
    this.items = const [],
    this.subtotal = 0.0,
    this.taxAmount = 0.0,
    this.totalAmount = 0.0,
    this.discount = 0.0,
    this.status = 'Pending',
    this.dueDate,
    this.date,
    this.notes,
    this.isFavorite = false,
  });

  bool get isPaid => status.toLowerCase() == 'paid';
  String? get customerCompanyName => customerName;

  bool get isInterState {
    final fromCode = extractGstStateCode(vendorGstNo, vendorState, null);
    final toCode = extractGstStateCode(
      customerGstNo,
      customerState,
      customerAddress,
    );
    return fromCode.isNotEmpty && toCode.isNotEmpty && fromCode != toCode;
  }

  double get cgstAmount => isInterState ? 0.0 : taxAmount / 2;
  double get sgstAmount => isInterState ? 0.0 : taxAmount / 2;
  double get igstAmount => isInterState ? taxAmount : 0.0;
  double get roundOff => totalAmount - (subtotal + taxAmount);
  String get amountInWords => numberToWordsIndian(totalAmount);

  InvoiceModel copyWith({
    String? id,
    String? invoiceId,
    String? vendorCompanyName,
    String? vendorCompanyId,
    String? vendorGstNo,
    String? vendorState,
    String? customerName,
    String? customerPhone,
    String? customerEmail,
    String? customerAddress,
    String? customerCity,
    String? customerState,
    String? customerGstNo,
    List<DocumentItem>? items,
    double? subtotal,
    double? taxAmount,
    double? totalAmount,
    double? discount,
    String? status,
    String? dueDate,
    String? date,
    String? notes,
    bool? isFavorite,
  }) {
    return InvoiceModel(
      id: id ?? this.id,
      invoiceId: invoiceId ?? this.invoiceId,
      vendorCompanyName: vendorCompanyName ?? this.vendorCompanyName,
      vendorCompanyId: vendorCompanyId ?? this.vendorCompanyId,
      vendorGstNo: vendorGstNo ?? this.vendorGstNo,
      vendorState: vendorState ?? this.vendorState,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      customerEmail: customerEmail ?? this.customerEmail,
      customerAddress: customerAddress ?? this.customerAddress,
      customerCity: customerCity ?? this.customerCity,
      customerState: customerState ?? this.customerState,
      customerGstNo: customerGstNo ?? this.customerGstNo,
      items: items ?? this.items,
      subtotal: subtotal ?? this.subtotal,
      taxAmount: taxAmount ?? this.taxAmount,
      totalAmount: totalAmount ?? this.totalAmount,
      discount: discount ?? this.discount,
      status: status ?? this.status,
      dueDate: dueDate ?? this.dueDate,
      date: date ?? this.date,
      notes: notes ?? this.notes,
      isFavorite: isFavorite ?? this.isFavorite,
    );
  }

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
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
    String? compGst;
    String? compState;
    if (json['company_id'] is List && (json['company_id'] as List).isNotEmpty) {
      final firstComp = (json['company_id'] as List).first;
      if (firstComp is Map) {
        compName = firstComp['name']?.toString();
        compId = firstComp['_id']?.toString() ?? firstComp['id']?.toString();
        compGst = firstComp['gstNo']?.toString();
        compState = firstComp['state']?.toString();
      } else if (firstComp is String) {
        compId = firstComp;
      }
    } else if (json['company'] is Map) {
      compName = json['company']['name']?.toString();
      compId = json['company']['_id']?.toString();
      compGst = json['company']['gstNo']?.toString();
      compState = json['company']['state']?.toString();
    } else if (json['vendorCompany'] is Map) {
      compName = json['vendorCompany']['name']?.toString();
      compId = json['vendorCompany']['_id']?.toString();
      compGst = json['vendorCompany']['gstNo']?.toString();
      compState = json['vendorCompany']['state']?.toString();
    } else if (json['companyName'] != null) {
      compName = json['companyName']?.toString();
    }

    // 3. Parse customer info
    String? custName;
    String? custPhone;
    String? custEmail;
    String? custAddress;
    String? custCity;
    String? custState;
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
        custState = firstCust['state']?.toString();
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

    return InvoiceModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      invoiceId:
          json['invoiceID']?.toString() ??
          json['invoiceId']?.toString() ??
          json['invoiceNumber']?.toString() ??
          'I/26-27/0001',
      vendorCompanyName: compName,
      vendorCompanyId: compId,
      vendorGstNo: compGst,
      vendorState: compState,
      customerName: custName ?? 'Valued Customer',
      customerPhone: custPhone,
      customerEmail: custEmail,
      customerAddress: custAddress,
      customerCity: custCity,
      customerState: custState,
      customerGstNo: custGstNo,
      items: itemsList,
      subtotal: calcSubtotal,
      taxAmount: calcTax,
      totalAmount: finalTotal,
      discount: (json['discount'] is num)
          ? (json['discount'] as num).toDouble()
          : 0.0,
      status: json['status']?.toString() ?? 'Pending',
      dueDate: json['dueDate']?.toString(),
      date: json['createdAt']?.toString() ?? json['date']?.toString(),
      notes: json['notes']?.toString(),
      isFavorite: json['isHeart'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'invoiceID': invoiceId,
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
          'state': customerState ?? '',
          'gstNo': customerGstNo ?? '',
        },
      ],
      'products': items.map((e) => e.toJson()).toList(),
      'status': status,
      'dueDate': dueDate,
    };
  }
}
