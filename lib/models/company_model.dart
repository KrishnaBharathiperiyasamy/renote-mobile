class CompanyModel {
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
  final String? flag; // 'vendor' or 'customer'

  CompanyModel({
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
    this.flag,
  });

  bool get isCustomer => flag?.toLowerCase() == 'customer';
  bool get isVendor => flag?.toLowerCase() == 'vendor' || flag == null;

  factory CompanyModel.fromJson(Map<String, dynamic> json) {
    return CompanyModel(
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
      flag: json['flag']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'address': address,
      'city': city,
      'state': state,
      'zipCode': zipCode,
      'gstNo': gstNo,
      'panNo': panNo,
      'companyType': companyType,
      'logo': logo,
      'flag': flag,
    };
  }
}
