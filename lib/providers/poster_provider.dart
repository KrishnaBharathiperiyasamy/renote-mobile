import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/poster_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class PosterState {
  final bool isLoading;
  final bool isSaving;
  final List<PosterModel> posters;
  final String searchQuery;
  final String selectedCategory;
  final String? selectedCompanyId;
  final bool favoritesOnly;

  PosterState({
    this.isLoading = false,
    this.isSaving = false,
    this.posters = const [],
    this.searchQuery = '',
    this.selectedCategory = 'All',
    this.selectedCompanyId,
    this.favoritesOnly = false,
  });

  List<PosterModel> get filteredPosters {
    return posters.where((p) {
      if (favoritesOnly && !p.isFavorite) {
        return false;
      }
      if (selectedCompanyId != null &&
          selectedCompanyId!.isNotEmpty &&
          selectedCompanyId != 'All' &&
          p.companyId != selectedCompanyId) {
        return false;
      }
      if (selectedCategory != 'All' &&
          p.templateCategory.toLowerCase() != selectedCategory.toLowerCase()) {
        return false;
      }
      if (searchQuery.isNotEmpty) {
        final q = searchQuery.toLowerCase();
        final matchesName = p.posterName.toLowerCase().contains(q);
        final matchesTitle = p.posterTitle.toLowerCase().contains(q);
        final matchesProduct = p.productName.toLowerCase().contains(q);
        final matchesDesc =
            (p.productDescription?.toLowerCase().contains(q) ?? false);
        if (!matchesName && !matchesTitle && !matchesProduct && !matchesDesc) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  int get totalCount => filteredPosters.length;

  PosterState copyWith({
    bool? isLoading,
    bool? isSaving,
    List<PosterModel>? posters,
    String? searchQuery,
    String? selectedCategory,
    String? selectedCompanyId,
    bool? favoritesOnly,
  }) {
    return PosterState(
      isLoading: isLoading ?? this.isLoading,
      isSaving: isSaving ?? this.isSaving,
      posters: posters ?? this.posters,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      selectedCompanyId: selectedCompanyId ?? this.selectedCompanyId,
      favoritesOnly: favoritesOnly ?? this.favoritesOnly,
    );
  }
}

class PosterNotifier extends Notifier<PosterState> {
  final ApiService _apiService = ApiService();

  @override
  PosterState build() {
    Future.microtask(() => loadPosters());
    return PosterState();
  }

  Future<void> loadPosters() async {
    final userId = StorageService().getUserId();
    if (userId == null) return;

    state = state.copyWith(isLoading: true);
    final list = await _apiService.fetchPosters(
      userId,
      companyId: state.selectedCompanyId,
    );
    state = state.copyWith(isLoading: false, posters: list);
  }

  void setSearch(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void setCategory(String category) {
    state = state.copyWith(selectedCategory: category);
  }

  void setCompanyFilter(String? companyId) {
    state = state.copyWith(selectedCompanyId: companyId);
  }

  void toggleFavoritesOnly() {
    state = state.copyWith(favoritesOnly: !state.favoritesOnly);
  }

  Future<PosterModel?> savePoster(PosterModel poster) async {
    final userId = StorageService().getUserId();
    if (userId == null) return null;

    state = state.copyWith(isSaving: true);
    try {
      PosterModel result;
      if (poster.id.isNotEmpty && !poster.id.startsWith('temp_')) {
        result = await _apiService.updatePoster(poster.id, poster);
        final index = state.posters.indexWhere((p) => p.id == poster.id);
        if (index != -1) {
          final updatedList = List<PosterModel>.from(state.posters);
          updatedList[index] = result;
          state = state.copyWith(isSaving: false, posters: updatedList);
        } else {
          state = state.copyWith(
            isSaving: false,
            posters: [result, ...state.posters],
          );
        }
      } else {
        result = await _apiService.createPoster(userId, poster);
        state = state.copyWith(
          isSaving: false,
          posters: [result, ...state.posters],
        );
      }
      return result;
    } catch (_) {
      state = state.copyWith(isSaving: false);
      return null;
    }
  }

  Future<String?> deletePoster(String posterId) async {
    try {
      final error = await _apiService.deletePoster(posterId);
      if (error == null) {
        state = state.copyWith(
          posters: state.posters
              .where((p) => p.id != posterId && p.posterId != posterId)
              .toList(),
        );
      }
      return error;
    } catch (e) {
      return e.toString();
    }
  }

  Future<bool> toggleFavorite(String posterId) async {
    // Optimistic update
    final index = state.posters.indexWhere((p) => p.id == posterId);
    if (index == -1) return false;

    final current = state.posters[index];
    final updated = current.copyWith(isFavorite: !current.isFavorite);
    final updatedList = List<PosterModel>.from(state.posters);
    updatedList[index] = updated;
    state = state.copyWith(posters: updatedList);

    final ok = await _apiService.togglePosterFavorite(posterId);
    if (!ok) {
      // Revert if failed
      final revertedList = List<PosterModel>.from(state.posters);
      revertedList[index] = current;
      state = state.copyWith(posters: revertedList);
    }
    return ok;
  }
}

final posterProvider = NotifierProvider<PosterNotifier, PosterState>(
  () => PosterNotifier(),
);
