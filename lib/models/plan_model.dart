class PlanFeaturesModel {
  final int maxFromCompanies;
  final int maxPostersPerMonth;
  final int maxPosterLinks;
  final int posterLinkExpiryDays;
  final int maxVideoUploadsPerMonth;
  final int maxVideoStorageMB;
  final int posterFrames;
  final String supportLevel;
  final bool unlimitedInvoices;
  final bool unlimitedEstimations;
  final bool unlimitedProducts;
  final bool unlimitedToCompanies;
  final bool unlimitedPosters;
  final bool unlimitedPosterLinks;
  final bool unlimitedVideoUploads;

  const PlanFeaturesModel({
    this.maxFromCompanies = 1,
    this.maxPostersPerMonth = 5,
    this.maxPosterLinks = 3,
    this.posterLinkExpiryDays = 7,
    this.maxVideoUploadsPerMonth = 1,
    this.maxVideoStorageMB = 75,
    this.posterFrames = 50,
    this.supportLevel = 'none',
    this.unlimitedInvoices = true,
    this.unlimitedEstimations = true,
    this.unlimitedProducts = true,
    this.unlimitedToCompanies = true,
    this.unlimitedPosters = false,
    this.unlimitedPosterLinks = false,
    this.unlimitedVideoUploads = false,
  });

  factory PlanFeaturesModel.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const PlanFeaturesModel();
    return PlanFeaturesModel(
      maxFromCompanies: (json['maxFromCompanies'] as num?)?.toInt() ?? 1,
      maxPostersPerMonth: (json['maxPostersPerMonth'] as num?)?.toInt() ?? 5,
      maxPosterLinks: (json['maxPosterLinks'] as num?)?.toInt() ?? 3,
      posterLinkExpiryDays:
          (json['posterLinkExpiryDays'] as num?)?.toInt() ?? 7,
      maxVideoUploadsPerMonth:
          (json['maxVideoUploadsPerMonth'] as num?)?.toInt() ?? 1,
      maxVideoStorageMB: (json['maxVideoStorageMB'] as num?)?.toInt() ?? 75,
      posterFrames: (json['posterFrames'] as num?)?.toInt() ?? 50,
      supportLevel: json['supportLevel']?.toString() ?? 'none',
      unlimitedInvoices: json['unlimitedInvoices'] ?? true,
      unlimitedEstimations: json['unlimitedEstimations'] ?? true,
      unlimitedProducts: json['unlimitedProducts'] ?? true,
      unlimitedToCompanies: json['unlimitedToCompanies'] ?? true,
      unlimitedPosters: json['unlimitedPosters'] ?? false,
      unlimitedPosterLinks: json['unlimitedPosterLinks'] ?? false,
      unlimitedVideoUploads: json['unlimitedVideoUploads'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'maxFromCompanies': maxFromCompanies,
    'maxPostersPerMonth': maxPostersPerMonth,
    'maxPosterLinks': maxPosterLinks,
    'posterLinkExpiryDays': posterLinkExpiryDays,
    'maxVideoUploadsPerMonth': maxVideoUploadsPerMonth,
    'maxVideoStorageMB': maxVideoStorageMB,
    'posterFrames': posterFrames,
    'supportLevel': supportLevel,
    'unlimitedInvoices': unlimitedInvoices,
    'unlimitedEstimations': unlimitedEstimations,
    'unlimitedProducts': unlimitedProducts,
    'unlimitedToCompanies': unlimitedToCompanies,
    'unlimitedPosters': unlimitedPosters,
    'unlimitedPosterLinks': unlimitedPosterLinks,
    'unlimitedVideoUploads': unlimitedVideoUploads,
  };
}

class PlanModel {
  final String id;
  final String name;
  final double price;
  final String duration; // 'monthly' | 'annually' | 'both'
  final bool isActive;
  final PlanFeaturesModel features;
  final String slug;
  final bool popular;
  final String? razorpayPlanId;

  const PlanModel({
    required this.id,
    required this.name,
    required this.price,
    this.duration = 'monthly',
    this.isActive = true,
    this.features = const PlanFeaturesModel(),
    required this.slug,
    this.popular = false,
    this.razorpayPlanId,
  });

  factory PlanModel.fromJson(Map<String, dynamic> json) {
    final name = json['name']?.toString() ?? 'Plan';
    final slug =
        json['slug']?.toString() ??
        name.toLowerCase().replaceAll(RegExp(r'\s+'), '');
    return PlanModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      name: name,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      duration: json['duration']?.toString() ?? 'monthly',
      isActive: json['isActive'] ?? true,
      features: PlanFeaturesModel.fromJson(
        json['features'] is Map
            ? Map<String, dynamic>.from(json['features'])
            : null,
      ),
      slug: slug,
      popular: json['popular'] == true || slug == 'pro',
      razorpayPlanId: json['razorpayPlanId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'price': price,
    'duration': duration,
    'isActive': isActive,
    'features': features.toJson(),
    'slug': slug,
    'popular': popular,
    if (razorpayPlanId != null) 'razorpayPlanId': razorpayPlanId,
  };

  // Standard Default Free Plans
  static const PlanModel freeMonthly = PlanModel(
    id: 'free-plan-monthly',
    name: 'Free',
    price: 0,
    duration: 'monthly',
    slug: 'free',
    features: PlanFeaturesModel(),
  );

  static const PlanModel freeAnnually = PlanModel(
    id: 'free-plan-annually',
    name: 'Free',
    price: 0,
    duration: 'annually',
    slug: 'free',
    features: PlanFeaturesModel(),
  );

  static const PlanModel starterMonthly = PlanModel(
    id: 'starter-plan-monthly',
    name: 'Starter',
    price: 199,
    duration: 'monthly',
    slug: 'starter',
    features: PlanFeaturesModel(
      maxFromCompanies: 2,
      maxPostersPerMonth: 20,
      maxPosterLinks: 10,
      posterLinkExpiryDays: 30,
      maxVideoUploadsPerMonth: 5,
      maxVideoStorageMB: 250,
      posterFrames: 100,
      supportLevel: 'email',
    ),
  );

  static const PlanModel proMonthly = PlanModel(
    id: 'pro-plan-monthly',
    name: 'Pro',
    price: 349,
    duration: 'monthly',
    slug: 'pro',
    popular: true,
    features: PlanFeaturesModel(
      maxFromCompanies: 5,
      maxPostersPerMonth: 100,
      maxPosterLinks: 50,
      posterLinkExpiryDays: 90,
      maxVideoUploadsPerMonth: 20,
      maxVideoStorageMB: 1024,
      posterFrames: 250,
      supportLevel: 'priority',
    ),
  );

  static const PlanModel businessMonthly = PlanModel(
    id: 'business-plan-monthly',
    name: 'Business',
    price: 499,
    duration: 'monthly',
    slug: 'business',
    features: PlanFeaturesModel(
      maxFromCompanies: 20,
      maxPostersPerMonth: 500,
      unlimitedPosters: true,
      maxPosterLinks: 200,
      unlimitedPosterLinks: true,
      posterLinkExpiryDays: 365,
      maxVideoUploadsPerMonth: 50,
      unlimitedVideoUploads: true,
      maxVideoStorageMB: 5120,
      posterFrames: 500,
      supportLevel: 'dedicated',
    ),
  );

  static const PlanModel starterAnnually = PlanModel(
    id: 'starter-plan-annually',
    name: 'Starter',
    price: 1999,
    duration: 'annually',
    slug: 'starter',
    features: PlanFeaturesModel(
      maxFromCompanies: 2,
      maxPostersPerMonth: 20,
      maxPosterLinks: 10,
      posterLinkExpiryDays: 30,
      maxVideoUploadsPerMonth: 5,
      maxVideoStorageMB: 250,
      posterFrames: 100,
      supportLevel: 'email',
    ),
  );

  static const PlanModel proAnnually = PlanModel(
    id: 'pro-plan-annually',
    name: 'Pro',
    price: 3499,
    duration: 'annually',
    slug: 'pro',
    popular: true,
    features: PlanFeaturesModel(
      maxFromCompanies: 5,
      maxPostersPerMonth: 100,
      maxPosterLinks: 50,
      posterLinkExpiryDays: 90,
      maxVideoUploadsPerMonth: 20,
      maxVideoStorageMB: 1024,
      posterFrames: 250,
      supportLevel: 'priority',
    ),
  );

  static const PlanModel businessAnnually = PlanModel(
    id: 'business-plan-annually',
    name: 'Business',
    price: 4999,
    duration: 'annually',
    slug: 'business',
    features: PlanFeaturesModel(
      maxFromCompanies: 20,
      maxPostersPerMonth: 500,
      unlimitedPosters: true,
      maxPosterLinks: 200,
      unlimitedPosterLinks: true,
      posterLinkExpiryDays: 365,
      maxVideoUploadsPerMonth: 50,
      unlimitedVideoUploads: true,
      maxVideoStorageMB: 5120,
      posterFrames: 500,
      supportLevel: 'dedicated',
    ),
  );

  static List<PlanModel> get defaultMonthlyPlans => [
    freeMonthly,
    starterMonthly,
    proMonthly,
    businessMonthly,
  ];

  static List<PlanModel> get defaultAnnuallyPlans => [
    freeAnnually,
    starterAnnually,
    proAnnually,
    businessAnnually,
  ];
}
