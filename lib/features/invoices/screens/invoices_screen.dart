import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/constants/app_colors.dart';
import '../../../models/invoice_model.dart';
import '../../../providers/company_provider.dart';
import '../../../providers/invoice_provider.dart';
import '../../../providers/theme_provider.dart';
import '../../../services/pdf_service.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/brand_flame_logo.dart';

class InvoicesScreen extends ConsumerStatefulWidget {
  const InvoicesScreen({super.key});

  @override
  ConsumerState<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends ConsumerState<InvoicesScreen> {
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
      ref.read(invoiceProvider.notifier).loadInvoices();
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
        .read(invoiceProvider.notifier)
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
    ref.read(invoiceProvider.notifier).resetFilters();
  }

  void _handleSelectAll(List<InvoiceModel> currentList) {
    setState(() {
      if (_selectedIds.length == currentList.length) {
        _selectedIds.clear();
      } else {
        _selectedIds.clear();
        for (final inv in currentList) {
          _selectedIds.add(inv.id);
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

  void _confirmDelete(InvoiceModel invoice) {
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
              'Delete Invoice?',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
              ),
            ),
          ],
        ),
        content: Text(
          'Are you sure you want to delete #${invoice.invoiceId}? This action cannot be undone.',
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
                  .read(invoiceProvider.notifier)
                  .deleteInvoice(invoice.id);
              if (mounted) {
                setState(() => _selectedIds.remove(invoice.id));
              }
              messenger.showSnackBar(
                SnackBar(
                  content: Text(
                    success
                        ? 'Invoice #${invoice.invoiceId} deleted successfully'
                        : 'Failed to delete invoice',
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
          'Are you sure you want to delete ${_selectedIds.length} selected invoice(s)? This action cannot be undone.',
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
                  .read(invoiceProvider.notifier)
                  .deleteMultipleInvoices(ids);
              if (mounted) {
                setState(() => _selectedIds.clear());
              }
              messenger.showSnackBar(
                SnackBar(
                  content: Text(
                    success
                        ? '${ids.length} invoice(s) deleted successfully'
                        : 'Failed to delete selected invoices',
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

  void _showPreviewModal(InvoiceModel invoice) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 520),
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
                              'Tax Invoice #${invoice.invoiceId}',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              invoice.vendorCompanyName ??
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
                                        'BUYER (BILL TO)',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.darkTextMuted,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        invoice.customerName ??
                                            'Walk-in Client',
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                      if (invoice.customerPhone != null &&
                                          invoice.customerPhone!.isNotEmpty)
                                        Text(
                                          invoice.customerPhone!,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.darkTextSecondary,
                                          ),
                                        ),
                                      if (invoice.customerGstNo != null &&
                                          invoice.customerGstNo!.isNotEmpty)
                                        Text(
                                          'GSTIN: ${invoice.customerGstNo!}',
                                          style: const TextStyle(
                                            fontSize: 11,
                                            color: AppColors.darkTextMuted,
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    const Text(
                                      'GRAND TOTAL',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.darkTextMuted,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      _currencyFormat.format(
                                        invoice.totalAmount,
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
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: invoice.isPaid
                                            ? const Color(0x2010B981)
                                            : const Color(0x20F59E0B),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        invoice.status.toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: invoice.isPaid
                                              ? const Color(0xFF10B981)
                                              : const Color(0xFFF59E0B),
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

                      // Itemized Table
                      const Text(
                        'TAX INVOICE LINE ITEMS',
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
                                      'Item / HSN',
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
                                      'Rate',
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
                                      'Total',
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
                            if (invoice.items.isEmpty)
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
                              ...invoice.items.map((item) {
                                return Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        flex: 3,
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              item.product,
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: Colors.white,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            if (item.hsn.isNotEmpty)
                                              Text(
                                                'HSN: ${item.hsn}',
                                                style: const TextStyle(
                                                  fontSize: 10,
                                                  color:
                                                      AppColors.darkTextMuted,
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                      Expanded(
                                        flex: 1,
                                        child: Text(
                                          '${item.qty.toStringAsFixed(item.qty.truncateToDouble() == item.qty ? 0 : 2)} ${item.unit}',
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(
                                            fontSize: 11,
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
                                          '₹${item.totalWithTax.toStringAsFixed(2)}',
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
                      const SizedBox(height: 14),

                      // GST Breakdown Card
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1B1E26),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0x15FFFFFF)),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Taxable Subtotal:',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppColors.darkTextSecondary,
                                  ),
                                ),
                                Text(
                                  _currencyFormat.format(invoice.subtotal),
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            if (invoice.isInterState) ...[
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'IGST Tax:',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.darkTextSecondary,
                                    ),
                                  ),
                                  Text(
                                    _currencyFormat.format(invoice.igstAmount),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ] else ...[
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'CGST Tax (9%):',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.darkTextSecondary,
                                    ),
                                  ),
                                  Text(
                                    _currencyFormat.format(invoice.cgstAmount),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'SGST Tax (9%):',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.darkTextSecondary,
                                    ),
                                  ),
                                  Text(
                                    _currencyFormat.format(invoice.sgstAmount),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                            const Divider(color: Color(0x15FFFFFF), height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Grand Total:',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                Text(
                                  _currencyFormat.format(invoice.totalAmount),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: Text(
                                invoice.amountInWords,
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontStyle: FontStyle.italic,
                                  color: AppColors.darkTextMuted,
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

              // Action Buttons Row
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          PdfService.printInvoice(invoice);
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
                          PdfService.shareInvoice(invoice);
                        },
                        icon: const Icon(
                          LucideIcons.share2,
                          size: 16,
                          color: Colors.white,
                        ),
                        label: const Text(
                          'Share Invoice',
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

  void _showHsnSummaryModal(List<InvoiceModel> list) {
    // Consolidated HSN Summary calculation across all filtered invoices
    final Map<String, _HsnAggregate> hsnMap = {};

    for (final inv in list) {
      for (final item in inv.items) {
        final hsnCode = item.hsn.trim().isNotEmpty ? item.hsn.trim() : 'OTHER';
        final taxableVal = item.amount;
        final gstRate = item.gst;
        final isInter = inv.isInterState;

        final agg = hsnMap.putIfAbsent(
          hsnCode,
          () => _HsnAggregate(hsn: hsnCode),
        );

        agg.taxableValue += taxableVal;
        if (isInter) {
          final igstAmt = (taxableVal * gstRate) / 100;
          agg.igstAmount += igstAmt;
          agg.igstRate = gstRate;
          agg.totalTax += igstAmt;
        } else {
          final halfRate = gstRate / 2;
          final halfTax = (taxableVal * halfRate) / 100;
          agg.cgstRate = halfRate;
          agg.cgstAmount += halfTax;
          agg.sgstRate = halfRate;
          agg.sgstAmount += halfTax;
          agg.totalTax += (halfTax * 2);
        }
      }
    }

    final summaryList = hsnMap.values.toList();
    final totalTaxable = summaryList.fold(
      0.0,
      (acc, r) => acc + r.taxableValue,
    );
    final totalTax = summaryList.fold(0.0, (acc, r) => acc + r.totalTax);

    final isDark = Theme.of(context).brightness == Brightness.dark;

    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 600),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDark ? AppColors.darkCardBorder : AppColors.cardBorder,
            ),
            boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 16)],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          LucideIcons.fileSpreadsheet,
                          size: 22,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Consolidated HSN/SAC Tax Summary',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: Icon(
                        LucideIcons.x,
                        size: 20,
                        color: isDark ? AppColors.darkTextSecondary : Colors.black54,
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              Divider(
                height: 1,
                color: isDark ? AppColors.darkCardBorder : const Color(0xFFE2E8F0),
              ),

              // Table Body
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: summaryList.isEmpty
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Text(
                              'No HSN data available',
                              style: TextStyle(color: AppColors.textMuted),
                            ),
                          ),
                        )
                      : Column(
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: isDark ? AppColors.darkCardBorder : AppColors.cardBorder,
                                ),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Column(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: isDark ? AppColors.darkSurface : AppColors.scaffoldBg,
                                      borderRadius: const BorderRadius.vertical(
                                        top: Radius.circular(10),
                                      ),
                                    ),
                                    child: const Row(
                                      children: [
                                        Expanded(
                                          flex: 2,
                                          child: Text(
                                            'HSN/SAC',
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          flex: 3,
                                          child: Text(
                                            'Taxable (₹)',
                                            textAlign: TextAlign.right,
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          flex: 2,
                                          child: Text(
                                            'CGST',
                                            textAlign: TextAlign.right,
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          flex: 2,
                                          child: Text(
                                            'SGST',
                                            textAlign: TextAlign.right,
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          flex: 2,
                                          child: Text(
                                            'IGST',
                                            textAlign: TextAlign.right,
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          flex: 3,
                                          child: Text(
                                            'Total Tax',
                                            textAlign: TextAlign.right,
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const Divider(height: 1),
                                  ...summaryList.map((row) {
                                    return Padding(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 8,
                                      ),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            flex: 2,
                                            child: Text(
                                              row.hsn,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                          Expanded(
                                            flex: 3,
                                            child: Text(
                                              row.taxableValue.toStringAsFixed(
                                                2,
                                              ),
                                              textAlign: TextAlign.right,
                                              style: const TextStyle(
                                                fontSize: 11,
                                              ),
                                            ),
                                          ),
                                          Expanded(
                                            flex: 2,
                                            child: Text(
                                              row.cgstAmount.toStringAsFixed(2),
                                              textAlign: TextAlign.right,
                                              style: const TextStyle(
                                                fontSize: 11,
                                              ),
                                            ),
                                          ),
                                          Expanded(
                                            flex: 2,
                                            child: Text(
                                              row.sgstAmount.toStringAsFixed(2),
                                              textAlign: TextAlign.right,
                                              style: const TextStyle(
                                                fontSize: 11,
                                              ),
                                            ),
                                          ),
                                          Expanded(
                                            flex: 2,
                                            child: Text(
                                              row.igstAmount.toStringAsFixed(2),
                                              textAlign: TextAlign.right,
                                              style: const TextStyle(
                                                fontSize: 11,
                                              ),
                                            ),
                                          ),
                                          Expanded(
                                            flex: 3,
                                            child: Text(
                                              row.totalTax.toStringAsFixed(2),
                                              textAlign: TextAlign.right,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: AppColors.primary,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }),
                                  Divider(
                                    height: 1,
                                    color: isDark ? AppColors.darkCardBorder : const Color(0xFFE2E8F0),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: isDark ? AppColors.primary.withAlpha(30) : AppColors.primaryBg,
                                      borderRadius: const BorderRadius.vertical(
                                        bottom: Radius.circular(10),
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        const Expanded(
                                          flex: 2,
                                          child: Text(
                                            'TOTAL',
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                              color: AppColors.primary,
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          flex: 3,
                                          child: Text(
                                            totalTaxable.toStringAsFixed(2),
                                            textAlign: TextAlign.right,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ),
                                        const Expanded(
                                          flex: 6,
                                          child: SizedBox(),
                                        ),
                                        Expanded(
                                          flex: 3,
                                          child: Text(
                                            totalTax.toStringAsFixed(2),
                                            textAlign: TextAlign.right,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                              color: AppColors.primary,
                                            ),
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
                ),
              ),

              // Footer
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          final csv = StringBuffer();
                          csv.writeln(
                            'HSN/SAC,Taxable Value (INR),CGST Amount (INR),SGST Amount (INR),IGST Amount (INR),Total Tax Amount (INR)',
                          );
                          for (final r in summaryList) {
                            csv.writeln(
                              '"${r.hsn}",${r.taxableValue.toStringAsFixed(2)},${r.cgstAmount.toStringAsFixed(2)},${r.sgstAmount.toStringAsFixed(2)},${r.igstAmount.toStringAsFixed(2)},${r.totalTax.toStringAsFixed(2)}',
                            );
                          }
                          csv.writeln(
                            '"TOTAL",${totalTaxable.toStringAsFixed(2)},-,,-,${totalTax.toStringAsFixed(2)}',
                          );
                          SharePlus.instance.share(
                            ShareParams(
                              text: csv.toString(),
                              subject: 'Consolidated_HSN_Summary.csv',
                            ),
                          );
                        },
                        icon: const Icon(
                          LucideIcons.download,
                          size: 16,
                          color: Colors.white,
                        ),
                        label: const Text(
                          'Export HSN CSV',
                          style: TextStyle(color: Colors.white),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
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

  void _exportCSV(List<InvoiceModel> list) {
    if (list.isEmpty) return;
    final buffer = StringBuffer();
    buffer.writeln(
      'Invoice ID,Customer Name,Customer Phone,Company,Status,Total Amount (INR),Created At,Items Count',
    );
    for (final inv in list) {
      final cust = (inv.customerName ?? 'Walk-in Client').replaceAll('"', '""');
      final phone = (inv.customerPhone ?? '').replaceAll('"', '""');
      final comp = (inv.vendorCompanyName ?? 'KrishTech Computers').replaceAll(
        '"',
        '""',
      );
      final status = inv.status.replaceAll('"', '""');
      final total = inv.totalAmount.toStringAsFixed(2);
      final date = inv.date ?? '';
      final count = inv.items.length;
      buffer.writeln(
        '"${inv.invoiceId}","$cust","$phone","$comp","$status",$total,"$date",$count',
      );
    }
    SharePlus.instance.share(
      ShareParams(
        text: buffer.toString(),
        subject:
            'ReNote_Invoices_${DateFormat('yyyyMMdd').format(DateTime.now())}.csv',
      ),
    );
  }

  void _exportXML(List<InvoiceModel> list) {
    if (list.isEmpty) return;
    final buffer = StringBuffer();
    buffer.writeln('<?xml version="1.0" encoding="UTF-8"?>');
    buffer.writeln('<Invoices>');
    for (final inv in list) {
      buffer.writeln('  <Invoice id="${inv.id}">');
      buffer.writeln('    <InvoiceID>${inv.invoiceId}</InvoiceID>');
      buffer.writeln(
        '    <CustomerName>${inv.customerName ?? ""}</CustomerName>',
      );
      buffer.writeln(
        '    <CustomerPhone>${inv.customerPhone ?? ""}</CustomerPhone>',
      );
      buffer.writeln(
        '    <CompanyName>${inv.vendorCompanyName ?? ""}</CompanyName>',
      );
      buffer.writeln('    <Status>${inv.status}</Status>');
      buffer.writeln('    <Total>${inv.totalAmount}</Total>');
      buffer.writeln('    <CreatedAt>${inv.date ?? ""}</CreatedAt>');
      buffer.writeln('  </Invoice>');
    }
    buffer.writeln('</Invoices>');
    SharePlus.instance.share(
      ShareParams(
        text: buffer.toString(),
        subject:
            'ReNote_Invoices_${DateFormat('yyyyMMdd').format(DateTime.now())}.xml',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(invoiceProvider);
    final invoices = state.filteredInvoices;
    final companyState = ref.watch(companyProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.scaffoldBg,
      appBar: const AppHeader(title: 'Tax Invoices'),
      drawer: const AppDrawer(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/invoices/create'),
        backgroundColor: AppColors.primary,
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: const Text(
          'New Invoice',
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
                            final selectedList = invoices
                                .where((i) => _selectedIds.contains(i.id))
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
        onRefresh: () => ref.read(invoiceProvider.notifier).loadInvoices(),
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
                              'Tax Invoices',
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
                                '${invoices.length} Active',
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
                          onPressed: () =>
                              ref.read(invoiceProvider.notifier).loadInvoices(),
                          tooltip: 'Refresh Data',
                        ),
                      ],
                    ),
                    Text(
                      'Generate GST compliant tax invoices, track payment status and manage receivables',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Metrics Row (Total Invoiced, Paid, Pending)
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkCard : Colors.white,
                              borderRadius: BorderRadius.circular(14),
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
                                        'Total Invoiced',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: isDark ? AppColors.primary.withAlpha(30) : AppColors.primaryBg,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        LucideIcons.indianRupee,
                                        size: 12,
                                        color: AppColors.primary,
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
                        const SizedBox(width: 8),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkCard : Colors.white,
                              borderRadius: BorderRadius.circular(14),
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
                                        'Paid Invoices',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: isDark ? AppColors.success.withAlpha(30) : AppColors.successBg,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        LucideIcons.checkCircle2,
                                        size: 12,
                                        color: AppColors.success,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${state.paidCount}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.success,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkCard : Colors.white,
                              borderRadius: BorderRadius.circular(14),
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
                                        'Pending Invoices',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: isDark ? AppColors.warning.withAlpha(30) : AppColors.warningBg,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        LucideIcons.clock,
                                        size: 12,
                                        color: AppColors.warning,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${state.pendingCount}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.warning,
                                  ),
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
                                  .read(invoiceProvider.notifier)
                                  .setSearch(val),
                              style: TextStyle(
                                fontSize: 13,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                              ),
                              decoration: InputDecoration(
                                hintText:
                                    'Search invoice ID, customer, item...',
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
                                              .read(invoiceProvider.notifier)
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
                            tooltip: 'Filter Invoices',
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
                            tooltip: 'Export Invoices',
                            onSelected: (val) {
                              if (val == 'csv') _exportCSV(invoices);
                              if (val == 'xml') _exportXML(invoices);
                              if (val == 'hsn') _showHsnSummaryModal(invoices);
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
                              PopupMenuItem(
                                value: 'hsn',
                                child: Row(
                                  children: [
                                    const Icon(
                                      LucideIcons.table,
                                      size: 16,
                                      color: Color(0xFF3B82F6),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Consolidated HSN Summary',
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

                    // Status Chips Row (All, Paid, Pending)
                    const SizedBox(height: 10),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          ...['All', 'Paid', 'Pending'].map((st) {
                            final isSel =
                                state.statusFilter.toLowerCase() ==
                                st.toLowerCase();
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ChoiceChip(
                                label: Text(
                                  st,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isSel
                                        ? (isDark ? Colors.white : AppColors.primary)
                                        : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                                    fontWeight: isSel
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                  ),
                                ),
                                selected: isSel,
                                onSelected: (sel) {
                                  ref
                                      .read(invoiceProvider.notifier)
                                      .setStatusFilter(sel ? st : 'All');
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
                                  width: 1,
                                ),
                              ),
                            );
                          }),
                          if (companyState.companies.isNotEmpty) ...[
                            const SizedBox(width: 8),
                            ...companyState.companies.map((comp) {
                              final isSel = state.selectedCompanyId == comp.id;
                              return Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: ChoiceChip(
                                  label: Text(
                                    comp.name,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isSel
                                          ? (isDark ? Colors.white : AppColors.primary)
                                          : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                                      fontWeight: isSel
                                          ? FontWeight.bold
                                          : FontWeight.normal,
                                    ),
                                  ),
                                  selected: isSel,
                                  onSelected: (selected) {
                                    ref
                                        .read(invoiceProvider.notifier)
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
                                    width: 1,
                                  ),
                                ),
                              );
                            }),
                          ],
                        ],
                      ),
                    ),

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
                                  'Filter Tax Invoices',
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
                    if (invoices.isNotEmpty)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            onTap: () => _handleSelectAll(invoices),
                            child: Row(
                              children: [
                                Icon(
                                  (_selectedIds.length == invoices.length &&
                                          invoices.isNotEmpty)
                                      ? LucideIcons.checkSquare
                                      : LucideIcons.square,
                                  size: 16,
                                  color: AppColors.primary,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  _selectedIds.isEmpty
                                      ? 'Select All'
                                      : 'Select All (${_selectedIds.length}/${invoices.length})',
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
                            '${invoices.length} Results',
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

            // Invoices List View
            if (state.isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (invoices.isEmpty)
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
                            LucideIcons.receipt,
                            size: 48,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No Tax Invoices Found',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Create commercial tax invoices for your clients with automatic GST calculation and PDF sharing.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
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
                    final invoice = invoices[index];
                    final isSelected = _selectedIds.contains(invoice.id);

                    return _InvoiceCard(
                      invoice: invoice,
                      isSelected: isSelected,
                      currencyFormat: _currencyFormat,
                      onToggleSelect: () => _toggleSelect(invoice.id),
                      onPreview: () => _showPreviewModal(invoice),
                      onEdit: () =>
                          context.push('/invoices/create', extra: invoice),
                      onDuplicate: () async {
                        final success = await ref
                            .read(invoiceProvider.notifier)
                            .duplicateInvoice(invoice);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                success
                                    ? 'Duplicated #${invoice.invoiceId} successfully'
                                    : 'Failed to duplicate invoice',
                              ),
                              backgroundColor: success
                                  ? AppColors.success
                                  : AppColors.error,
                            ),
                          );
                        }
                      },
                      onToggleFavorite: () => ref
                          .read(invoiceProvider.notifier)
                          .toggleFavorite(invoice.id),
                      onDelete: () => _confirmDelete(invoice),
                    );
                  }, childCount: invoices.length),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _InvoiceCard extends StatelessWidget {
  final InvoiceModel invoice;
  final bool isSelected;
  final NumberFormat currencyFormat;
  final VoidCallback onToggleSelect;
  final VoidCallback onPreview;
  final VoidCallback onEdit;
  final VoidCallback onDuplicate;
  final VoidCallback onToggleFavorite;
  final VoidCallback onDelete;

  const _InvoiceCard({
    required this.invoice,
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
    final formattedDate = invoice.date != null
        ? DateFormat('dd MMM yyyy, hh:mm a')
              .format(DateTime.tryParse(invoice.date!) ?? DateTime.now())
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
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
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
              // Top Row: Checkbox, Invoice ID Badge, Status Badge, Favorite, Date
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
                          color: isDark ? const Color(0xFF22252F) : const Color(0xFF1B1E26),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0x20FFFFFF)),
                        ),
                        child: Text(
                          invoice.invoiceId,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      // Status Badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: invoice.isPaid
                              ? (isDark ? const Color(0x2510B981) : const Color(0xFFECFDF5))
                              : (isDark ? const Color(0x25F59E0B) : const Color(0xFFFFFBEB)),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: invoice.isPaid
                                ? const Color(0xFF10B981)
                                : const Color(0xFFF59E0B),
                            width: 0.5,
                          ),
                        ),
                        child: Text(
                          invoice.status.toUpperCase(),
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: invoice.isPaid
                                ? (isDark ? const Color(0xFF34D399) : const Color(0xFF059669))
                                : (isDark ? const Color(0xFFFBBF24) : const Color(0xFFD97706)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          invoice.isFavorite
                              ? LucideIcons.star
                              : LucideIcons.star,
                          size: 16,
                          color: invoice.isFavorite
                              ? AppColors.warning
                              : (isDark ? AppColors.darkTextMuted : AppColors.textMuted),
                        ),
                        visualDensity: VisualDensity.compact,
                        tooltip: 'Favorite',
                        onPressed: onToggleFavorite,
                      ),
                      Text(
                        formattedDate,
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
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

              // Buyer & Vendor & Total Amount
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Customer Name
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: invoice.isPaid
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFFF59E0B),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                invoice.customerName ?? 'Walk-in Client',
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
                        if (invoice.customerPhone != null &&
                            invoice.customerPhone!.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(left: 14, top: 2),
                            child: Text(
                              invoice.customerPhone!,
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
                              color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                invoice.vendorCompanyName ??
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
                          '${invoice.items.length} Item${invoice.items.length == 1 ? '' : 's'} included',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
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
                        'INVOICE TOTAL',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        currencyFormat.format(invoice.totalAmount),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primary,
                        ),
                      ),
                      if (invoice.taxAmount > 0)
                        Text(
                          'Incl. ₹${invoice.taxAmount.toStringAsFixed(2)} GST',
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
                    tooltip: 'Preview Invoice',
                    onPressed: onPreview,
                    visualDensity: VisualDensity.compact,
                  ),
                  IconButton(
                    icon: const Icon(
                      LucideIcons.pencil,
                      size: 16,
                      color: AppColors.primary,
                    ),
                    tooltip: 'Edit Invoice',
                    onPressed: onEdit,
                    visualDensity: VisualDensity.compact,
                  ),
                  IconButton(
                    icon: Icon(
                      LucideIcons.copy,
                      size: 16,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                    ),
                    tooltip: 'Duplicate Invoice',
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
                    onPressed: () => PdfService.printInvoice(invoice),
                    visualDensity: VisualDensity.compact,
                  ),
                  IconButton(
                    icon: const Icon(
                      LucideIcons.share2,
                      size: 16,
                      color: AppColors.primary,
                    ),
                    tooltip: 'Share Invoice',
                    onPressed: () => PdfService.shareInvoice(invoice),
                    visualDensity: VisualDensity.compact,
                  ),
                  IconButton(
                    icon: const Icon(
                      LucideIcons.trash2,
                      size: 16,
                      color: AppColors.error,
                    ),
                    tooltip: 'Delete Invoice',
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

class _HsnAggregate {
  final String hsn;
  double taxableValue = 0.0;
  double cgstRate = 0.0;
  double cgstAmount = 0.0;
  double sgstRate = 0.0;
  double sgstAmount = 0.0;
  double igstRate = 0.0;
  double igstAmount = 0.0;
  double totalTax = 0.0;

  _HsnAggregate({required this.hsn});
}
