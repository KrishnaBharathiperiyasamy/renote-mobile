import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/company_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class CompanyState {
  final bool isLoading;
  final List<CompanyModel> companies;
  final CompanyModel? selectedCompany;

  CompanyState({
    this.isLoading = false,
    this.companies = const [],
    this.selectedCompany,
  });

  CompanyState copyWith({
    bool? isLoading,
    List<CompanyModel>? companies,
    CompanyModel? selectedCompany,
  }) {
    return CompanyState(
      isLoading: isLoading ?? this.isLoading,
      companies: companies ?? this.companies,
      selectedCompany: selectedCompany ?? this.selectedCompany,
    );
  }
}

class CompanyNotifier extends Notifier<CompanyState> {
  final ApiService _apiService = ApiService();

  @override
  CompanyState build() {
    Future.microtask(() => loadCompanies());
    return CompanyState();
  }

  Future<void> loadCompanies() async {
    final userId = StorageService().getUserId();
    if (userId == null) return;
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true);
    final list = await _apiService.fetchCompanies(userId);
    final vendors = list.where((c) => c.isVendor).toList();

    state = state.copyWith(
      isLoading: false,
      companies: vendors,
      selectedCompany: state.selectedCompany ??
          (vendors.isNotEmpty ? vendors.first : null),
    );
  }

  void selectCompany(CompanyModel company) {
    state = state.copyWith(selectedCompany: company);
  }
}

final companyProvider = NotifierProvider<CompanyNotifier, CompanyState>(
  CompanyNotifier.new,
);
