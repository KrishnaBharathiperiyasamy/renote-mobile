class UserModel {
  final String id;
  final String? email;
  final String? phone;
  final String? firstName;
  final String? lastName;
  final String? profilePic;
  final String? role;

  UserModel({
    required this.id,
    this.email,
    this.phone,
    this.firstName,
    this.lastName,
    this.profilePic,
    this.role,
  });

  String get fullName {
    final f = firstName ?? '';
    final l = lastName ?? '';
    final name = '$f $l'.trim();
    if (name.isNotEmpty) return name;
    return email ?? phone ?? 'User';
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      firstName: json['firstName']?.toString(),
      lastName: json['lastName']?.toString(),
      profilePic:
          json['uploadedImage']?.toString() ??
          json['profilePic']?.toString() ??
          json['profileImageUrl']?.toString(),
      role: json['role']?.toString() ?? json['roleCode']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'phone': phone,
      'firstName': firstName,
      'lastName': lastName,
      'profilePic': profilePic,
      'role': role,
    };
  }
}
