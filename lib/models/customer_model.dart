class CustomerModel {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final String? address;
  final String? city;
  final String? state;
  final String? zipCode;
  final String? gstNo;
  final String? panNo;
  final String? companyType;
  final String? logo;
  final String? createdAt;

  CustomerModel({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    this.address,
    this.city,
    this.state,
    this.zipCode,
    this.gstNo,
    this.panNo,
    this.companyType,
    this.logo,
    this.createdAt,
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    return CustomerModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      email: json['email']?.toString(),
      address: json['address']?.toString(),
      city: json['city']?.toString(),
      state: json['state']?.toString(),
      zipCode: json['zipCode']?.toString(),
      gstNo: json['gstNo']?.toString(),
      panNo: json['panNo']?.toString(),
      companyType: json['companyType']?.toString(),
      logo: json['logo']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id.isNotEmpty) '_id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'address': address,
      'city': (city != null && city!.trim().isNotEmpty) ? city : 'India',
      'state': state,
      'zipCode': zipCode,
      'gstNo': gstNo,
      'panNo': panNo,
      'companyType': companyType ?? 'Retail & Wholesale',
      'flag': 'customer',
    };
  }
}
