import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/product_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class ProductState {
  final bool isLoading;
  final List<ProductModel> products;
  final String searchQuery;
  final String? selectedCompanyId;
  final double? minPrice;
  final double? maxPrice;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool favoritesOnly;
  final String? sortOption; // 'price_asc', 'price_desc', 'name_asc', 'newest'

  ProductState({
    this.isLoading = false,
    this.products = const [],
    this.searchQuery = '',
    this.selectedCompanyId,
    this.minPrice,
    this.maxPrice,
    this.startDate,
    this.endDate,
    this.favoritesOnly = false,
    this.sortOption,
  });

  List<ProductModel> get filteredProducts {
    final list = products.where((p) {
      if (selectedCompanyId != null &&
          selectedCompanyId!.isNotEmpty &&
          selectedCompanyId != 'All' &&
          p.companyId != selectedCompanyId) {
        return false;
      }
      if (searchQuery.isNotEmpty) {
        final q = searchQuery.toLowerCase();
        final matchesName = p.name.toLowerCase().contains(q);
        final matchesHsn = (p.hsn?.toLowerCase().contains(q) ?? false);
        final matchesDesc = (p.description?.toLowerCase().contains(q) ?? false);
        if (!matchesName && !matchesHsn && !matchesDesc) {
          return false;
        }
      }
      if (minPrice != null && p.price < minPrice!) return false;
      if (maxPrice != null && p.price > maxPrice!) return false;
      if (favoritesOnly && !p.isFavorite) return false;
      if (startDate != null && p.createdAt != null) {
        try {
          final dt = DateTime.parse(p.createdAt!);
          if (dt.isBefore(startDate!)) return false;
        } catch (_) {}
      }
      if (endDate != null && p.createdAt != null) {
        try {
          final dt = DateTime.parse(p.createdAt!);
          if (dt.isAfter(endDate!)) return false;
        } catch (_) {}
      }
      return true;
    }).toList();

    if (sortOption == 'price_asc') {
      list.sort((a, b) => a.price.compareTo(b.price));
    } else if (sortOption == 'price_desc') {
      list.sort((a, b) => b.price.compareTo(a.price));
    } else if (sortOption == 'name_asc') {
      list.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    }

    return list;
  }

  int get totalProducts => filteredProducts.length;

  double get totalStock => filteredProducts.fold(0.0, (acc, p) => acc + p.qty);

  double get totalValuation => filteredProducts.fold(
    0.0,
    (acc, p) => acc + (p.price * (p.qty > 0 ? p.qty : 1.0)),
  );

  bool get hasActiveFilters =>
      searchQuery.isNotEmpty ||
      (selectedCompanyId != null &&
          selectedCompanyId != 'All' &&
          selectedCompanyId!.isNotEmpty) ||
      minPrice != null ||
      maxPrice != null ||
      startDate != null ||
      endDate != null ||
      favoritesOnly ||
      (sortOption != null && sortOption!.isNotEmpty);

  ProductState copyWith({
    bool? isLoading,
    List<ProductModel>? products,
    String? searchQuery,
    String? selectedCompanyId,
    double? minPrice,
    double? maxPrice,
    DateTime? startDate,
    DateTime? endDate,
    bool? favoritesOnly,
    String? sortOption,
    bool clearMinPrice = false,
    bool clearMaxPrice = false,
    bool clearStartDate = false,
    bool clearEndDate = false,
    bool clearSortOption = false,
  }) {
    return ProductState(
      isLoading: isLoading ?? this.isLoading,
      products: products ?? this.products,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedCompanyId: selectedCompanyId ?? this.selectedCompanyId,
      minPrice: clearMinPrice ? null : (minPrice ?? this.minPrice),
      maxPrice: clearMaxPrice ? null : (maxPrice ?? this.maxPrice),
      startDate: clearStartDate ? null : (startDate ?? this.startDate),
      endDate: clearEndDate ? null : (endDate ?? this.endDate),
      favoritesOnly: favoritesOnly ?? this.favoritesOnly,
      sortOption: clearSortOption ? null : (sortOption ?? this.sortOption),
    );
  }
}

class ProductNotifier extends Notifier<ProductState> {
  final ApiService _apiService = ApiService();

  @override
  ProductState build() {
    Future.microtask(() => loadProducts());
    return ProductState();
  }

  Future<void> loadProducts() async {
    final userId = StorageService().getUserId();
    if (userId == null) return;

    state = state.copyWith(isLoading: true);
    final list = await _apiService.fetchProducts(
      userId,
      companyId: state.selectedCompanyId,
    );
    state = state.copyWith(isLoading: false, products: list);
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
    String? sortOption,
  }) {
    state = state.copyWith(
      minPrice: minPrice,
      maxPrice: maxPrice,
      startDate: startDate,
      endDate: endDate,
      favoritesOnly: favoritesOnly,
      sortOption: sortOption,
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
      clearSortOption: true,
      favoritesOnly: false,
    );
  }

  Future<void> toggleFavorite(String productId) async {
    final index = state.products.indexWhere((p) => p.id == productId);
    if (index != -1) {
      final current = state.products[index];
      final newFav = !current.isFavorite;
      final updatedList = List<ProductModel>.from(state.products);
      updatedList[index] = current.copyWith(isFavorite: newFav);
      state = state.copyWith(products: updatedList);

      final serverFav = await _apiService.toggleFavoriteProduct(productId);
      if (serverFav != newFav) {
        updatedList[index] = current.copyWith(isFavorite: serverFav);
        state = state.copyWith(products: updatedList);
      }
    }
  }

  Future<bool> addProduct(ProductModel product, String companyId) async {
    final userId = StorageService().getUserId();
    if (userId == null) return false;

    try {
      final created = await _apiService.createProduct(
        userId,
        product,
        companyId,
      );
      state = state.copyWith(products: [created, ...state.products]);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> updateProduct(ProductModel product, String companyId) async {
    try {
      final updated = await _apiService.updateProduct(
        product.id,
        product,
        companyId,
      );
      final index = state.products.indexWhere((p) => p.id == product.id);
      if (index != -1) {
        final newList = List<ProductModel>.from(state.products);
        newList[index] = updated;
        state = state.copyWith(products: newList);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> deleteProduct(String id) async {
    final userId = StorageService().getUserId();
    try {
      final success = await _apiService.deleteProduct(id, userId: userId);
      if (success) {
        state = state.copyWith(
          products: state.products.where((p) => p.id != id).toList(),
        );
      }
      return success;
    } catch (_) {
      return false;
    }
  }

  Future<bool> deleteMultipleProducts(List<String> ids) async {
    try {
      final success = await _apiService.deleteMultipleProducts(ids);
      if (success) {
        state = state.copyWith(
          products: state.products.where((p) => !ids.contains(p.id)).toList(),
        );
      }
      return success;
    } catch (_) {
      return false;
    }
  }
}

final productProvider = NotifierProvider<ProductNotifier, ProductState>(
  () => ProductNotifier(),
);
