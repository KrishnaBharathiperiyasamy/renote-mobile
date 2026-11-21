import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/constants/app_colors.dart';
import '../../../models/quotation_model.dart';
import '../../../providers/company_provider.dart';
import '../../../providers/quotation_provider.dart';
import '../../../providers/theme_provider.dart';
import '../../../services/pdf_service.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/brand_flame_logo.dart';

class QuotationsScreen extends ConsumerStatefulWidget {
  const QuotationsScreen({super.key});

  @override
  ConsumerState<QuotationsScreen> createState() => _QuotationsScreenState();
}

class _QuotationsScreenState extends ConsumerState<QuotationsScreen> {
  final TextEditingController _searchController = TextEditingController();
  final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 2,
  );

  bool _isFilterExpanded = false;
  final Set<String> _selectedIds = {};

  final TextEditingController _minPriceController = TextEditingController();
  final TextEditingController _maxPriceController = TextEditingController();
  DateTime? _startDate;
  DateTime? _endDate;
  bool _favoritesOnly = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        final uri = GoRouterState.of(context).uri;
        if (uri.queryParameters['theme'] == 'dark') {
          ref.read(themeProvider.notifier).setTheme(ThemeMode.dark);
        } else if (uri.queryParameters['theme'] == 'light') {
          ref.read(themeProvider.notifier).setTheme(ThemeMode.light);
        }
      } catch (_) {}
      ref.read(quotationProvider.notifier).loadQuotations();
      ref.read(companyProvider.notifier).loadCompanies();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _minPriceController.dispose();
    _maxPriceController.dispose();
    super.dispose();
  }

  void _applyFilterState() {
    final min = double.tryParse(_minPriceController.text.trim());
    final max = double.tryParse(_maxPriceController.text.trim());
    ref
        .read(quotationProvider.notifier)
        .setFilters(
          minPrice: min,
          maxPrice: max,
          startDate: _startDate,
          endDate: _endDate,
          favoritesOnly: _favoritesOnly,
        );
  }

  void _resetFilterState() {
    _minPriceController.clear();
    _maxPriceController.clear();
    setState(() {
      _startDate = null;
      _endDate = null;
      _favoritesOnly = false;
    });
    ref.read(quotationProvider.notifier).resetFilters();
  }

  void _handleSelectAll(List<QuotationModel> currentList) {
    setState(() {
      if (_selectedIds.length == currentList.length) {
        _selectedIds.clear();
      } else {
        _selectedIds.clear();
        for (final q in currentList) {
          _selectedIds.add(q.id);
        }
      }
    });
  }

  void _toggleSelect(String id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
      } else {
        _selectedIds.add(id);
      }
    });
  }

  void _confirmDelete(QuotationModel quotation) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: isDark ? AppColors.darkCard : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? AppColors.danger.withAlpha(30) : AppColors.dangerBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                LucideIcons.trash2,
                color: AppColors.error,
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'Delete Estimate?',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
              ),
            ),
          ],
        ),
        content: Text(
          'Are you sure you want to delete #${quotation.estimateId}? This action cannot be undone.',
          style: TextStyle(
            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
            fontSize: 13,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: TextStyle(
                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
              ),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(context);
              final success = await ref
                  .read(quotationProvider.notifier)
                  .deleteQuotation(quotation.id);
              if (mounted) {
                setState(() => _selectedIds.remove(quotation.id));
              }
              messenger.showSnackBar(
                SnackBar(
                  content: Text(
                    success
                        ? 'Estimate #${quotation.estimateId} deleted successfully'
                        : 'Failed to delete estimate',
                  ),
                  backgroundColor: success
                      ? AppColors.success
                      : AppColors.error,
                ),
              );
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _confirmBulkDelete() {
    if (_selectedIds.isEmpty) return;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: isDark ? AppColors.darkCard : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? AppColors.danger.withAlpha(30) : AppColors.dangerBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                LucideIcons.trash2,
                color: AppColors.error,
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'Delete Selected?',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
              ),
            ),
          ],
        ),
        content: Text(
          'Are you sure you want to delete ${_selectedIds.length} selected estimate(s)? This action cannot be undone.',
          style: TextStyle(
            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
            fontSize: 13,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: TextStyle(
                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
              ),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(context);
              final ids = _selectedIds.toList();
              final success = await ref
                  .read(quotationProvider.notifier)
                  .deleteMultipleQuotations(ids);
              if (mounted) {
                setState(() => _selectedIds.clear());
              }
              messenger.showSnackBar(
                SnackBar(
                  content: Text(
                    success
                        ? '${ids.length} estimate(s) deleted successfully'
                        : 'Failed to delete selected estimates',
                  ),
                  backgroundColor: success
                      ? AppColors.success
                      : AppColors.error,
                ),
              );
            },
            child: const Text(
              'Delete All',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  void _showPreviewModal(QuotationModel quotation) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 500),
          decoration: BoxDecoration(
            color: const Color(0xFF16181E),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0x20FFFFFF)),
            boxShadow: const [
              BoxShadow(
                color: Colors.black54,
                blurRadius: 20,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const BrandFlameLogo(size: 28),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Estimate #${quotation.estimateId}',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              quotation.vendorCompanyName ??
                                  'KrishTech Computers',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.darkTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(
                        LucideIcons.x,
                        color: Colors.white70,
                        size: 20,
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(color: Color(0x15FFFFFF), height: 1),

              // Content Body (Scrollable)
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Customer & Valuation Overview
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1B1E26),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0x15FFFFFF)),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'CUSTOMER DETAILS',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.darkTextMuted,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        quotation.customerName ??
                                            'Walk-in Client',
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                      if (quotation.customerPhone != null &&
                                          quotation.customerPhone!.isNotEmpty)
                                        Text(
                                          quotation.customerPhone!,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.darkTextSecondary,
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    const Text(
                                      'TOTAL AMOUNT',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.darkTextMuted,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      _currencyFormat.format(
                                        quotation.totalAmount,
                                      ),
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w900,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                    Container(
                                      margin: const EdgeInsets.only(top: 4),
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0x2010B981),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text(
                                        '18% GST Included',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: Color(0xFF10B981),
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Itemized Estimate Summary Table
                      const Text(
                        'ITEMIZED ESTIMATE SUMMARY',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.darkTextMuted,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF1B1E26),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0x15FFFFFF)),
                        ),
                        child: Column(
                          children: [
                            // Table Header
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: const BoxDecoration(
                                color: Color(0xFF14161E),
                                borderRadius: BorderRadius.vertical(
                                  top: Radius.circular(12),
                                ),
                              ),
                              child: const Row(
                                children: [
                                  Expanded(
                                    flex: 3,
                                    child: Text(
                                      'Product / Service',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.darkTextMuted,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    flex: 1,
                                    child: Text(
                                      'Qty',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.darkTextMuted,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    flex: 2,
                                    child: Text(
                                      'Unit Price',
                                      textAlign: TextAlign.right,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.darkTextMuted,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    flex: 2,
                                    child: Text(
                                      'Amount',
                                      textAlign: TextAlign.right,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.darkTextMuted,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Divider(color: Color(0x15FFFFFF), height: 1),

                            // Rows
                            if (quotation.items.isEmpty)
                              Padding(
                                padding: const EdgeInsets.all(16),
                                child: Text(
                                  'No itemized rows available',
                                  style: TextStyle(
                                    color: Colors.grey.shade500,
                                    fontSize: 12,
                                  ),
                                ),
                              )
                            else
                              ...quotation.items.map((item) {
                                return Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        flex: 3,
                                        child: Text(
                                          item.product,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Colors.white,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ),
                                      Expanded(
                                        flex: 1,
                                        child: Text(
                                          item.qty.toStringAsFixed(
                                            item.qty.truncateToDouble() ==
                                                    item.qty
                                                ? 0
                                                : 2,
                                          ),
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.darkTextSecondary,
                                          ),
                                        ),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text(
                                          '₹${item.price.toStringAsFixed(2)}',
                                          textAlign: TextAlign.right,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.darkTextSecondary,
                                          ),
                                        ),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text(
                                          '₹${(item.qty * item.price).toStringAsFixed(2)}',
                                          textAlign: TextAlign.right,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Action Buttons Row
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          PdfService.printQuotation(quotation);
                        },
                        icon: const Icon(
                          LucideIcons.printer,
                          size: 16,
                          color: AppColors.primary,
                        ),
                        label: const Text(
                          'Print Document',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0x30FFFFFF)),
                          backgroundColor: const Color(0xFF1B1E26),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          PdfService.shareQuotation(quotation);
                        },
                        icon: const Icon(
                          LucideIcons.share2,
                          size: 16,
                          color: Colors.white,
                        ),
                        label: const Text(
                          'Share Quote',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _exportCSV(List<QuotationModel> list) {
    if (list.isEmpty) return;
    final buffer = StringBuffer();
    buffer.writeln(
      'Estimate ID,Customer Name,Customer Phone,Company,Total Amount (INR),Created At,Items Count',
    );
    for (final q in list) {
      final cust = (q.customerName ?? 'Walk-in Client').replaceAll('"', '""');
      final phone = (q.customerPhone ?? '').replaceAll('"', '""');
      final comp = (q.vendorCompanyName ?? 'KrishTech Computers').replaceAll(
        '"',
        '""',
      );
      final total = q.totalAmount.toStringAsFixed(2);
      final date = q.date ?? '';
      final count = q.items.length;
      buffer.writeln(
        '"${q.estimateId}","$cust","$phone","$comp",$total,"$date",$count',
      );
    }
    SharePlus.instance.share(
      ShareParams(
        text: buffer.toString(),
        subject:
            'ReNote_Estimations_${DateFormat('yyyyMMdd').format(DateTime.now())}.csv',
      ),
    );
  }

  void _exportXML(List<QuotationModel> list) {
    if (list.isEmpty) return;
    final buffer = StringBuffer();
    buffer.writeln('<?xml version="1.0" encoding="UTF-8"?>');
    buffer.writeln('<Quotations>');
    for (final q in list) {
      buffer.writeln('  <Quotation id="${q.id}">');
      buffer.writeln('    <EstimateID>${q.estimateId}</EstimateID>');
      buffer.writeln(
        '    <CustomerName>${q.customerName ?? ""}</CustomerName>',
      );
      buffer.writeln(
        '    <CustomerPhone>${q.customerPhone ?? ""}</CustomerPhone>',
      );
      buffer.writeln(
        '    <CompanyName>${q.vendorCompanyName ?? ""}</CompanyName>',
      );
      buffer.writeln('    <Total>${q.totalAmount}</Total>');
      buffer.writeln('    <CreatedAt>${q.date ?? ""}</CreatedAt>');
      buffer.writeln('  </Quotation>');
    }
    buffer.writeln('</Quotations>');
    SharePlus.instance.share(
      ShareParams(
        text: buffer.toString(),
        subject:
            'ReNote_Estimations_${DateFormat('yyyyMMdd').format(DateTime.now())}.xml',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(quotationProvider);
    final quotations = state.filteredQuotations;
    final companyState = ref.watch(companyProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.scaffoldBg,
      appBar: const AppHeader(title: 'Estimations'),
      drawer: const AppDrawer(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/quotations/create'),
        backgroundColor: AppColors.primary,
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: const Text(
          'New Quotation',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      bottomNavigationBar: _selectedIds.isNotEmpty
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF16181E) : Colors.white,
                border: Border(
                  top: BorderSide(
                    color: isDark ? const Color(0x20FFFFFF) : const Color(0xFFE2E8F0),
                  ),
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black45,
                    blurRadius: 12,
                    offset: Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${_selectedIds.length} Selected',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    Row(
                      children: [
                        OutlinedButton.icon(
                          onPressed: () {
                            final selectedList = quotations
                                .where((q) => _selectedIds.contains(q.id))
                                .toList();
                            _exportCSV(selectedList);
                          },
                          icon: Icon(
                            LucideIcons.download,
                            size: 14,
                            color: isDark ? Colors.white : AppColors.textPrimary,
                          ),
                          label: Text(
                            'Export',
                            style: TextStyle(
                              color: isDark ? Colors.white : AppColors.textPrimary,
                              fontSize: 12,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: isDark ? const Color(0x30FFFFFF) : AppColors.cardBorder,
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton.icon(
                          onPressed: _confirmBulkDelete,
                          icon: const Icon(
                            LucideIcons.trash2,
                            size: 14,
                            color: Colors.white,
                          ),
                          label: const Text(
                            'Delete',
                            style: TextStyle(color: Colors.white, fontSize: 12),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.error,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            )
          : null,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () => ref.read(quotationProvider.notifier).loadQuotations(),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Top Dashboard Banner & Metrics
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title Bar
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Estimation Dashboard',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: isDark ? AppColors.primary.withAlpha(30) : AppColors.primaryBg,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: AppColors.primary.withAlpha(80),
                                ),
                              ),
                              child: Text(
                                '${quotations.length} Active',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primary,
                                ),
                              ),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: state.isLoading
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    color: AppColors.primary,
                                    strokeWidth: 2,
                                  ),
                                )
                              : Icon(
                                  LucideIcons.refreshCw,
                                  size: 18,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                ),
                          onPressed: () => ref
                              .read(quotationProvider.notifier)
                              .loadQuotations(),
                          tooltip: 'Refresh Data',
                        ),
                      ],
                    ),
                    Text(
                      'Create, manage, and track commercial estimates, quotes, and client valuations',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Metrics Row (Total Value & Average Value)
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkCard : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isDark ? AppColors.darkCardBorder : AppColors.cardBorder,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        'Total Estimate Value',
                                        style: TextStyle(
                                          fontSize: 10.5,
                                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Container(
                                      padding: const EdgeInsets.all(5),
                                      decoration: BoxDecoration(
                                        color: isDark ? AppColors.success.withAlpha(30) : AppColors.successBg,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        LucideIcons.trendingUp,
                                        size: 13,
                                        color: AppColors.success,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  _currencyFormat.format(state.totalValue),
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.primary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkCard : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isDark ? AppColors.darkCardBorder : AppColors.cardBorder,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        'Average Value',
                                        style: TextStyle(
                                          fontSize: 10.5,
                                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Container(
                                      padding: const EdgeInsets.all(5),
                                      decoration: BoxDecoration(
                                        color: isDark ? AppColors.primary.withAlpha(30) : AppColors.primaryBg,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        LucideIcons.calculator,
                                        size: 13,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  _currencyFormat.format(state.averageValue),
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                    color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Search & Actions Control Bar
                    Row(
                      children: [
                        // Search bar
                        Expanded(
                          child: Container(
                            height: 44,
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkInputBg : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isDark ? AppColors.darkInputBorder : AppColors.cardBorder,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                            child: TextField(
                              controller: _searchController,
                              onChanged: (val) => ref
                                  .read(quotationProvider.notifier)
                                  .setSearch(val),
                              style: TextStyle(
                                fontSize: 13,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                              ),
                              decoration: InputDecoration(
                                hintText:
                                    'Search customer, estimate ID, item...',
                                hintStyle: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
                                ),
                                prefixIcon: Icon(
                                  LucideIcons.search,
                                  size: 18,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                ),
                                suffixIcon: _searchController.text.isNotEmpty
                                    ? IconButton(
                                        icon: Icon(
                                          LucideIcons.x,
                                          size: 16,
                                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                        ),
                                        onPressed: () {
                                          _searchController.clear();
                                          ref
                                              .read(quotationProvider.notifier)
                                              .setSearch('');
                                        },
                                      )
                                    : null,
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 12,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Filter Button
                        Container(
                          height: 44,
                          decoration: BoxDecoration(
                            color: (_isFilterExpanded || state.hasActiveFilters)
                                ? (isDark ? AppColors.primary.withAlpha(40) : AppColors.primaryBg)
                                : (isDark ? AppColors.darkInputBg : Colors.white),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color:
                                  (_isFilterExpanded || state.hasActiveFilters)
                                  ? AppColors.primary
                                  : (isDark ? AppColors.darkInputBorder : AppColors.cardBorder),
                            ),
                          ),
                          child: IconButton(
                            icon: Stack(
                              children: [
                                Icon(
                                  LucideIcons.filter,
                                  size: 18,
                                  color:
                                      (_isFilterExpanded ||
                                          state.hasActiveFilters)
                                      ? AppColors.primary
                                      : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                                ),
                                if (state.hasActiveFilters)
                                  Positioned(
                                    right: 0,
                                    top: 0,
                                    child: Container(
                                      width: 6,
                                      height: 6,
                                      decoration: const BoxDecoration(
                                        color: AppColors.primary,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            tooltip: 'Filter Estimations',
                            onPressed: () {
                              setState(
                                () => _isFilterExpanded = !_isFilterExpanded,
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Export Dropdown Popup
                        Container(
                          height: 44,
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.darkInputBg : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark ? AppColors.darkInputBorder : AppColors.cardBorder,
                            ),
                          ),
                          child: PopupMenuButton<String>(
                            color: isDark ? AppColors.darkCard : Colors.white,
                            icon: const Icon(
                              LucideIcons.download,
                              size: 18,
                              color: AppColors.primary,
                            ),
                            tooltip: 'Export Estimations',
                            onSelected: (val) {
                              if (val == 'csv') _exportCSV(quotations);
                              if (val == 'xml') _exportXML(quotations);
                            },
                            itemBuilder: (context) => [
                              PopupMenuItem(
                                value: 'csv',
                                child: Row(
                                  children: [
                                    const Icon(
                                      LucideIcons.fileSpreadsheet,
                                      size: 16,
                                      color: Color(0xFF10B981),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Export to CSV Excel',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              PopupMenuItem(
                                value: 'xml',
                                child: Row(
                                  children: [
                                    const Icon(
                                      LucideIcons.fileCode,
                                      size: 16,
                                      color: AppColors.primary,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Export to XML Format',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    // Company Horizontal Selector
                    if (companyState.companies.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            ChoiceChip(
                              label: const Text(
                                'All Companies',
                                style: TextStyle(fontSize: 12),
                              ),
                              selected:
                                  state.selectedCompanyId == null ||
                                  state.selectedCompanyId == 'All',
                              onSelected: (_) => ref
                                  .read(quotationProvider.notifier)
                                  .setCompanyFilter(null),
                              backgroundColor: isDark
                                  ? AppColors.darkCard
                                  : const Color(0xFFF1F5F9),
                              selectedColor: isDark
                                  ? AppColors.primary.withAlpha(50)
                                  : AppColors.primaryBg,
                              side: BorderSide(
                                color: (state.selectedCompanyId == null ||
                                        state.selectedCompanyId == 'All')
                                    ? AppColors.primary
                                    : (isDark
                                        ? AppColors.darkCardBorder
                                        : Colors.transparent),
                              ),
                              labelStyle: TextStyle(
                                color:
                                    (state.selectedCompanyId == null ||
                                        state.selectedCompanyId == 'All')
                                    ? (isDark ? Colors.white : AppColors.primary)
                                    : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 8),
                            ...companyState.companies.map((comp) {
                              final isSel = state.selectedCompanyId == comp.id;
                              return Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: ChoiceChip(
                                  label: Text(
                                    comp.name,
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  selected: isSel,
                                  onSelected: (selected) {
                                    ref
                                        .read(quotationProvider.notifier)
                                        .setCompanyFilter(
                                          selected ? comp.id : null,
                                        );
                                  },
                                  backgroundColor: isDark
                                      ? AppColors.darkCard
                                      : const Color(0xFFF1F5F9),
                                  selectedColor: isDark
                                      ? AppColors.primary.withAlpha(50)
                                      : AppColors.primaryBg,
                                  side: BorderSide(
                                    color: isSel
                                        ? AppColors.primary
                                        : (isDark
                                            ? AppColors.darkCardBorder
                                            : Colors.transparent),
                                  ),
                                  labelStyle: TextStyle(
                                    color: isSel
                                        ? (isDark ? Colors.white : AppColors.primary)
                                        : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                                    fontWeight: isSel
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                  ),
                                ),
                              );
                            }),
                          ],
                        ),
                      ),
                    ],

                    // Expandable Filter Drawer Panel
                    if (_isFilterExpanded) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.darkCard : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isDark ? AppColors.darkCardBorder : AppColors.cardBorder,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  LucideIcons.slidersHorizontal,
                                  size: 16,
                                  color: AppColors.primary,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Filter Quotations',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            // Price Range Row
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
                                      labelText: 'Min Price (₹)',
                                      labelStyle: TextStyle(
                                        fontSize: 11,
                                        color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                      ),
                                      hintText: 'e.g. 1000',
                                      hintStyle: TextStyle(
                                        fontSize: 12,
                                        color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
                                      ),
                                      isDense: true,
                                      fillColor: isDark ? AppColors.darkInputBg : Colors.white,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                        borderSide: BorderSide(
                                          color: isDark ? AppColors.darkInputBorder : AppColors.cardBorder,
                                        ),
                                      ),
                                    ),
                                    onChanged: (_) => _applyFilterState(),
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
                                      labelText: 'Max Price (₹)',
                                      labelStyle: TextStyle(
                                        fontSize: 11,
                                        color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                      ),
                                      hintText: 'e.g. 150000',
                                      hintStyle: TextStyle(
                                        fontSize: 12,
                                        color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
                                      ),
                                      isDense: true,
                                      fillColor: isDark ? AppColors.darkInputBg : Colors.white,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                        borderSide: BorderSide(
                                          color: isDark ? AppColors.darkInputBorder : AppColors.cardBorder,
                                        ),
                                      ),
                                    ),
                                    onChanged: (_) => _applyFilterState(),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            // Date Range & Favorites Row
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: () async {
                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate:
                                            _startDate ?? DateTime.now(),
                                        firstDate: DateTime(2020),
                                        lastDate: DateTime(2030),
                                      );
                                      if (picked != null) {
                                        setState(() => _startDate = picked);
                                        _applyFilterState();
                                      }
                                    },
                                    icon: Icon(
                                      LucideIcons.calendar,
                                      size: 14,
                                      color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                    ),
                                    label: Text(
                                      _startDate != null
                                          ? DateFormat('dd/MM/yyyy')
                                                .format(_startDate!)
                                          : 'From Date',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                                      ),
                                    ),
                                    style: OutlinedButton.styleFrom(
                                      side: BorderSide(
                                        color: isDark ? AppColors.darkInputBorder : AppColors.cardBorder,
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 10,
                                        horizontal: 8,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: () async {
                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate: _endDate ?? DateTime.now(),
                                        firstDate: DateTime(2020),
                                        lastDate: DateTime(2030),
                                      );
                                      if (picked != null) {
                                        setState(() => _endDate = picked);
                                        _applyFilterState();
                                      }
                                    },
                                    icon: Icon(
                                      LucideIcons.calendar,
                                      size: 14,
                                      color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                    ),
                                    label: Text(
                                      _endDate != null
                                          ? DateFormat('dd/MM/yyyy')
                                                .format(_endDate!)
                                          : 'To Date',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                                      ),
                                    ),
                                    style: OutlinedButton.styleFrom(
                                      side: BorderSide(
                                        color: isDark ? AppColors.darkInputBorder : AppColors.cardBorder,
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 10,
                                        horizontal: 8,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            // Favorites Toggle & Reset
                            Row(
                              children: [
                                Expanded(
                                  child: ChoiceChip(
                                    label: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        const Icon(
                                          LucideIcons.star,
                                          size: 14,
                                          color: AppColors.warning,
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Favorites Only',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: _favoritesOnly
                                                ? (isDark ? Colors.white : AppColors.primary)
                                                : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                                          ),
                                        ),
                                      ],
                                    ),
                                    selected: _favoritesOnly,
                                    onSelected: (val) {
                                      setState(() => _favoritesOnly = val);
                                      _applyFilterState();
                                    },
                                    backgroundColor: isDark
                                        ? AppColors.darkCard
                                        : const Color(0xFFF1F5F9),
                                    selectedColor: isDark
                                        ? AppColors.primary.withAlpha(50)
                                        : AppColors.primaryBg,
                                    side: BorderSide(
                                      color: _favoritesOnly
                                          ? AppColors.primary
                                          : (isDark
                                              ? AppColors.darkCardBorder
                                              : Colors.transparent),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                TextButton.icon(
                                  onPressed: _resetFilterState,
                                  icon: Icon(
                                    LucideIcons.rotateCcw,
                                    size: 14,
                                    color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                  ),
                                  label: Text(
                                    'Reset',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 10),

                    // Multi-selection bar (Select All Toggle)
                    if (quotations.isNotEmpty)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            onTap: () => _handleSelectAll(quotations),
                            child: Row(
                              children: [
                                Icon(
                                  (_selectedIds.length == quotations.length &&
                                          quotations.isNotEmpty)
                                      ? LucideIcons.checkSquare
                                      : LucideIcons.square,
                                  size: 16,
                                  color: AppColors.primary,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  _selectedIds.isEmpty
                                      ? 'Select All'
                                      : 'Select All (${_selectedIds.length}/${quotations.length})',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '${quotations.length} Results',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),

            // Quotations List View
            if (state.isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (quotations.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.primary.withAlpha(30) : AppColors.primaryBg,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            LucideIcons.fileText,
                            size: 48,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No Quotations Found',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Create commercial estimates for your clients with automatic GST calculation and PDF sharing.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton.icon(
                          onPressed: () => context.push('/quotations/create'),
                          icon: const Icon(
                            LucideIcons.plus,
                            size: 18,
                            color: Colors.white,
                          ),
                          label: const Text(
                            'Create New Estimate',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 12,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
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
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 90),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final quotation = quotations[index];
                    final isSelected = _selectedIds.contains(quotation.id);

                    return _EstimationCard(
                      quotation: quotation,
                      isSelected: isSelected,
                      currencyFormat: _currencyFormat,
                      onToggleSelect: () => _toggleSelect(quotation.id),
                      onPreview: () => _showPreviewModal(quotation),
                      onEdit: () =>
                          context.push('/quotations/create', extra: quotation),
                      onDuplicate: () async {
                        final success = await ref
                            .read(quotationProvider.notifier)
                            .duplicateQuotation(quotation);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                success
                                    ? 'Duplicated #${quotation.estimateId} successfully'
                                    : 'Failed to duplicate estimate',
                              ),
                              backgroundColor: success
                                  ? AppColors.success
                                  : AppColors.error,
                            ),
                          );
                        }
                      },
                      onToggleFavorite: () => ref
                          .read(quotationProvider.notifier)
                          .toggleFavorite(quotation.id),
                      onDelete: () => _confirmDelete(quotation),
                    );
                  }, childCount: quotations.length),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _EstimationCard extends StatelessWidget {
  final QuotationModel quotation;
  final bool isSelected;
  final NumberFormat currencyFormat;
  final VoidCallback onToggleSelect;
  final VoidCallback onPreview;
  final VoidCallback onEdit;
  final VoidCallback onDuplicate;
  final VoidCallback onToggleFavorite;
  final VoidCallback onDelete;

  const _EstimationCard({
    required this.quotation,
    required this.isSelected,
    required this.currencyFormat,
    required this.onToggleSelect,
    required this.onPreview,
    required this.onEdit,
    required this.onDuplicate,
    required this.onToggleFavorite,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final formattedDate = quotation.date != null
        ? DateFormat('dd MMM yyyy, hh:mm a')
              .format(DateTime.tryParse(quotation.date!) ?? DateTime.now())
        : DateFormat('dd MMM yyyy').format(DateTime.now());

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSelected ? AppColors.primary : (isDark ? AppColors.darkCardBorder : AppColors.cardBorder),
          width: isSelected ? 1.5 : 1.0,
        ),
        boxShadow: isDark
            ? const []
            : const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
      ),
      child: InkWell(
        onTap: onPreview,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: Checkbox, Estimate ID Badge, Favorite, Date
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      GestureDetector(
                        onTap: onToggleSelect,
                        child: Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Icon(
                            isSelected
                                ? LucideIcons.checkSquare
                                : LucideIcons.square,
                            size: 18,
                            color: isSelected
                                ? AppColors.primary
                                : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF232733) : const Color(0xFF1B1E26),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0x20FFFFFF)),
                        ),
                        child: Text(
                          '#${quotation.estimateId}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          quotation.isFavorite
                              ? LucideIcons.star
                              : LucideIcons.star,
                          size: 16,
                          color: quotation.isFavorite
                              ? AppColors.warning
                              : (isDark ? AppColors.darkTextSecondary : AppColors.textMuted),
                        ),
                        visualDensity: VisualDensity.compact,
                        tooltip: 'Favorite',
                        onPressed: onToggleFavorite,
                      ),
                      Text(
                        formattedDate,
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Divider(
                height: 16,
                color: isDark ? AppColors.darkCardBorder : const Color(0xFFE2E8F0),
              ),

              // Client & Vendor & Valuation
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Customer with pulsating green dot
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                quotation.customerName ?? 'Walk-in Client',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        if (quotation.customerPhone != null &&
                            quotation.customerPhone!.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(left: 14, top: 2),
                            child: Text(
                              quotation.customerPhone!,
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        const SizedBox(height: 6),

                        // Vendor Company
                        Row(
                          children: [
                            Icon(
                              LucideIcons.building,
                              size: 12,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.textMuted,
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                quotation.vendorCompanyName ??
                                    'KrishTech Computers',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${quotation.items.length} Item${quotation.items.length == 1 ? '' : 's'} included',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Valuation Column
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'TOTAL AMOUNT',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        currencyFormat.format(quotation.totalAmount),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primary,
                        ),
                      ),
                      if (quotation.taxAmount > 0)
                        Text(
                          'Incl. ₹${quotation.taxAmount.toStringAsFixed(2)} GST',
                          style: const TextStyle(
                            fontSize: 10,
                            color: Color(0xFF10B981),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Action Buttons Row (Eye, Pencil, Copy, PDF/Print, Share, Trash)
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    icon: Icon(
                      LucideIcons.eye,
                      size: 16,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                    ),
                    tooltip: 'Preview Estimate',
                    onPressed: onPreview,
                    visualDensity: VisualDensity.compact,
                  ),
                  IconButton(
                    icon: const Icon(
                      LucideIcons.pencil,
                      size: 16,
                      color: AppColors.primary,
                    ),
                    tooltip: 'Edit Estimate',
                    onPressed: onEdit,
                    visualDensity: VisualDensity.compact,
                  ),
                  IconButton(
                    icon: Icon(
                      LucideIcons.copy,
                      size: 16,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                    ),
                    tooltip: 'Duplicate Estimate',
                    onPressed: onDuplicate,
                    visualDensity: VisualDensity.compact,
                  ),
                  IconButton(
                    icon: Icon(
                      LucideIcons.printer,
                      size: 16,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                    ),
                    tooltip: 'Print PDF',
                    onPressed: () => PdfService.printQuotation(quotation),
                    visualDensity: VisualDensity.compact,
                  ),
                  IconButton(
                    icon: const Icon(
                      LucideIcons.share2,
                      size: 16,
                      color: AppColors.primary,
                    ),
                    tooltip: 'Share Quote',
                    onPressed: () => PdfService.shareQuotation(quotation),
                    visualDensity: VisualDensity.compact,
                  ),
                  IconButton(
                    icon: const Icon(
                      LucideIcons.trash2,
                      size: 16,
                      color: AppColors.error,
                    ),
                    tooltip: 'Delete Estimate',
                    onPressed: onDelete,
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
