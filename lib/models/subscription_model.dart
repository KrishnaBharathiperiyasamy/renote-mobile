import 'plan_model.dart';

class SubscriptionModel {
  final String id;
  final String userId;
  final String? planId;
  final String planName;
  final String planSlug;
  final double price;
  final String billing;
  final String status;
  final bool isActive;
  final bool isTrial;
  final String? startDate;
  final String? endDate;
  final String? currentPeriodStart;
  final String? currentPeriodEnd;
  final String renewalType;
  final String? razorpayPaymentId;
  final String? razorpaySubscriptionId;
  final String? createdAt;
  final PlanFeaturesModel features;

  const SubscriptionModel({
    required this.id,
    required this.userId,
    this.planId,
    required this.planName,
    required this.planSlug,
    this.price = 0.0,
    this.billing = 'monthly',
    this.status = 'active',
    this.isActive = true,
    this.isTrial = false,
    this.startDate,
    this.endDate,
    this.currentPeriodStart,
    this.currentPeriodEnd,
    this.renewalType = 'monthly',
    this.razorpayPaymentId,
    this.razorpaySubscriptionId,
    this.createdAt,
    this.features = const PlanFeaturesModel(),
  });

  factory SubscriptionModel.fromJson(Map<String, dynamic> json) {
    String pName = 'Free Plan';
    String pSlug = 'free';
    double pPrice = 0.0;
    String? pId;
    PlanFeaturesModel pFeatures = const PlanFeaturesModel();

    if (json['planId'] is Map) {
      final p = json['planId'] as Map;
      pName = p['name']?.toString() ?? 'Free Plan';
      pSlug =
          p['slug']?.toString() ??
          pName.toLowerCase().replaceAll(RegExp(r'\s+'), '');
      pPrice = (p['price'] as num?)?.toDouble() ?? 0.0;
      pId = p['_id']?.toString() ?? p['id']?.toString();
      if (p['features'] is Map) {
        pFeatures = PlanFeaturesModel.fromJson(
          Map<String, dynamic>.from(p['features']),
        );
      }
    } else if (json['planSlug'] != null) {
      pSlug = json['planSlug'].toString();
      pName = pSlug == 'unlimited'
          ? 'Unlimited Lifetime'
          : pSlug[0].toUpperCase() + pSlug.substring(1);
    }

    final rawEnd = json['endDate'] ?? json['currentPeriodEnd'];
    final rawStart = json['startDate'] ?? json['currentPeriodStart'];

    return SubscriptionModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      userId: json['userId'] is Map
          ? json['userId']['_id']?.toString() ?? ''
          : json['userId']?.toString() ?? '',
      planId: pId ?? json['planId']?.toString(),
      planName: pName,
      planSlug: pSlug,
      price: pPrice,
      billing:
          json['billing']?.toString() ??
          json['renewalType']?.toString() ??
          'monthly',
      status:
          json['status']?.toString() ??
          (json['isActive'] == true ? 'active' : 'cancelled'),
      isActive: json['isActive'] ?? (json['status'] == 'active'),
      isTrial: json['isTrial'] == true,
      startDate: rawStart?.toString(),
      endDate: rawEnd?.toString(),
      currentPeriodStart: json['currentPeriodStart']?.toString(),
      currentPeriodEnd: json['currentPeriodEnd']?.toString(),
      renewalType: json['renewalType']?.toString() ?? 'monthly',
      razorpayPaymentId: json['razorpayPaymentId']?.toString(),
      razorpaySubscriptionId: json['razorpaySubscriptionId']?.toString(),
      createdAt: json['createdAt']?.toString(),
      features: pFeatures,
    );
  }

  int get daysRemaining {
    if (endDate == null) return 365;
    try {
      final end = DateTime.parse(endDate!);
      final diff = end.difference(DateTime.now()).inDays;
      return diff > 0 ? diff : 0;
    } catch (_) {
      return 0;
    }
  }

  bool get isExpired {
    if (endDate == null) return false;
    try {
      final end = DateTime.parse(endDate!);
      return DateTime.now().isAfter(end);
    } catch (_) {
      return false;
    }
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    'planId': planId,
    'planName': planName,
    'planSlug': planSlug,
    'price': price,
    'billing': billing,
    'status': status,
    'isActive': isActive,
    'isTrial': isTrial,
    if (startDate != null) 'startDate': startDate,
    if (endDate != null) 'endDate': endDate,
    if (renewalType.isNotEmpty) 'renewalType': renewalType,
    if (razorpayPaymentId != null) 'razorpayPaymentId': razorpayPaymentId,
    if (razorpaySubscriptionId != null)
      'razorpaySubscriptionId': razorpaySubscriptionId,
    if (createdAt != null) 'createdAt': createdAt,
  };
}
