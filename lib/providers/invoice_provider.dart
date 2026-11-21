import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/invoice_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class InvoiceState {
  final bool isLoading;
  final List<InvoiceModel> invoices;
  final String searchQuery;
  final String? selectedCompanyId;
  final String statusFilter;
  final double? minPrice;
  final double? maxPrice;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool favoritesOnly;

  InvoiceState({
    this.isLoading = false,
    this.invoices = const [],
    this.searchQuery = '',
    this.selectedCompanyId,
    this.statusFilter = 'All',
    this.minPrice,
    this.maxPrice,
    this.startDate,
    this.endDate,
    this.favoritesOnly = false,
  });

  List<InvoiceModel> get filteredInvoices {
    return invoices.where((inv) {
      if (statusFilter != 'All' &&
          inv.status.toLowerCase() != statusFilter.toLowerCase()) {
        return false;
      }
      if (selectedCompanyId != null &&
          selectedCompanyId!.isNotEmpty &&
          selectedCompanyId != 'All' &&
          inv.vendorCompanyId != selectedCompanyId) {
        return false;
      }
      if (searchQuery.isNotEmpty) {
        final query = searchQuery.toLowerCase();
        final matchesId = inv.invoiceId.toLowerCase().contains(query);
        final matchesCust = (inv.customerName ?? '').toLowerCase().contains(
          query,
        );
        final matchesVendor = (inv.vendorCompanyName ?? '')
            .toLowerCase()
            .contains(query);
        final matchesItem = inv.items.any(
          (it) => it.product.toLowerCase().contains(query),
        );
        if (!matchesId && !matchesCust && !matchesVendor && !matchesItem) {
          return false;
        }
      }
      if (minPrice != null && inv.totalAmount < minPrice!) return false;
      if (maxPrice != null && inv.totalAmount > maxPrice!) return false;
      if (favoritesOnly && !inv.isFavorite) return false;
      if (startDate != null && inv.date != null) {
        try {
          final dt = DateTime.parse(inv.date!);
          if (dt.isBefore(startDate!)) return false;
        } catch (_) {}
      }
      if (endDate != null && inv.date != null) {
        try {
          final dt = DateTime.parse(inv.date!);
          if (dt.isAfter(endDate!)) return false;
        } catch (_) {}
      }
      return true;
    }).toList();
  }

  double get totalValue =>
      filteredInvoices.fold(0.0, (acc, inv) => acc + inv.totalAmount);

  double get averageValue =>
      filteredInvoices.isEmpty ? 0.0 : totalValue / filteredInvoices.length;

  int get paidCount =>
      invoices.where((i) => i.status.toLowerCase() == 'paid').length;

  int get pendingCount =>
      invoices.where((i) => i.status.toLowerCase() != 'paid').length;

  bool get hasActiveFilters =>
      searchQuery.isNotEmpty ||
      (selectedCompanyId != null &&
          selectedCompanyId != 'All' &&
          selectedCompanyId!.isNotEmpty) ||
      statusFilter != 'All' ||
      minPrice != null ||
      maxPrice != null ||
      startDate != null ||
      endDate != null ||
      favoritesOnly;

  InvoiceState copyWith({
    bool? isLoading,
    List<InvoiceModel>? invoices,
    String? searchQuery,
    String? selectedCompanyId,
    String? statusFilter,
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
    return InvoiceState(
      isLoading: isLoading ?? this.isLoading,
      invoices: invoices ?? this.invoices,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedCompanyId: selectedCompanyId ?? this.selectedCompanyId,
      statusFilter: statusFilter ?? this.statusFilter,
      minPrice: clearMinPrice ? null : (minPrice ?? this.minPrice),
      maxPrice: clearMaxPrice ? null : (maxPrice ?? this.maxPrice),
      startDate: clearStartDate ? null : (startDate ?? this.startDate),
      endDate: clearEndDate ? null : (endDate ?? this.endDate),
      favoritesOnly: favoritesOnly ?? this.favoritesOnly,
    );
  }
}

class InvoiceNotifier extends Notifier<InvoiceState> {
  final ApiService _apiService = ApiService();

  @override
  InvoiceState build() {
    Future.microtask(() => loadInvoices());
    return InvoiceState();
  }

  Future<void> loadInvoices() async {
    final userId = StorageService().getUserId();
    if (userId == null) return;

    state = state.copyWith(isLoading: true);
    final list = await _apiService.fetchInvoices(
      userId,
      companyId: state.selectedCompanyId,
      status: state.statusFilter,
      search: state.searchQuery,
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,
      startDate: state.startDate,
      endDate: state.endDate,
      isHeart: state.favoritesOnly,
    );
    state = state.copyWith(isLoading: false, invoices: list);
  }

  void setSearch(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void setCompanyFilter(String? companyId) {
    state = state.copyWith(selectedCompanyId: companyId);
  }

  void setStatusFilter(String status) {
    state = state.copyWith(statusFilter: status);
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
      statusFilter: 'All',
      clearMinPrice: true,
      clearMaxPrice: true,
      clearStartDate: true,
      clearEndDate: true,
      favoritesOnly: false,
    );
  }

  Future<bool> createInvoice(InvoiceModel invoice) async {
    final userId = StorageService().getUserId();
    if (userId == null) return false;

    try {
      final created = await _apiService.createInvoice(userId, invoice);
      state = state.copyWith(invoices: [created, ...state.invoices]);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> updateInvoice(InvoiceModel invoice) async {
    try {
      final updated = await _apiService.updateInvoice(invoice.id, invoice);
      final idx = state.invoices.indexWhere((i) => i.id == invoice.id);
      if (idx != -1) {
        final list = List<InvoiceModel>.from(state.invoices);
        list[idx] = updated;
        state = state.copyWith(invoices: list);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> duplicateInvoice(InvoiceModel invoice) async {
    final userId = StorageService().getUserId();
    if (userId == null) return false;

    try {
      final nextId = await _apiService.fetchNextInvoiceId(userId);
      final duplicated = invoice.copyWith(
        id: '',
        invoiceId: nextId,
        date: DateTime.now().toIso8601String(),
        status: 'Pending',
      );
      return await createInvoice(duplicated);
    } catch (_) {
      return false;
    }
  }

  Future<void> toggleFavorite(String invoiceId) async {
    final idx = state.invoices.indexWhere((i) => i.id == invoiceId);
    if (idx != -1) {
      final current = state.invoices[idx];
      final newFav = !current.isFavorite;
      final list = List<InvoiceModel>.from(state.invoices);
      list[idx] = current.copyWith(isFavorite: newFav);
      state = state.copyWith(invoices: list);

      final serverFav = await _apiService.toggleFavoriteInvoice(invoiceId);
      if (serverFav != newFav) {
        list[idx] = current.copyWith(isFavorite: serverFav);
        state = state.copyWith(invoices: list);
      }
    }
  }

  Future<bool> deleteInvoice(String id) async {
    try {
      final success = await _apiService.deleteInvoice(id);
      if (success) {
        state = state.copyWith(
          invoices: state.invoices.where((inv) => inv.id != id).toList(),
        );
      }
      return success;
    } catch (_) {
      return false;
    }
  }

  Future<bool> deleteMultipleInvoices(List<String> ids) async {
    try {
      final success = await _apiService.deleteMultipleInvoices(ids);
      if (success) {
        state = state.copyWith(
          invoices: state.invoices
              .where((inv) => !ids.contains(inv.id))
              .toList(),
        );
      }
      return success;
    } catch (_) {
      return false;
    }
  }
}

final invoiceProvider = NotifierProvider<InvoiceNotifier, InvoiceState>(
  () => InvoiceNotifier(),
);
