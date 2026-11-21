import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/marketplace_item_model.dart';
import '../services/api_service.dart';

class MarketplaceState {
  final bool isLoading;
  final bool isRefreshing;
  final List<MarketplaceItemModel> items;
  final String selectedCategory;
  final String selectedCity;
  final String searchQuery;
  final String sortOption;
  final bool favoritesOnly;
  final bool verifiedOnly;
  final double? minPrice;
  final double? maxPrice;
  final Map<String, bool> favoriteMap;

  MarketplaceState({
    this.isLoading = false,
    this.isRefreshing = false,
    this.items = const [],
    this.selectedCategory = 'All',
    this.selectedCity = 'All',
    this.searchQuery = '',
    this.sortOption = 'Newest First',
    this.favoritesOnly = false,
    this.verifiedOnly = false,
    this.minPrice,
    this.maxPrice,
    this.favoriteMap = const {},
  });

  bool isItemFavorite(MarketplaceItemModel item) {
    if (favoriteMap.containsKey(item.id)) {
      return favoriteMap[item.id] == true;
    }
    return item.isFavorite;
  }

  List<MarketplaceItemModel> get filteredItems {
    final list = items.where((item) {
      // 1. Favorites only
      if (favoritesOnly && !isItemFavorite(item)) {
        return false;
      }

      // 2. Verified sellers only
      if (verifiedOnly &&
          (item.companyName == 'ReNote Merchant' || item.companyGst == null)) {
        return false;
      }

      // 3. Price bounds
      if (minPrice != null && item.price < minPrice!) {
        return false;
      }
      if (maxPrice != null && item.price > maxPrice!) {
        return false;
      }

      // 4. City filter
      if (selectedCity != 'All' && selectedCity.isNotEmpty) {
        final c = selectedCity.toLowerCase().trim();
        final cNorm = c.replaceAll(RegExp(r'[\s\.\-_]'), '');
        final loc = item.location.toLowerCase();
        final locNorm = loc.replaceAll(RegExp(r'[\s\.\-_]'), '');
        final compCity = (item.companyCity ?? '').toLowerCase();
        final compCityNorm = compCity.replaceAll(RegExp(r'[\s\.\-_]'), '');
        final compAddr = (item.companyAddress ?? '').toLowerCase();
        final compAddrNorm = compAddr.replaceAll(RegExp(r'[\s\.\-_]'), '');

        bool match =
            loc.contains(c) ||
            compCity.contains(c) ||
            compAddr.contains(c) ||
            (cNorm.isNotEmpty &&
                (locNorm.contains(cNorm) ||
                    compCityNorm.contains(cNorm) ||
                    compAddrNorm.contains(cNorm)));
        if (!match) {
          if ((c.contains('coimbatore') || c == 'cbe') &&
              (loc.contains('puram') ||
                  compCity.contains('puram') ||
                  compAddr.contains('coimbatore') ||
                  compAddrNorm.contains('coimbatore'))) {
            match = true;
          } else if (c.contains('bangalore') || c.contains('bengaluru')) {
            if (loc.contains('bangalore') ||
                loc.contains('bengaluru') ||
                compCity.contains('bangalore') ||
                compCity.contains('bengaluru') ||
                compAddr.contains('bangalore') ||
                compAddr.contains('bengaluru')) {
              match = true;
            }
          }
        }
        if (!match) return false;
      }

      // 5. Category filter
      if (selectedCategory != 'All') {
        final sel = selectedCategory.toLowerCase();
        final cat = item.category.toLowerCase();
        final sub = (item.subcategory ?? '').toLowerCase();

        bool match = cat == sel || sub == sel;
        if (!match) {
          if (sel.contains('electronic') &&
              (cat.contains('laptop') ||
                  cat.contains('computer') ||
                  cat.contains('workstation') ||
                  cat.contains('phone') ||
                  cat.contains('mobile') ||
                  sub.contains('laptop') ||
                  sub.contains('computer'))) {
            match = true;
          } else if (sel.contains('vehicle') &&
              (cat.contains('car') ||
                  cat.contains('bike') ||
                  cat.contains('auto'))) {
            match = true;
          } else if (sel.contains('home') &&
              (cat.contains('living') ||
                  cat.contains('furniture') ||
                  cat.contains('appliance'))) {
            match = true;
          } else if (cat.contains(sel) || sel.contains(cat)) {
            match = true;
          }
        }
        if (!match) return false;
      }

      // 6. Search query
      if (searchQuery.isNotEmpty) {
        final q = searchQuery.toLowerCase();
        final matchTitle = item.title.toLowerCase().contains(q);
        final matchCat = item.category.toLowerCase().contains(q);
        final matchComp = item.companyName.toLowerCase().contains(q);
        final matchLoc = item.location.toLowerCase().contains(q);
        final matchDesc = (item.description ?? '').toLowerCase().contains(q);
        if (!matchTitle && !matchCat && !matchComp && !matchLoc && !matchDesc) {
          return false;
        }
      }

      return true;
    }).toList();

    // 7. Sort
    if (sortOption == 'Price: Low to High') {
      list.sort((a, b) => a.price.compareTo(b.price));
    } else if (sortOption == 'Price: High to Low') {
      list.sort((a, b) => b.price.compareTo(a.price));
    } else if (sortOption == 'Most Popular') {
      list.sort(
        (a, b) => (b.viewsCount + b.likesCount).compareTo(
          a.viewsCount + a.likesCount,
        ),
      );
    } else {
      // Newest First
      list.sort((a, b) => (b.createdAt ?? '').compareTo(a.createdAt ?? ''));
    }

    return list;
  }

  int get totalCount => filteredItems.length;

  MarketplaceState copyWith({
    bool? isLoading,
    bool? isRefreshing,
    List<MarketplaceItemModel>? items,
    String? selectedCategory,
    String? selectedCity,
    String? searchQuery,
    String? sortOption,
    bool? favoritesOnly,
    bool? verifiedOnly,
    double? minPrice,
    double? maxPrice,
    Map<String, bool>? favoriteMap,
  }) {
    return MarketplaceState(
      isLoading: isLoading ?? this.isLoading,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      items: items ?? this.items,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      selectedCity: selectedCity ?? this.selectedCity,
      searchQuery: searchQuery ?? this.searchQuery,
      sortOption: sortOption ?? this.sortOption,
      favoritesOnly: favoritesOnly ?? this.favoritesOnly,
      verifiedOnly: verifiedOnly ?? this.verifiedOnly,
      minPrice: minPrice ?? this.minPrice,
      maxPrice: maxPrice ?? this.maxPrice,
      favoriteMap: favoriteMap ?? this.favoriteMap,
    );
  }
}

class MarketplaceNotifier extends Notifier<MarketplaceState> {
  final ApiService _apiService = ApiService();

  @override
  MarketplaceState build() {
    Future.microtask(() => loadFeed());
    return MarketplaceState();
  }

  Future<void> loadFeed() async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true);
    final list = await _apiService.fetchMarketplaceFeed(
      category: state.selectedCategory,
      city: state.selectedCity,
      search: state.searchQuery,
      sort: state.sortOption == 'Price: Low to High'
          ? 'price_low_high'
          : state.sortOption == 'Price: High to Low'
          ? 'price_high_low'
          : state.sortOption == 'Most Popular'
          ? 'popular'
          : 'recent',
    );
    // If list is empty but we previously had items and no filters active, preserve existing items
    final effectiveItems = (list.isEmpty &&
            state.items.isNotEmpty &&
            state.searchQuery.isEmpty &&
            state.selectedCategory == 'All' &&
            state.selectedCity == 'All')
        ? state.items
        : list;
    state = state.copyWith(isLoading: false, items: effectiveItems);
  }

  Future<void> refresh() async {
    if (state.isRefreshing) return;
    state = state.copyWith(isRefreshing: true);
    final list = await _apiService.fetchMarketplaceFeed(
      category: state.selectedCategory,
      city: state.selectedCity,
      search: state.searchQuery,
      sort: state.sortOption == 'Price: Low to High'
          ? 'price_low_high'
          : state.sortOption == 'Price: High to Low'
          ? 'price_high_low'
          : state.sortOption == 'Most Popular'
          ? 'popular'
          : 'recent',
    );
    final effectiveItems = (list.isEmpty &&
            state.items.isNotEmpty &&
            state.searchQuery.isEmpty &&
            state.selectedCategory == 'All' &&
            state.selectedCity == 'All')
        ? state.items
        : list;
    state = state.copyWith(isRefreshing: false, items: effectiveItems);
  }

  void setCategory(String category) {
    state = state.copyWith(selectedCategory: category);
  }

  void setCity(String city) {
    state = state.copyWith(selectedCity: city);
    loadFeed();
  }

  void setSearch(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void setSortOption(String sort) {
    state = state.copyWith(sortOption: sort);
  }

  void setPriceRange(double? min, double? max) {
    state = state.copyWith(minPrice: min, maxPrice: max);
  }

  void toggleFavoritesOnly() {
    state = state.copyWith(favoritesOnly: !state.favoritesOnly);
  }

  void toggleVerifiedOnly() {
    state = state.copyWith(verifiedOnly: !state.verifiedOnly);
  }

  void resetFilters() {
    state = state.copyWith(
      selectedCategory: 'All',
      selectedCity: 'All',
      sortOption: 'Newest First',
      favoritesOnly: false,
      verifiedOnly: false,
      minPrice: null,
      maxPrice: null,
      searchQuery: '',
    );
    loadFeed();
  }

  Future<void> toggleFavorite(String itemId) async {
    final current =
        state.favoriteMap[itemId] ??
        state.items
            .firstWhere(
              (it) => it.id == itemId,
              orElse: () => state.items.first,
            )
            .isFavorite;

    final newMap = Map<String, bool>.from(state.favoriteMap);
    newMap[itemId] = !current;
    state = state.copyWith(favoriteMap: newMap);

    await _apiService.reactMarketplaceItem(
      itemId,
      reaction: !current ? 'like' : 'none',
    );
  }

  Future<void> rateItem(String itemId, double rating) async {
    final index = state.items.indexWhere((it) => it.id == itemId);
    if (index != -1) {
      final current = state.items[index];
      final newCount = current.ratingsCount + 1;
      final newAvg =
          ((current.averageRating * current.ratingsCount) + rating) / newCount;
      final updated = current.copyWith(
        ratingsCount: newCount,
        averageRating: double.parse(newAvg.toStringAsFixed(1)),
      );
      final newItems = List<MarketplaceItemModel>.from(state.items);
      newItems[index] = updated;
      state = state.copyWith(items: newItems);
    }
    await _apiService.rateMarketplaceItem(itemId, rating);
  }
}

final marketplaceProvider =
    NotifierProvider<MarketplaceNotifier, MarketplaceState>(
      MarketplaceNotifier.new,
    );
