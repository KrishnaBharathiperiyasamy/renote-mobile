import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/constants/app_colors.dart';
import '../../../models/product_model.dart';
import '../../../providers/company_provider.dart';
import '../../../providers/product_provider.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_header.dart';

class ProductsScreen extends ConsumerStatefulWidget {
  const ProductsScreen({super.key});

  @override
  ConsumerState<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends ConsumerState<ProductsScreen> {
  final TextEditingController _searchController = TextEditingController();
  final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  bool _selectionMode = false;
  final Set<String> _selectedProductIds = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(productProvider.notifier).loadProducts();
      ref.read(companyProvider.notifier).loadCompanies();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openProductForm([ProductModel? existingProduct]) {
    final companyState = ref.read(companyProvider);
    if (companyState.companies.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Please register a business profile first before adding products.',
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AddProductModal(existingProduct: existingProduct),
    );
  }

  void _openFilterDrawer() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _FilterDrawer(),
    );
  }

  void _confirmDeleteSingle(ProductModel product) {
    showDialog(
      context: context,
      builder: (context) => _DeleteConfirmDialog(
        title: 'Delete Product',
        message:
            'Are you sure want to delete "${product.name}" from your warehouse?',
        onConfirm: () async {
          Navigator.pop(context);
          final messenger = ScaffoldMessenger.of(context);
          final success = await ref
              .read(productProvider.notifier)
              .deleteProduct(product.id);
          messenger.showSnackBar(
            SnackBar(
              content: Text(
                success
                    ? 'Product deleted successfully'
                    : 'Failed to delete product',
              ),
              backgroundColor: success ? AppColors.success : AppColors.error,
            ),
          );
        },
      ),
    );
  }

  void _confirmDeleteMultiple() {
    if (_selectedProductIds.isEmpty) return;

    showDialog(
      context: context,
      builder: (context) => _DeleteConfirmDialog(
        title: 'Delete Selected Products',
        message:
            'Are you sure want to delete ${_selectedProductIds.length} selected product(s)?',
        onConfirm: () async {
          Navigator.pop(context);
          final messenger = ScaffoldMessenger.of(context);
          final ids = _selectedProductIds.toList();
          final success = await ref
              .read(productProvider.notifier)
              .deleteMultipleProducts(ids);
          setState(() {
            _selectedProductIds.clear();
            _selectionMode = false;
          });
          messenger.showSnackBar(
            SnackBar(
              content: Text(
                success
                    ? '${ids.length} products deleted successfully'
                    : 'Failed to delete products',
              ),
              backgroundColor: success ? AppColors.success : AppColors.error,
            ),
          );
        },
      ),
    );
  }

  void _toggleSelect(String id) {
    setState(() {
      if (_selectedProductIds.contains(id)) {
        _selectedProductIds.remove(id);
      } else {
        _selectedProductIds.add(id);
      }
    });
  }

  void _toggleSelectAll(List<ProductModel> products) {
    setState(() {
      if (_selectedProductIds.length == products.length) {
        _selectedProductIds.clear();
      } else {
        _selectedProductIds.addAll(products.map((p) => p.id));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final state = ref.watch(productProvider);
    final products = state.filteredProducts;
    final companyState = ref.watch(companyProvider);

    // Map company IDs to names
    final companyMap = <String, String>{};
    for (final c in companyState.companies) {
      companyMap[c.id] = c.name;
    }

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : const Color(0xFFF9FAFB),
      appBar: const AppHeader(title: 'Warehouse'),
      drawer: const AppDrawer(),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () => ref.read(productProvider.notifier).loadProducts(),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ── 1. KPI SUMMARY METRIC CARDS MATCHING NEXT.JS ──
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                child: Row(
                  children: [
                    // Total Products Card
                    Expanded(
                      child: _KpiMetricCard(
                        title: 'TOTAL PRODUCTS',
                        value: '${state.totalProducts}',
                        icon: LucideIcons.package,
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Stock Quantity Card
                    Expanded(
                      child: _KpiMetricCard(
                        title: 'STOCK QTY',
                        value: state.totalStock.toStringAsFixed(0),
                        icon: LucideIcons.boxes,
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Stock Value / Valuation Card
                    Expanded(
                      child: _KpiMetricCard(
                        title: 'STOCK VALUE',
                        value: _currencyFormat.format(state.totalValuation),
                        icon: LucideIcons.indianRupee,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── 2. SEARCH BAR & COMPANY SELECTOR ──
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 4,
                ),
                child: Column(
                  children: [
                    // Search and Filter Bar
                    Row(
                      children: [
                        // Search Field
                        Expanded(
                          child: Container(
                            height: 42,
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkInputBg : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isDark ? AppColors.darkInputBorder : const Color(0xFFD1D5DB),
                              ),
                              boxShadow: isDark
                                  ? const []
                                  : const [
                                      BoxShadow(
                                        color: Color(0x08000000),
                                        blurRadius: 4,
                                        offset: Offset(0, 1),
                                      ),
                                    ],
                            ),
                            child: TextField(
                              controller: _searchController,
                              onChanged: (val) => ref
                                  .read(productProvider.notifier)
                                  .setSearch(val),
                              style: TextStyle(
                                fontSize: 13,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                              ),
                              decoration: InputDecoration(
                                hintText: 'Search products, HSN...',
                                hintStyle: TextStyle(
                                  fontSize: 12.5,
                                  color: isDark ? AppColors.darkTextSecondary : const Color(0xFF9CA3AF),
                                ),
                                prefixIcon: Icon(
                                  LucideIcons.search,
                                  size: 16,
                                  color: isDark ? AppColors.darkTextSecondary : const Color(0xFF9CA3AF),
                                ),
                                suffixIcon: _searchController.text.isNotEmpty
                                    ? IconButton(
                                        icon: Icon(
                                          LucideIcons.x,
                                          size: 14,
                                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                        ),
                                        onPressed: () {
                                          _searchController.clear();
                                          ref
                                              .read(productProvider.notifier)
                                              .setSearch('');
                                        },
                                      )
                                    : null,
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 11,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Filter Button
                        InkWell(
                          onTap: _openFilterDrawer,
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            height: 42,
                            width: 42,
                            decoration: BoxDecoration(
                              color: state.hasActiveFilters
                                  ? (isDark ? const Color(0x30F65E1B) : const Color(0xFFFFF4ED))
                                  : (isDark ? AppColors.darkCard : Colors.white),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: state.hasActiveFilters
                                    ? AppColors.primary
                                    : (isDark ? AppColors.darkCardBorder : const Color(0xFFD1D5DB)),
                              ),
                            ),
                            child: Icon(
                              LucideIcons.filter,
                              size: 17,
                              color: state.hasActiveFilters
                                  ? AppColors.primary
                                  : (isDark ? AppColors.darkTextSecondary : const Color(0xFF4B5563)),
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Company filter chips
                    if (companyState.companies.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _CompanyChip(
                              label: 'All Companies',
                              isSelected:
                                  state.selectedCompanyId == null ||
                                  state.selectedCompanyId == 'All',
                              onTap: () => ref
                                  .read(productProvider.notifier)
                                  .setCompanyFilter(null),
                            ),
                            ...companyState.companies.map((c) {
                              return _CompanyChip(
                                label: c.name,
                                isSelected: state.selectedCompanyId == c.id,
                                onTap: () => ref
                                    .read(productProvider.notifier)
                                    .setCompanyFilter(c.id),
                              );
                            }),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 10),

                    // Action Toolbar: Select mode / Add Product
                    Row(
                      children: [
                        if (_selectionMode) ...[
                          TextButton(
                            onPressed: () {
                              setState(() {
                                _selectionMode = false;
                                _selectedProductIds.clear();
                              });
                            },
                            child: const Text(
                              'Cancel',
                              style: TextStyle(
                                color: Color(0xFFEA580C),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const Spacer(),
                          if (_selectedProductIds.isNotEmpty)
                            ElevatedButton.icon(
                              onPressed: _confirmDeleteMultiple,
                              icon: const Icon(
                                LucideIcons.trash2,
                                size: 14,
                                color: Colors.white,
                              ),
                              label: Text(
                                'Delete (${_selectedProductIds.length})',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFDC2626),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                          const SizedBox(width: 8),
                          InkWell(
                            onTap: () => _toggleSelectAll(products),
                            child: Row(
                              children: [
                                Checkbox(
                                  value:
                                      products.isNotEmpty &&
                                      _selectedProductIds.length ==
                                          products.length,
                                  onChanged: (_) => _toggleSelectAll(products),
                                  activeColor: const Color(0xFFEA580C),
                                  visualDensity: VisualDensity.compact,
                                ),
                                const Text(
                                  'Select All',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFFEA580C),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ] else ...[
                          Text(
                            '${products.length} Products found',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark ? AppColors.darkTextSecondary : const Color(0xFF6B7280),
                            ),
                          ),
                          const Spacer(),
                          OutlinedButton.icon(
                            onPressed: () =>
                                setState(() => _selectionMode = true),
                            icon: Icon(
                              LucideIcons.checkSquare,
                              size: 14,
                              color: isDark ? AppColors.darkTextSecondary : const Color(0xFF4B5563),
                            ),
                            label: Text(
                              'Select',
                              style: TextStyle(
                                color: isDark ? AppColors.darkTextSecondary : const Color(0xFF4B5563),
                                fontSize: 12,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(
                                color: isDark ? AppColors.darkCardBorder : const Color(0xFFD1D5DB),
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton.icon(
                            onPressed: () => _openProductForm(),
                            icon: const Icon(
                              LucideIcons.plus,
                              size: 14,
                              color: Colors.white,
                            ),
                            label: const Text(
                              'Add Product',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFF5722),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // ── 3. PRODUCT CARDS LIST ──
            if (state.isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (products.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0x30FB923C) : const Color(0xFFFFF7ED),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            LucideIcons.package,
                            size: 32,
                            color: Color(0xFFFB923C),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'No warehouse products found',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: isDark ? AppColors.darkTextPrimary : const Color(0xFF374151),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Add items to your inventory to track stock and generate instant invoices.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12.5,
                            color: isDark ? AppColors.darkTextSecondary : const Color(0xFF6B7280),
                          ),
                        ),
                        const SizedBox(height: 18),
                        ElevatedButton.icon(
                          onPressed: () => _openProductForm(),
                          icon: const Icon(
                            LucideIcons.plus,
                            size: 15,
                            color: Colors.white,
                          ),
                          label: const Text(
                            'Add Product',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFFF5722),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 11,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final product = products[index];
                    final isSelected = _selectedProductIds.contains(product.id);
                    final companyName = companyMap[product.companyId];

                    return _ExactProductCard(
                      product: product,
                      companyName: companyName,
                      selectionMode: _selectionMode,
                      isSelected: isSelected,
                      onToggleSelect: () => _toggleSelect(product.id),
                      onToggleFavorite: () => ref
                          .read(productProvider.notifier)
                          .toggleFavorite(product.id),
                      onEdit: () => _openProductForm(product),
                      onDelete: () => _confirmDeleteSingle(product),
                    );
                  }, childCount: products.length),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// ── KPI Metric Card matching Next.js Product Warehouse top metrics ──
class _KpiMetricCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;

  const _KpiMetricCard({
    required this.title,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? AppColors.darkCardBorder : const Color(0xFFE5E7EB),
        ),
        boxShadow: isDark
            ? const []
            : const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 4,
                  offset: Offset(0, 1),
                ),
              ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                    color: isDark ? AppColors.darkTextSecondary : const Color(0xFF6B7280),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: isDark ? AppColors.darkTextPrimary : const Color(0xFF111827),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: isDark ? const Color(0x30EA580C) : const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isDark ? const Color(0x50EA580C) : const Color(0xFFFED7AA),
              ),
            ),
            child: Icon(icon, size: 16, color: const Color(0xFFEA580C)),
          ),
        ],
      ),
    );
  }
}

/// ── Company Filter Chip ──
class _CompanyChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _CompanyChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark ? const Color(0x30FF5722) : const Color(0xFFFFF4ED))
                : (isDark ? AppColors.darkCard : Colors.white),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFFFF5722)
                  : (isDark ? AppColors.darkCardBorder : const Color(0xFFE5E7EB)),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected
                  ? const Color(0xFFFF5722)
                  : (isDark ? AppColors.darkTextSecondary : const Color(0xFF4B5563)),
            ),
          ),
        ),
      ),
    );
  }
}

/// ── Exact Product Card matching Next.js ProductWarehousePage mobile layout ──
class _ExactProductCard extends StatelessWidget {
  final ProductModel product;
  final String? companyName;
  final bool selectionMode;
  final bool isSelected;
  final VoidCallback onToggleSelect;
  final VoidCallback onToggleFavorite;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ExactProductCard({
    required this.product,
    this.companyName,
    required this.selectionMode,
    required this.isSelected,
    required this.onToggleSelect,
    required this.onToggleFavorite,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected
              ? const Color(0xFFFF5722)
              : (isDark ? AppColors.darkCardBorder : const Color(0xFFE5E7EB)),
          width: isSelected ? 1.5 : 1,
        ),
        boxShadow: isDark
            ? const []
            : const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 6,
                  offset: Offset(0, 2),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: selectionMode ? onToggleSelect : null,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Checkbox/Favorite + Name + Price
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    if (selectionMode) ...[
                      Checkbox(
                        value: isSelected,
                        onChanged: (_) => onToggleSelect(),
                        activeColor: const Color(0xFFFF5722),
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                    // Favorite Heart Button
                    InkWell(
                      onTap: onToggleFavorite,
                      borderRadius: BorderRadius.circular(20),
                      child: Padding(
                        padding: const EdgeInsets.all(4),
                        child: Icon(
                          LucideIcons.heart,
                          size: 17,
                          color: product.isFavorite
                              ? const Color(0xFFEF4444)
                              : (isDark ? AppColors.darkTextSecondary : const Color(0xFFD1D5DB)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),

                    // Product Name
                    Expanded(
                      child: Text(
                        product.name,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: isDark ? AppColors.darkTextPrimary : const Color(0xFF111827),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Selling Price
                    Text(
                      '₹ ${product.price.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFEA580C),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                // Middle Row: Company Badge + Qty + GST + HSN
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    if (companyName != null && companyName!.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: isDark ? const Color(0xFF334155) : const Color(0xFFBFDBFE),
                          ),
                        ),
                        child: Text(
                          companyName!,
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                            color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1D4ED8),
                          ),
                        ),
                      ),
                    Text(
                      'Qty: ${product.qty.toStringAsFixed(0)} ${product.unit}',
                      style: TextStyle(
                        fontSize: 11.5,
                        color: isDark ? AppColors.darkTextSecondary : const Color(0xFF6B7280),
                      ),
                    ),
                    Text(
                      '•',
                      style: TextStyle(
                        color: isDark ? AppColors.darkTextSecondary : const Color(0xFF9CA3AF),
                        fontSize: 10,
                      ),
                    ),
                    Text(
                      'GST: ${product.gst.toStringAsFixed(0)}%',
                      style: TextStyle(
                        fontSize: 11.5,
                        color: isDark ? AppColors.darkTextSecondary : const Color(0xFF6B7280),
                      ),
                    ),
                    if (product.hsn != null && product.hsn!.isNotEmpty) ...[
                      Text(
                        '•',
                        style: TextStyle(
                          color: isDark ? AppColors.darkTextSecondary : const Color(0xFF9CA3AF),
                          fontSize: 10,
                        ),
                      ),
                      Text(
                        'HSN: ${product.hsn}',
                        style: TextStyle(
                          fontSize: 11.5,
                          color: isDark ? AppColors.darkTextSecondary : const Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ],
                ),

                // Description (if present)
                if (product.description != null &&
                    product.description!.isNotEmpty) ...[
                  const SizedBox(height: 5),
                  Text(
                    product.description!,
                    style: TextStyle(
                      fontSize: 11.5,
                      color: isDark ? AppColors.darkTextSecondary : const Color(0xFF9CA3AF),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],

                // Action Row: Edit & Delete Icons
                if (!selectionMode) ...[
                  const SizedBox(height: 8),
                  Divider(
                    height: 1,
                    color: isDark ? AppColors.darkCardBorder : const Color(0xFFF3F4F6),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      InkWell(
                        onTap: onEdit,
                        borderRadius: BorderRadius.circular(6),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          child: Icon(
                            LucideIcons.pencil,
                            size: 15,
                            color: isDark ? AppColors.darkTextSecondary : const Color(0xFF6B7280),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: onDelete,
                        borderRadius: BorderRadius.circular(6),
                        child: const Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          child: Icon(
                            LucideIcons.trash2,
                            size: 15,
                            color: Color(0xFFDC2626),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// ── Add / Edit Product Modal matching AddProductModal index.tsx ──
class _AddProductModal extends ConsumerStatefulWidget {
  final ProductModel? existingProduct;

  const _AddProductModal({this.existingProduct});

  @override
  ConsumerState<_AddProductModal> createState() => _AddProductModalState();
}

class _AddProductModalState extends ConsumerState<_AddProductModal> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _priceController;
  late TextEditingController _qtyController;
  late TextEditingController _hsnController;
  late TextEditingController _descController;
  String _selectedUnit = 'PCS';
  double _selectedGst = 18.0;
  String? _selectedCompanyId;
  bool _isSaving = false;

  /// Standard units matching Next.js unitOptions.ts
  final List<String> _unitOptions = [
    'PCS',
    'KG',
    'BAG',
    'BX',
    'BND',
    'CTN',
    'DZ',
    'EA',
    'FT',
    'LOT',
    'M',
    'PK',
    'SET',
    'SQFT',
    'YD',
  ];

  /// Standard GST options matching Next.js gstOptions.ts
  final List<double> _gstOptions = [0, 5, 12, 18, 28, 40];

  @override
  void initState() {
    super.initState();
    final p = widget.existingProduct;
    _nameController = TextEditingController(text: p?.name ?? '');
    _priceController = TextEditingController(
      text: p != null ? p.price.toStringAsFixed(0) : '',
    );
    _qtyController = TextEditingController(
      text: p != null ? p.qty.toStringAsFixed(0) : '1',
    );
    _hsnController = TextEditingController(text: p?.hsn ?? '');
    _descController = TextEditingController(text: p?.description ?? '');

    if (p?.unit != null && _unitOptions.contains(p!.unit.toUpperCase())) {
      _selectedUnit = p.unit.toUpperCase();
    }
    if (p?.gst != null && _gstOptions.contains(p!.gst)) {
      _selectedGst = p.gst;
    }
    _selectedCompanyId = p?.companyId;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _priceController.dispose();
    _qtyController.dispose();
    _hsnController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final companyState = ref.read(companyProvider);
    final targetCompanyId =
        _selectedCompanyId ??
        (companyState.companies.isNotEmpty
            ? companyState.companies.first.id
            : '');

    if (targetCompanyId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a company for this product'),
        ),
      );
      return;
    }

    setState(() => _isSaving = true);
    final isEdit = widget.existingProduct != null;

    final productData = ProductModel(
      id: widget.existingProduct?.id ?? '',
      name: _nameController.text.trim(),
      price: double.tryParse(_priceController.text.trim()) ?? 0.0,
      qty: double.tryParse(_qtyController.text.trim()) ?? 1.0,
      unit: _selectedUnit,
      gst: _selectedGst,
      hsn: _hsnController.text.trim().isNotEmpty
          ? _hsnController.text.trim()
          : null,
      description: _descController.text.trim().isNotEmpty
          ? _descController.text.trim()
          : null,
      companyId: targetCompanyId,
      isFavorite: widget.existingProduct?.isFavorite ?? false,
    );

    bool success;
    if (isEdit) {
      success = await ref
          .read(productProvider.notifier)
          .updateProduct(productData, targetCompanyId);
    } else {
      success = await ref
          .read(productProvider.notifier)
          .addProduct(productData, targetCompanyId);
    }

    if (mounted) {
      setState(() => _isSaving = false);
      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isEdit
                  ? 'Product updated successfully'
                  : 'Product created successfully',
            ),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to save product. Please check connection.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isEdit = widget.existingProduct != null;
    final companyState = ref.watch(companyProvider);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isEdit ? 'Edit Product' : 'Add Product',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: isDark ? AppColors.darkTextPrimary : const Color(0xFF111827),
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        LucideIcons.x,
                        size: 20,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                Divider(
                  color: isDark ? AppColors.darkCardBorder : const Color(0xFFE5E7EB),
                ),
                const SizedBox(height: 10),

                // Company Selector
                if (companyState.companies.isNotEmpty) ...[
                  DropdownButtonFormField<String>(
                    initialValue:
                        _selectedCompanyId ??
                        (companyState.companies.isNotEmpty
                            ? companyState.companies.first.id
                            : null),
                    decoration: InputDecoration(
                      labelText: 'Company *',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                    ),
                    items: companyState.companies.map((c) {
                      return DropdownMenuItem(
                        value: c.id,
                        child: Text(
                          c.name,
                          style: const TextStyle(fontSize: 13),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedCompanyId = val);
                    },
                  ),
                  const SizedBox(height: 12),
                ],

                // Product Name *
                TextFormField(
                  controller: _nameController,
                  style: const TextStyle(fontSize: 13.5),
                  decoration: InputDecoration(
                    labelText: 'Product Name *',
                    hintText: 'e.g. Wireless Mouse, Cotton Shirt',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                  ),
                  validator: (val) => val == null || val.trim().isEmpty
                      ? 'Product name is required'
                      : null,
                ),
                const SizedBox(height: 12),

                // Price & Quantity Row
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _priceController,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(fontSize: 13.5),
                        decoration: InputDecoration(
                          labelText: 'Selling Price (₹) *',
                          hintText: '0.00',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                        ),
                        validator: (val) => val == null || val.trim().isEmpty
                            ? 'Price is required'
                            : null,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextFormField(
                        controller: _qtyController,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(fontSize: 13.5),
                        decoration: InputDecoration(
                          labelText: 'Stock Quantity',
                          hintText: '1',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Unit & GST Row
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _selectedUnit,
                        decoration: InputDecoration(
                          labelText: 'Unit *',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                        ),
                        items: _unitOptions.map((u) {
                          return DropdownMenuItem(
                            value: u,
                            child: Text(
                              u,
                              style: const TextStyle(fontSize: 13),
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedUnit = val);
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DropdownButtonFormField<double>(
                        initialValue: _selectedGst,
                        decoration: InputDecoration(
                          labelText: 'GST Rate (%) *',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                        ),
                        items: _gstOptions.map((g) {
                          return DropdownMenuItem(
                            value: g,
                            child: Text(
                              '$g%',
                              style: const TextStyle(fontSize: 13),
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedGst = val);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // HSN Code
                TextFormField(
                  controller: _hsnController,
                  style: const TextStyle(fontSize: 13.5),
                  decoration: InputDecoration(
                    labelText: 'HSN / SAC Code (Optional)',
                    hintText: 'e.g. 84713010',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Description
                TextFormField(
                  controller: _descController,
                  maxLines: 2,
                  style: const TextStyle(fontSize: 13.5),
                  decoration: InputDecoration(
                    labelText: 'Description (Optional)',
                    hintText: 'Item specifications, color, warranty',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Action Buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Cancel',
                        style: TextStyle(color: Color(0xFF4B5563)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton(
                      onPressed: _isSaving ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFF5722),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isSaving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              isEdit ? 'Update Product' : 'Save Product',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// ── Filter Drawer BottomSheet matching FilterPanel/page.tsx ──
class _FilterDrawer extends ConsumerStatefulWidget {
  const _FilterDrawer();

  @override
  ConsumerState<_FilterDrawer> createState() => _FilterDrawerState();
}

class _FilterDrawerState extends ConsumerState<_FilterDrawer> {
  late TextEditingController _minPriceController;
  late TextEditingController _maxPriceController;
  bool _favoritesOnly = false;
  String? _sortOption;

  @override
  void initState() {
    super.initState();
    final current = ref.read(productProvider);
    _minPriceController = TextEditingController(
      text: current.minPrice?.toStringAsFixed(0) ?? '',
    );
    _maxPriceController = TextEditingController(
      text: current.maxPrice?.toStringAsFixed(0) ?? '',
    );
    _favoritesOnly = current.favoritesOnly;
    _sortOption = current.sortOption;
  }

  @override
  void dispose() {
    _minPriceController.dispose();
    _maxPriceController.dispose();
    super.dispose();
  }

  void _apply() {
    final min = double.tryParse(_minPriceController.text.trim());
    final max = double.tryParse(_maxPriceController.text.trim());
    ref
        .read(productProvider.notifier)
        .setFilters(
          minPrice: min,
          maxPrice: max,
          favoritesOnly: _favoritesOnly,
          sortOption: _sortOption,
        );
    Navigator.pop(context);
  }

  void _reset() {
    ref.read(productProvider.notifier).resetFilters();
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(20),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Filters & Sort',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDark ? AppColors.darkTextPrimary : const Color(0xFF111827),
                  ),
                ),
                IconButton(
                  icon: Icon(
                    LucideIcons.x,
                    size: 20,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            Divider(
              color: isDark ? AppColors.darkCardBorder : const Color(0xFFE5E7EB),
            ),
            const SizedBox(height: 10),

            // Price Range
            Text(
              'Price Range (₹)',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextSecondary : const Color(0xFF374151),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _minPriceController,
                    keyboardType: TextInputType.number,
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Min Price',
                      hintStyle: TextStyle(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.textMuted,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _maxPriceController,
                    keyboardType: TextInputType.number,
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Max Price',
                      hintStyle: TextStyle(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.textMuted,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Sort Options
            Text(
              'Sort By',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextSecondary : const Color(0xFF374151),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                _sortChip('Price: Low to High', 'price_asc', isDark),
                _sortChip('Price: High to Low', 'price_desc', isDark),
                _sortChip('Name: A to Z', 'name_asc', isDark),
              ],
            ),
            const SizedBox(height: 14),

            // Favorites Only Checkbox
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(
                'Favorites Only ❤️',
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                ),
              ),
              value: _favoritesOnly,
              activeColor: const Color(0xFFFF5722),
              onChanged: (val) => setState(() => _favoritesOnly = val ?? false),
            ),
            const SizedBox(height: 16),

            // Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _reset,
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                        color: isDark ? AppColors.darkCardBorder : const Color(0xFFD1D5DB),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      'Reset All',
                      style: TextStyle(
                        color: isDark ? AppColors.darkTextSecondary : const Color(0xFF4B5563),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _apply,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF5722),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'Apply Filters',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _sortChip(String label, String value, bool isDark) {
    final isSelected = _sortOption == value;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: 11.5,
          color: isSelected ? Colors.white : (isDark ? AppColors.darkTextSecondary : const Color(0xFF374151)),
        ),
      ),
      selected: isSelected,
      selectedColor: const Color(0xFFFF5722),
      backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
      side: BorderSide(
        color: isSelected ? const Color(0xFFFF5722) : (isDark ? AppColors.darkCardBorder : const Color(0xFFD1D5DB)),
      ),
      onSelected: (selected) {
        setState(() => _sortOption = selected ? value : null);
      },
    );
  }
}

/// ── Confirmation Dialog matching Next.js ConfirmationPopUp ──
class _DeleteConfirmDialog extends StatelessWidget {
  final String title;
  final String message;
  final VoidCallback onConfirm;

  const _DeleteConfirmDialog({
    required this.title,
    required this.message,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: const BoxDecoration(
                color: Color(0xFFFEE2E2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.alertTriangle,
                color: Color(0xFFDC2626),
                size: 28,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextPrimary : const Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13.5,
                color: isDark ? AppColors.darkTextSecondary : const Color(0xFF4B5563),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                        color: isDark ? AppColors.darkCardBorder : const Color(0xFFD1D5DB),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      'No',
                      style: TextStyle(
                        color: isDark ? AppColors.darkTextSecondary : const Color(0xFF4B5563),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: onConfirm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFDC2626),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'Yes, Delete',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
