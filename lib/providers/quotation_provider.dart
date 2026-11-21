import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/quotation_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class QuotationState {
  final bool isLoading;
  final List<QuotationModel> quotations;
  final String searchQuery;
  final String? selectedCompanyId;
  final double? minPrice;
  final double? maxPrice;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool favoritesOnly;

  QuotationState({
    this.isLoading = false,
    this.quotations = const [],
    this.searchQuery = '',
    this.selectedCompanyId,
    this.minPrice,
    this.maxPrice,
    this.startDate,
    this.endDate,
    this.favoritesOnly = false,
  });

  List<QuotationModel> get filteredQuotations {
    return quotations.where((q) {
      if (selectedCompanyId != null &&
          selectedCompanyId!.isNotEmpty &&
          selectedCompanyId != 'All' &&
          q.vendorCompanyId != selectedCompanyId) {
        return false;
      }
      if (searchQuery.isNotEmpty) {
        final query = searchQuery.toLowerCase();
        final matchesId = q.estimateId.toLowerCase().contains(query);
        final matchesCust = (q.customerName ?? '').toLowerCase().contains(
          query,
        );
        final matchesVendor = (q.vendorCompanyName ?? '')
            .toLowerCase()
            .contains(query);
        final matchesItem = q.items.any(
          (it) => it.product.toLowerCase().contains(query),
        );
        if (!matchesId && !matchesCust && !matchesVendor && !matchesItem) {
          return false;
        }
      }
      if (minPrice != null && q.totalAmount < minPrice!) return false;
      if (maxPrice != null && q.totalAmount > maxPrice!) return false;
      if (favoritesOnly && !q.isFavorite) return false;
      if (startDate != null && q.date != null) {
        try {
          final dt = DateTime.parse(q.date!);
          if (dt.isBefore(startDate!)) return false;
        } catch (_) {}
      }
      if (endDate != null && q.date != null) {
        try {
          final dt = DateTime.parse(q.date!);
          if (dt.isAfter(endDate!)) return false;
        } catch (_) {}
      }
      return true;
    }).toList();
  }

  double get totalValue =>
      filteredQuotations.fold(0.0, (acc, q) => acc + q.totalAmount);

  double get averageValue =>
      filteredQuotations.isEmpty ? 0.0 : totalValue / filteredQuotations.length;

  bool get hasActiveFilters =>
      searchQuery.isNotEmpty ||
      (selectedCompanyId != null &&
          selectedCompanyId != 'All' &&
          selectedCompanyId!.isNotEmpty) ||
      minPrice != null ||
      maxPrice != null ||
      startDate != null ||
      endDate != null ||
      favoritesOnly;

  QuotationState copyWith({
    bool? isLoading,
    List<QuotationModel>? quotations,
    String? searchQuery,
    String? selectedCompanyId,
    double? minPrice,
    double? maxPrice,
    DateTime? startDate,
    DateTime? endDate,
    bool? favoritesOnly,
    bool clearMinPrice = false,
    bool clearMaxPrice = false,
    bool clearStartDate = false,
    bool clearEndDate = false,
  }) {
    return QuotationState(
      isLoading: isLoading ?? this.isLoading,
      quotations: quotations ?? this.quotations,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedCompanyId: selectedCompanyId ?? this.selectedCompanyId,
      minPrice: clearMinPrice ? null : (minPrice ?? this.minPrice),
      maxPrice: clearMaxPrice ? null : (maxPrice ?? this.maxPrice),
      startDate: clearStartDate ? null : (startDate ?? this.startDate),
      endDate: clearEndDate ? null : (endDate ?? this.endDate),
      favoritesOnly: favoritesOnly ?? this.favoritesOnly,
    );
  }
}

class QuotationNotifier extends Notifier<QuotationState> {
  final ApiService _apiService = ApiService();

  @override
  QuotationState build() {
    Future.microtask(() => loadQuotations());
    return QuotationState();
  }

  Future<void> loadQuotations() async {
    final userId = StorageService().getUserId();
    if (userId == null) return;
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true);
    final list = await _apiService.fetchQuotations(
      userId,
      companyId: state.selectedCompanyId,
    );
    final effectiveList =
        (list.isEmpty && state.quotations.isNotEmpty) ? state.quotations : list;
    state = state.copyWith(isLoading: false, quotations: effectiveList);
  }

  void setSearch(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void setCompanyFilter(String? companyId) {
    state = state.copyWith(selectedCompanyId: companyId);
  }

  void setFilters({
    double? minPrice,
    double? maxPrice,
    DateTime? startDate,
    DateTime? endDate,
    bool? favoritesOnly,
  }) {
    state = state.copyWith(
      minPrice: minPrice,
      maxPrice: maxPrice,
      startDate: startDate,
      endDate: endDate,
      favoritesOnly: favoritesOnly,
    );
  }

  void resetFilters() {
    state = state.copyWith(
      searchQuery: '',
      selectedCompanyId: null,
      clearMinPrice: true,
      clearMaxPrice: true,
      clearStartDate: true,
      clearEndDate: true,
      favoritesOnly: false,
    );
  }

  Future<bool> createQuotation(QuotationModel quotation) async {
    final userId = StorageService().getUserId();
    if (userId == null) return false;

    try {
      final created = await _apiService.createQuotation(userId, quotation);
      state = state.copyWith(quotations: [created, ...state.quotations]);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> updateQuotation(QuotationModel quotation) async {
    try {
      final updated = await _apiService.updateQuotation(
        quotation.id,
        quotation,
      );
      final idx = state.quotations.indexWhere((q) => q.id == quotation.id);
      if (idx != -1) {
        final list = List<QuotationModel>.from(state.quotations);
        list[idx] = updated;
        state = state.copyWith(quotations: list);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> duplicateQuotation(QuotationModel quotation) async {
    final userId = StorageService().getUserId();
    if (userId == null) return false;

    try {
      final nextId = await _apiService.fetchNextQuotationId(userId);
      final duplicated = quotation.copyWith(
        id: '',
        estimateId: nextId,
        date: DateTime.now().toIso8601String(),
      );
      return await createQuotation(duplicated);
    } catch (_) {
      return false;
    }
  }

  Future<void> toggleFavorite(String quotationId) async {
    final idx = state.quotations.indexWhere((q) => q.id == quotationId);
    if (idx != -1) {
      final current = state.quotations[idx];
      final newFav = !current.isFavorite;
      final list = List<QuotationModel>.from(state.quotations);
      list[idx] = current.copyWith(isFavorite: newFav);
      state = state.copyWith(quotations: list);

      final serverFav = await _apiService.toggleFavoriteQuotation(quotationId);
      if (serverFav != newFav) {
        list[idx] = current.copyWith(isFavorite: serverFav);
        state = state.copyWith(quotations: list);
      }
    }
  }

  Future<bool> deleteQuotation(String id) async {
    try {
      final success = await _apiService.deleteQuotation(id);
      if (success) {
        state = state.copyWith(
          quotations: state.quotations.where((q) => q.id != id).toList(),
        );
      }
      return success;
    } catch (_) {
      return false;
    }
  }

  Future<bool> deleteMultipleQuotations(List<String> ids) async {
    try {
      final success = await _apiService.deleteMultipleQuotations(ids);
      if (success) {
        state = state.copyWith(
          quotations: state.quotations
              .where((q) => !ids.contains(q.id))
              .toList(),
        );
      }
      return success;
    } catch (_) {
      return false;
    }
  }
}

final quotationProvider = NotifierProvider<QuotationNotifier, QuotationState>(
  () => QuotationNotifier(),
);
