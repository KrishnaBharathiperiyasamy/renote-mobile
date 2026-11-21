import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/customer_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class CustomerState {
  final bool isLoading;
  final List<CustomerModel> customers;
  final String searchQuery;

  CustomerState({
    this.isLoading = false,
    this.customers = const [],
    this.searchQuery = '',
  });

  List<CustomerModel> get filteredCustomers {
    if (searchQuery.isEmpty) return customers;
    final q = searchQuery.toLowerCase();
    return customers.where((c) {
      return c.name.toLowerCase().contains(q) ||
          c.phone.toLowerCase().contains(q) ||
          (c.email?.toLowerCase().contains(q) ?? false) ||
          (c.city?.toLowerCase().contains(q) ?? false);
    }).toList();
  }

  CustomerState copyWith({
    bool? isLoading,
    List<CustomerModel>? customers,
    String? searchQuery,
  }) {
    return CustomerState(
      isLoading: isLoading ?? this.isLoading,
      customers: customers ?? this.customers,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}

class CustomerNotifier extends Notifier<CustomerState> {
  final ApiService _apiService = ApiService();

  @override
  CustomerState build() {
    Future.microtask(() => loadCustomers());
    return CustomerState();
  }

  Future<void> loadCustomers() async {
    final userId = StorageService().getUserId();
    if (userId == null) return;

    state = state.copyWith(isLoading: true);
    final list = await _apiService.fetchCustomers(userId);
    state = state.copyWith(isLoading: false, customers: list);
  }

  void setSearch(String query) {
    state = state.copyWith(searchQuery: query);
  }

  Future<bool> addCustomer(CustomerModel customer) async {
    final userId = StorageService().getUserId();
    if (userId == null) return false;

    try {
      final created = await _apiService.createCustomer(userId, customer);
      state = state.copyWith(customers: [created, ...state.customers]);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> updateCustomer(CustomerModel customer) async {
    try {
      final updated = await _apiService.updateCustomer(customer.id, customer);
      final index = state.customers.indexWhere((c) => c.id == customer.id);
      if (index != -1) {
        final newList = List<CustomerModel>.from(state.customers);
        newList[index] = updated;
        state = state.copyWith(customers: newList);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> deleteCustomer(String id) async {
    try {
      final success = await _apiService.deleteCustomer(id);
      if (success) {
        state = state.copyWith(
          customers: state.customers.where((c) => c.id != id).toList(),
        );
      }
      return success;
    } catch (_) {
      return false;
    }
  }
}

final customerProvider = NotifierProvider<CustomerNotifier, CustomerState>(
  CustomerNotifier.new,
);
