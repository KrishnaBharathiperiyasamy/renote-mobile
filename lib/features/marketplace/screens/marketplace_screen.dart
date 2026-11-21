import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../models/marketplace_item_model.dart';
import '../../../providers/marketplace_provider.dart';
import '../../../providers/theme_provider.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_header.dart';
import '../widgets/category_dropdrawer_modal.dart';
import '../widgets/location_picker_modal.dart';
import 'product_details_screen.dart';

class MarketplaceScreen extends ConsumerStatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  ConsumerState<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends ConsumerState<MarketplaceScreen> {
  final TextEditingController _searchController = TextEditingController();

  static const List<String> _sortOptions = [
    'Newest First',
    'Price: Low to High',
    'Price: High to Low',
    'Most Popular',
  ];

  CategoryItem _getActiveCategory(String selectedCategory) {
    return CategoryDropDrawerModal.categories.firstWhere(
      (c) => c.id.toLowerCase() == selectedCategory.toLowerCase(),
      orElse: () => CategoryDropDrawerModal.categories.first,
    );
  }

  void _showCategoryDropDrawer() {
    final state = ref.read(marketplaceProvider);
    CategoryDropDrawerModal.show(
      context: context,
      selectedCategory: state.selectedCategory,
      onCategorySelected: (category) {
        ref.read(marketplaceProvider.notifier).setCategory(category);
      },
    );
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      try {
        final uri = GoRouterState.of(context).uri;
        if (uri.queryParameters['theme'] == 'dark') {
          ref.read(themeProvider.notifier).setTheme(ThemeMode.dark);
        } else if (uri.queryParameters['theme'] == 'light') {
          ref.read(themeProvider.notifier).setTheme(ThemeMode.light);
        }
        if (uri.queryParameters['category'] != null) {
          ref
              .read(marketplaceProvider.notifier)
              .setCategory(uri.queryParameters['category']!);
        }
        if (uri.queryParameters['openCategory'] == 'true') {
          _showCategoryDropDrawer();
        }
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showLocationModal() {
    final state = ref.read(marketplaceProvider);
    final availableCities = state.items
        .map((it) => it.location)
        .where((loc) => loc.isNotEmpty)
        .toSet()
        .toList();

    LocationPickerModal.show(
      context: context,
      currentCity: state.selectedCity,
      availableCities: availableCities,
      onLocationSelected: (city) {
        ref.read(marketplaceProvider.notifier).setCity(city);
      },
    );
  }

  Widget _buildLocationButton(String selectedCity, bool isDark) {
    final isLocationSelected = selectedCity != 'All' && selectedCity.isNotEmpty;

    return InkWell(
      onTap: _showLocationModal,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: 44,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: isLocationSelected
              ? AppColors.primary.withValues(alpha: 0.12)
              : (isDark ? AppColors.darkInputBg : const Color(0xFFF8FAFC)),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isLocationSelected
                ? AppColors.primary
                : (isDark ? AppColors.darkInputBorder : Colors.grey.shade300),
            width: isLocationSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              LucideIcons.mapPin,
              size: 15,
              color: isLocationSelected
                  ? AppColors.primary
                  : (isDark ? AppColors.darkTextSecondary : Colors.grey.shade600),
            ),
            const SizedBox(width: 4),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 82),
              child: Text(
                isLocationSelected ? selectedCity : 'Location',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight:
                      isLocationSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isLocationSelected
                      ? AppColors.primary
                      : (isDark ? AppColors.darkTextPrimary : Colors.grey.shade800),
                ),
              ),
            ),
            const SizedBox(width: 2),
            if (isLocationSelected)
              GestureDetector(
                onTap: () {
                  ref.read(marketplaceProvider.notifier).setCity('All');
                },
                child: Container(
                  padding: const EdgeInsets.all(2),
                  child: const Icon(
                    LucideIcons.x,
                    size: 14,
                    color: AppColors.primary,
                  ),
                ),
              )
            else
              Icon(
                LucideIcons.chevronDown,
                size: 14,
                color: isDark ? AppColors.darkTextMuted : Colors.grey.shade500,
              ),
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // Compact Single-Row Filter Toolbar (5 Controls in exact order)
  // [ All Categories ▼ ] [ Newest First ] [ ♡ Saved ] [ Verified ] [ ☀/☾ ]
  // -------------------------------------------------------------
  Widget _buildCompactToolbar(
    MarketplaceState marketplaceState,
    bool isDark,
    ThemeNotifier themeNotifier,
  ) {
    final isCategoryActive =
        marketplaceState.selectedCategory != 'All' &&
        marketplaceState.selectedCategory.isNotEmpty;
    final activeCategory =
        _getActiveCategory(marketplaceState.selectedCategory);
    final isSavedActive = marketplaceState.favoritesOnly;
    final isVerifiedActive = marketplaceState.verifiedOnly;

    return Container(
      color: isDark ? AppColors.darkSurface : Colors.white,
      padding: const EdgeInsets.fromLTRB(8, 0, 8, 6),
      child: Row(
        children: [
          // 1. All Categories Dropdown (Compact size)
          Expanded(
            flex: 12,
            child: InkWell(
              key: const Key('marketplace_category_selector'),
              onTap: _showCategoryDropDrawer,
              borderRadius: BorderRadius.circular(8),
              child: Container(
                height: 34,
                padding: const EdgeInsets.symmetric(horizontal: 5),
                decoration: BoxDecoration(
                  color: isCategoryActive
                      ? AppColors.primary.withValues(alpha: 0.12)
                      : (isDark
                          ? AppColors.darkInputBg
                          : const Color(0xFFF8FAFC)),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isCategoryActive
                        ? AppColors.primary
                        : (isDark
                            ? AppColors.darkInputBorder
                            : Colors.grey.shade300),
                    width: isCategoryActive ? 1.4 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      activeCategory.icon,
                      size: 13,
                      color: isCategoryActive
                          ? AppColors.primary
                          : (isDark
                              ? AppColors.darkTextSecondary
                              : Colors.grey.shade600),
                    ),
                    const SizedBox(width: 3),
                    Expanded(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          activeCategory.label,
                          maxLines: 1,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: isCategoryActive
                                ? FontWeight.bold
                                : FontWeight.w500,
                            color: isCategoryActive
                                ? AppColors.primary
                                : (isDark
                                    ? AppColors.darkTextPrimary
                                    : Colors.grey.shade800),
                          ),
                        ),
                      ),
                    ),
                    if (isCategoryActive)
                      GestureDetector(
                        key: const Key('marketplace_category_clear'),
                        onTap: () {
                          ref
                              .read(marketplaceProvider.notifier)
                              .setCategory('All');
                        },
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          margin: const EdgeInsets.only(right: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            LucideIcons.x,
                            size: 10,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    Icon(
                      LucideIcons.chevronDown,
                      size: 11,
                      color: isCategoryActive
                          ? AppColors.primary
                          : (isDark
                              ? AppColors.darkTextMuted
                              : Colors.grey.shade500),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 3),

          // 2. Newest First (Sort Dropdown)
          Expanded(
            flex: 10,
            child: PopupMenuButton<String>(
              key: const Key('marketplace_sort_button'),
              initialValue: marketplaceState.sortOption,
              color: isDark ? AppColors.darkCard : Colors.white,
              onSelected: (val) {
                ref.read(marketplaceProvider.notifier).setSortOption(val);
              },
              itemBuilder: (context) => _sortOptions
                  .map(
                    (opt) => PopupMenuItem(
                      value: opt,
                      child: Text(
                        opt,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: marketplaceState.sortOption == opt
                              ? FontWeight.bold
                              : FontWeight.normal,
                          color: marketplaceState.sortOption == opt
                              ? AppColors.primary
                              : (isDark
                                  ? AppColors.darkTextPrimary
                                  : AppColors.textPrimary),
                        ),
                      ),
                    ),
                  )
                  .toList(),
              child: Container(
                height: 34,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: isDark
                      ? AppColors.darkInputBg
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isDark
                        ? AppColors.darkInputBorder
                        : Colors.grey.shade300,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      LucideIcons.arrowUpDown,
                      size: 11,
                      color: isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.textSecondary,
                    ),
                    const SizedBox(width: 3),
                    Expanded(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          marketplaceState.sortOption,
                          maxLines: 1,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: isDark
                                ? AppColors.darkTextPrimary
                                : AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 3),

          // 3. Saved Filter Button
          Expanded(
            flex: 8,
            child: InkWell(
              key: const Key('marketplace_saved_filter'),
              onTap: () {
                ref.read(marketplaceProvider.notifier).toggleFavoritesOnly();
              },
              borderRadius: BorderRadius.circular(8),
              child: Container(
                height: 34,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: isSavedActive
                      ? Colors.red.withValues(alpha: 0.12)
                      : (isDark
                          ? AppColors.darkInputBg
                          : const Color(0xFFF1F5F9)),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isSavedActive
                        ? Colors.red.withValues(alpha: 0.4)
                        : (isDark
                            ? AppColors.darkInputBorder
                            : Colors.grey.shade300),
                    width: isSavedActive ? 1.3 : 1,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      isSavedActive ? Icons.favorite : Icons.favorite_border,
                      size: 12,
                      color: isSavedActive
                          ? Colors.red
                          : (isDark
                              ? AppColors.darkTextSecondary
                              : Colors.grey.shade700),
                    ),
                    const SizedBox(width: 2),
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Saved',
                          maxLines: 1,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: isSavedActive
                                ? FontWeight.bold
                                : FontWeight.w500,
                            color: isSavedActive
                                ? Colors.red
                                : (isDark
                                    ? AppColors.darkTextPrimary
                                    : AppColors.textPrimary),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 3),

          // 4. Verified Filter Button
          Expanded(
            flex: 8,
            child: InkWell(
              key: const Key('marketplace_verified_filter'),
              onTap: () {
                ref.read(marketplaceProvider.notifier).toggleVerifiedOnly();
              },
              borderRadius: BorderRadius.circular(8),
              child: Container(
                height: 34,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: isVerifiedActive
                      ? Colors.blue.withValues(alpha: 0.12)
                      : (isDark
                          ? AppColors.darkInputBg
                          : const Color(0xFFF1F5F9)),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isVerifiedActive
                        ? Colors.blue.withValues(alpha: 0.4)
                        : (isDark
                            ? AppColors.darkInputBorder
                            : Colors.grey.shade300),
                    width: isVerifiedActive ? 1.3 : 1,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      LucideIcons.badgeCheck,
                      size: 12,
                      color: isVerifiedActive
                          ? Colors.blue
                          : (isDark
                              ? AppColors.darkTextSecondary
                              : Colors.grey.shade700),
                    ),
                    const SizedBox(width: 2),
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Verified',
                          maxLines: 1,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: isVerifiedActive
                                ? FontWeight.bold
                                : FontWeight.w500,
                            color: isVerifiedActive
                                ? Colors.blue
                                : (isDark
                                    ? AppColors.darkTextPrimary
                                    : AppColors.textPrimary),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 3),

          // 5. Day/Night Theme Toggle
          SizedBox(
            width: 34,
            height: 34,
            child: InkWell(
              key: const Key('marketplace_theme_toggle'),
              onTap: () {
                themeNotifier.toggleTheme();
              },
              borderRadius: BorderRadius.circular(8),
              child: Container(
                decoration: BoxDecoration(
                  color: isDark
                      ? AppColors.darkInputBg
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isDark
                        ? AppColors.darkInputBorder
                        : Colors.grey.shade300,
                  ),
                ),
                child: Center(
                  child: Icon(
                    isDark ? LucideIcons.moon : LucideIcons.sun,
                    size: 15,
                    color: isDark ? const Color(0xFFFACC15) : AppColors.primary,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showFilterModal([bool? isDarkOverride]) {
    final isDark = isDarkOverride ?? (Theme.of(context).brightness == Brightness.dark);
    final state = ref.read(marketplaceProvider);
    final minController = TextEditingController(
      text: state.minPrice != null ? state.minPrice!.toStringAsFixed(0) : '',
    );
    final maxController = TextEditingController(
      text: state.maxPrice != null ? state.maxPrice!.toStringAsFixed(0) : '',
    );
    final cityController = TextEditingController(
      text: state.selectedCity != 'All' ? state.selectedCity : '',
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.textPrimary;
        final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.textSecondary;
        final inputBorderColor = isDark ? AppColors.darkInputBorder : AppColors.borderLight;
        final inputFillColor = isDark ? AppColors.darkInputBg : Colors.white;

        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Filter Products',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: textPrimary,
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      ref.read(marketplaceProvider.notifier).resetFilters();
                      Navigator.pop(ctx);
                    },
                    child: const Text(
                      'Reset All',
                      style: TextStyle(color: AppColors.primary),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Price Range (₹)',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: minController,
                      keyboardType: TextInputType.number,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: InputDecoration(
                        labelText: 'Min Price',
                        labelStyle: TextStyle(color: textSecondary),
                        filled: true,
                        fillColor: inputFillColor,
                        enabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: inputBorderColor),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: const BorderSide(color: AppColors.primary),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        isDense: true,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: maxController,
                      keyboardType: TextInputType.number,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: InputDecoration(
                        labelText: 'Max Price',
                        labelStyle: TextStyle(color: textSecondary),
                        filled: true,
                        fillColor: inputFillColor,
                        enabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: inputBorderColor),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: const BorderSide(color: AppColors.primary),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        isDense: true,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'City / Location',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: cityController,
                style: TextStyle(color: textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Enter city (e.g. Coimbatore, Bengaluru)',
                  labelStyle: TextStyle(color: textSecondary),
                  filled: true,
                  fillColor: inputFillColor,
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: inputBorderColor),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(color: AppColors.primary),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  isDense: true,
                  prefixIcon: Icon(
                    LucideIcons.mapPin,
                    size: 18,
                    color: textSecondary,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: () {
                    final min = double.tryParse(minController.text);
                    final max = double.tryParse(maxController.text);
                    ref
                        .read(marketplaceProvider.notifier)
                        .setPriceRange(min, max);
                    final city = cityController.text.trim();
                    ref
                        .read(marketplaceProvider.notifier)
                        .setCity(city.isNotEmpty ? city : 'All');
                    Navigator.pop(ctx);
                  },
                  child: const Text(
                    'Apply Filters',
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final marketplaceState = ref.watch(marketplaceProvider);
    final items = marketplaceState.filteredItems;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeNotifier = ref.read(themeProvider.notifier);

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.scaffoldBg,
      appBar: const AppHeader(title: 'Marketplace'),
      drawer: const AppDrawer(),
      body: Column(
        children: [
          // -------------------------------------------------------------
          // 1. Search Bar & Filter Button
          // -------------------------------------------------------------
          Container(
            color: isDark ? AppColors.darkSurface : Colors.white,
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 8),
            child: Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: TextField(
                      controller: _searchController,
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? AppColors.darkTextPrimary : Colors.black,
                      ),
                      onChanged: (val) {
                        ref.read(marketplaceProvider.notifier).setSearch(val);
                      },
                      decoration: InputDecoration(
                        hintText: 'Search products...',
                        hintStyle: TextStyle(
                          fontSize: 13,
                          color: isDark ? AppColors.darkTextMuted : Colors.grey.shade400,
                        ),
                        prefixIcon: Icon(
                          LucideIcons.search,
                          size: 18,
                          color: isDark ? AppColors.darkTextSecondary : Colors.grey.shade600,
                        ),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: Icon(
                                  LucideIcons.x,
                                  size: 16,
                                  color: isDark ? AppColors.darkTextSecondary : Colors.grey.shade600,
                                ),
                                onPressed: () {
                                  _searchController.clear();
                                  ref
                                      .read(marketplaceProvider.notifier)
                                      .setSearch('');
                                },
                              )
                            : null,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 0,
                        ),
                        filled: true,
                        fillColor: isDark ? AppColors.darkInputBg : const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: isDark ? AppColors.darkInputBorder : Colors.grey.shade300,
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: isDark ? AppColors.darkInputBorder : Colors.grey.shade300,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.primary),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Location selector (in red-marked area between search and filter)
                _buildLocationButton(marketplaceState.selectedCity, isDark),

                const SizedBox(width: 8),

                // Filter button
                Container(
                  height: 44,
                  width: 44,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    onPressed: () => _showFilterModal(isDark),
                    icon: const Icon(
                      LucideIcons.slidersHorizontal,
                      size: 18,
                      color: Colors.white,
                    ),
                    tooltip: 'Filter options',
                  ),
                ),
              ],
            ),
          ),

          // -------------------------------------------------------------
          // 2. Compact Single-Row Filter Toolbar (5 Controls: Categories, Sort, Saved, Verified, Theme)
          // -------------------------------------------------------------
          _buildCompactToolbar(marketplaceState, isDark, themeNotifier),

          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 4),
            child: Row(
              children: [
                Text(
                  '${items.length} items',
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),

          // -------------------------------------------------------------
          // 3. Products & Posters Grid
          // -------------------------------------------------------------
          Expanded(
            child: marketplaceState.isLoading
                ? const Center(child: CircularProgressIndicator())
                : items.isEmpty
                ? _buildEmptyState(isDark)
                : RefreshIndicator(
                    onRefresh: () =>
                        ref.read(marketplaceProvider.notifier).refresh(),
                    child: GridView.builder(
                      padding: const EdgeInsets.fromLTRB(12, 4, 12, 20),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 12,
                            childAspectRatio: 0.68,
                          ),
                      itemCount: items.length,
                      itemBuilder: (context, i) {
                        final item = items[i];
                        return _buildProductCard(item, isDark);
                      },
                    ),
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/marketplace/add'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 4,
        shape: const CircleBorder(),
        tooltip: 'Add Product Listing',
        child: const Icon(LucideIcons.plus, size: 26),
      ),
    );
  }

  Widget _buildProductCard(MarketplaceItemModel item, bool isDark) {
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );
    final isFav = ref.watch(marketplaceProvider).isItemFavorite(item);
    final resolvedImageUrl = ApiConstants.resolveImageUrl(item.image);

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => ProductDetailsScreen(item: item)),
        );
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? AppColors.darkCardBorder : Colors.grey.shade200,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image Thumbnail
            Expanded(
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(13),
                    ),
                    child: Container(
                      width: double.infinity,
                      height: double.infinity,
                      color: isDark ? AppColors.darkInputBg : const Color(0xFFF8FAFC),
                      child: resolvedImageUrl.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: resolvedImageUrl,
                              fit: BoxFit.cover,
                              placeholder: (ctx, url) => const Center(
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.primary,
                                ),
                              ),
                              errorWidget: (ctx, url, err) => Center(
                                child: Icon(
                                  LucideIcons.image,
                                  size: 36,
                                  color: isDark ? AppColors.darkTextMuted : Colors.grey.shade300,
                                ),
                              ),
                            )
                          : Center(
                              child: Icon(
                                LucideIcons.store,
                                size: 36,
                                color: isDark ? AppColors.darkTextMuted : Colors.grey.shade300,
                              ),
                            ),
                    ),
                  ),

                  // Favorite Button
                  Positioned(
                    top: 6,
                    right: 6,
                    child: GestureDetector(
                      onTap: () {
                        ref
                            .read(marketplaceProvider.notifier)
                            .toggleFavorite(item.id);
                      },
                      child: Container(
                        padding: const EdgeInsets.all(5),
                        decoration: BoxDecoration(
                          color: (isDark ? AppColors.darkSurface : Colors.white)
                              .withValues(alpha: 0.9),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isFav ? Icons.favorite : Icons.favorite_border,
                          size: 16,
                          color: isFav
                              ? Colors.red
                              : (isDark ? AppColors.darkTextSecondary : Colors.grey.shade700),
                        ),
                      ),
                    ),
                  ),

                  // Category Badge
                  Positioned(
                    bottom: 6,
                    left: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.75),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        item.category.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 8,
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Product Details Summary
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    formatter.format(item.price),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          item.location,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 10,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                          ),
                        ),
                      ),
                      Text(
                        item.timeAgo,
                        style: TextStyle(
                          fontSize: 9,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    final state = ref.watch(marketplaceProvider);
    final isCityFiltered =
        state.selectedCity != 'All' && state.selectedCity.isNotEmpty;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.store,
                size: 40,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              isCityFiltered
                  ? 'No Products in ${state.selectedCity}'
                  : 'No Products Found',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isCityFiltered
                  ? 'We couldn\'t find any listings matching "${state.selectedCity}". Try selecting another city or reset your filters.'
                  : 'Try changing your search query or reset filters to explore more items.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (isCityFiltered) ...[
                  OutlinedButton.icon(
                    onPressed: () {
                      ref.read(marketplaceProvider.notifier).setCity('All');
                    },
                    icon: const Icon(LucideIcons.mapPinOff, size: 16),
                    label: const Text('Clear Location'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                ElevatedButton(
                  onPressed: () {
                    _searchController.clear();
                    ref.read(marketplaceProvider.notifier).resetFilters();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Reset All Filters'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
