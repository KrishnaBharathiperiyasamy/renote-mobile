import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/constants/app_colors.dart';
import '../../../models/customer_model.dart';
import '../../../models/invoice_model.dart';
import '../../../models/marketplace_item_model.dart';
import '../../../models/poster_model.dart';
import '../../../models/quotation_model.dart';
import '../../../providers/company_provider.dart';
import '../../../providers/customer_provider.dart';
import '../../../providers/invoice_provider.dart';
import '../../../providers/marketplace_provider.dart';
import '../../../providers/poster_provider.dart';
import '../../../providers/quotation_provider.dart';
import '../../../providers/subscription_provider.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_header.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _selectedAnalyticsYear = DateTime.now().year;
  int? _hoveredMonthIndex;

  final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshAllData();
    });
  }

  Future<void> _refreshAllData() async {
    await Future.wait<void>([
      ref.read(companyProvider.notifier).loadCompanies(),
      ref.read(invoiceProvider.notifier).loadInvoices(),
      ref.read(quotationProvider.notifier).loadQuotations(),
      ref.read(customerProvider.notifier).loadCustomers(),
      ref.read(marketplaceProvider.notifier).loadFeed(),
      ref.read(posterProvider.notifier).loadPosters(),
      ref.read(subscriptionProvider.notifier).loadSubscriptionData(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final companyState = ref.watch(companyProvider);
    final invoiceState = ref.watch(invoiceProvider);
    final quotationState = ref.watch(quotationProvider);
    final customerState = ref.watch(customerProvider);
    final marketplaceState = ref.watch(marketplaceProvider);
    final posterState = ref.watch(posterProvider);
    final subscriptionState = ref.watch(subscriptionProvider);

    // ── Selected Company Filtered Data ──
    final selectedCompany = companyState.selectedCompany;
    final selectedCompanyId = selectedCompany?.id;

    // Filter invoices by selected company
    final companyInvoices = (selectedCompanyId != null && selectedCompanyId.isNotEmpty)
        ? invoiceState.invoices.where((inv) => inv.vendorCompanyId == selectedCompanyId).toList()
        : invoiceState.invoices;

    // Filter quotations by selected company
    final companyQuotations = (selectedCompanyId != null && selectedCompanyId.isNotEmpty)
        ? quotationState.quotations.where((q) => q.vendorCompanyId == selectedCompanyId).toList()
        : quotationState.quotations;

    // Filter posters by selected company
    final companyPosters = (selectedCompanyId != null && selectedCompanyId.isNotEmpty)
        ? posterState.posters.where((p) => p.companyId == selectedCompanyId).toList()
        : posterState.posters;

    // Calculations for Revenue Overview
    final collectedRevenue = companyInvoices
        .where((inv) => inv.status.toLowerCase() == 'paid')
        .fold<double>(0.0, (sum, inv) => sum + inv.totalAmount);

    final totalInvoiced = companyInvoices
        .fold<double>(0.0, (sum, inv) => sum + inv.totalAmount);

    final outstandingAmount = companyInvoices
        .where((inv) => inv.status.toLowerCase() != 'paid')
        .fold<double>(0.0, (sum, inv) => sum + inv.totalAmount);

    final collectionPercentage = totalInvoiced > 0
        ? ((collectedRevenue / totalInvoiced) * 100).clamp(0.0, 100.0)
        : 0.0;

    // Invoice Breakdown
    final paidInvoices = companyInvoices
        .where((inv) => inv.status.toLowerCase() == 'paid')
        .toList();

    final pendingInvoices = companyInvoices.where((inv) {
      if (inv.status.toLowerCase() == 'paid') return false;
      if (inv.dueDate != null) {
        final due = DateTime.tryParse(inv.dueDate!);
        if (due != null && due.isBefore(DateTime.now())) return false;
      }
      return true;
    }).toList();

    final overdueInvoices = companyInvoices.where((inv) {
      if (inv.status.toLowerCase() == 'paid') return false;
      if (inv.dueDate != null) {
        final due = DateTime.tryParse(inv.dueDate!);
        return due != null && due.isBefore(DateTime.now());
      }
      return false;
    }).toList();

    // Quotation Breakdown
    final totalQuotations = companyQuotations.length;
    final totalQuotedAmount = companyQuotations.fold<double>(0.0, (sum, q) => sum + q.totalAmount);

    // Recent Business Activities
    final activities = _compileRecentActivities(
      companyInvoices: companyInvoices,
      companyQuotations: companyQuotations,
      customers: customerState.customers,
      posters: companyPosters,
      marketplaceItems: marketplaceState.items,
    );

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.scaffoldBg,
      appBar: const AppHeader(),
      drawer: const AppDrawer(),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _refreshAllData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1000),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── SECTION 1: Revenue Overview Card ──
                  _buildRevenueOverviewCard(
                    isDark: isDark,
                    collectedRevenue: collectedRevenue,
                    totalInvoiced: totalInvoiced,
                    outstandingAmount: outstandingAmount,
                    collectionPercentage: collectionPercentage,
                  ),
                  const SizedBox(height: 16),

                  // ── SECTION 3: Business Statistics Grid ──
                  _buildBusinessStatisticsGrid(
                    context: context,
                    isDark: isDark,
                    totalQuotations: totalQuotations,
                    totalInvoices: companyInvoices.length,
                    totalCustomers: customerState.customers.length,
                    activeListings: marketplaceState.items.length,
                  ),
                  const SizedBox(height: 20),

                  // ── SECTION 4: Revenue Analytics & Monthly Chart ──
                  _buildRevenueAnalyticsSection(
                    isDark: isDark,
                    companyInvoices: companyInvoices,
                  ),
                  const SizedBox(height: 20),

                  // ── SECTIONS 5 & 6: Invoice & Quotation Breakdown Cards ──
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final isWide = constraints.maxWidth >= 650;
                      if (isWide) {
                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: _buildInvoiceOverviewCard(
                                context: context,
                                isDark: isDark,
                                totalInvoices: companyInvoices.length,
                                paidInvoices: paidInvoices,
                                pendingInvoices: pendingInvoices,
                                overdueInvoices: overdueInvoices,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: _buildQuotationOverviewCard(
                                context: context,
                                isDark: isDark,
                                totalQuotations: totalQuotations,
                                totalQuotedAmount: totalQuotedAmount,
                                quotations: companyQuotations,
                              ),
                            ),
                          ],
                        );
                      } else {
                        return Column(
                          children: [
                            _buildInvoiceOverviewCard(
                              context: context,
                              isDark: isDark,
                              totalInvoices: companyInvoices.length,
                              paidInvoices: paidInvoices,
                              pendingInvoices: pendingInvoices,
                              overdueInvoices: overdueInvoices,
                            ),
                            const SizedBox(height: 14),
                            _buildQuotationOverviewCard(
                              context: context,
                              isDark: isDark,
                              totalQuotations: totalQuotations,
                              totalQuotedAmount: totalQuotedAmount,
                              quotations: companyQuotations,
                            ),
                          ],
                        );
                      }
                    },
                  ),
                  const SizedBox(height: 20),

                  // ── SECTION 7: Recent Business Activities ──
                  _buildRecentActivitiesSection(
                    context: context,
                    isDark: isDark,
                    activities: activities,
                  ),
                  const SizedBox(height: 20),

                  // ── SECTION 8: Application Overview ──
                  _buildApplicationOverviewSection(
                    context: context,
                    isDark: isDark,
                    marketplaceCount: marketplaceState.items.length,
                    postersCount: companyPosters.length,
                    subscriptionPlan: subscriptionState.currentSubscription?.planName ?? 'Free Plan',
                  ),
                  const SizedBox(height: 36),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 1: Revenue Overview Card
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildRevenueOverviewCard({
    required bool isDark,
    required double collectedRevenue,
    required double totalInvoiced,
    required double outstandingAmount,
    required double collectionPercentage,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  const Color(0xFF1E212B),
                  const Color(0xFF151821),
                ]
              : [
                  const Color(0xFFFFFFFF),
                  const Color(0xFFF8FAFC),
                ],
        ),
        border: Border.all(
          color: isDark ? const Color(0xFF2E3346) : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.4)
                : AppColors.primary.withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(25),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        LucideIcons.wallet,
                        color: AppColors.primary,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Total Collected Revenue',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Actual Realized Income',
                            style: TextStyle(
                              fontSize: 10,
                              color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.success.withAlpha(25),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.success.withAlpha(60)),
                ),
                child: Text(
                  '${collectionPercentage.toStringAsFixed(1)}% Collected',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppColors.success,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Main Revenue Value
          Text(
            _currencyFormat.format(collectedRevenue),
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : AppColors.textPrimary,
              letterSpacing: -1.0,
            ),
          ),
          const SizedBox(height: 14),

          // Visual Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: totalInvoiced > 0 ? (collectionPercentage / 100).clamp(0.0, 1.0) : 0.0,
              minHeight: 8,
              backgroundColor: isDark ? const Color(0xFF2A2E3D) : const Color(0xFFE2E8F0),
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
            ),
          ),
          const SizedBox(height: 16),

          // Secondary Financial Metrics (Invoiced vs Outstanding)
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF141720) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Total Invoiced',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _currencyFormat.format(totalInvoiced),
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
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
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF141720) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Outstanding Amount',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _currencyFormat.format(outstandingAmount),
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppColors.warning,
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
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3: Business Statistics Grid (2x2)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildBusinessStatisticsGrid({
    required BuildContext context,
    required bool isDark,
    required int totalQuotations,
    required int totalInvoices,
    required int totalCustomers,
    required int activeListings,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Business Performance',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 10),
        LayoutBuilder(
          builder: (context, constraints) {
            final isDesktop = constraints.maxWidth >= 720;
            if (isDesktop) {
              return Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      isDark: isDark,
                      icon: LucideIcons.fileText,
                      title: 'Quotations',
                      value: '$totalQuotations',
                      subtitle: 'Active Estimates',
                      accentColor: const Color(0xFF3B82F6),
                      onTap: () => context.go('/quotations'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildStatCard(
                      isDark: isDark,
                      icon: LucideIcons.receipt,
                      title: 'Tax Invoices',
                      value: '$totalInvoices',
                      subtitle: 'Commercial Invoices',
                      accentColor: AppColors.primary,
                      onTap: () => context.go('/invoices'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildStatCard(
                      isDark: isDark,
                      icon: LucideIcons.users,
                      title: 'Customers',
                      value: '$totalCustomers',
                      subtitle: 'Client Directory',
                      accentColor: AppColors.success,
                      onTap: () => Scaffold.of(context).openDrawer(),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildStatCard(
                      isDark: isDark,
                      icon: LucideIcons.store,
                      title: 'Market Listings',
                      value: '$activeListings',
                      subtitle: 'Live Listings',
                      accentColor: const Color(0xFF8B5CF6),
                      onTap: () => context.go('/marketplace'),
                    ),
                  ),
                ],
              );
            } else {
              return Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          isDark: isDark,
                          icon: LucideIcons.fileText,
                          title: 'Quotations',
                          value: '$totalQuotations',
                          subtitle: 'Estimates',
                          accentColor: const Color(0xFF3B82F6),
                          onTap: () => context.go('/quotations'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildStatCard(
                          isDark: isDark,
                          icon: LucideIcons.receipt,
                          title: 'Tax Invoices',
                          value: '$totalInvoices',
                          subtitle: 'Invoices',
                          accentColor: AppColors.primary,
                          onTap: () => context.go('/invoices'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          isDark: isDark,
                          icon: LucideIcons.users,
                          title: 'Customers',
                          value: '$totalCustomers',
                          subtitle: 'Clients',
                          accentColor: AppColors.success,
                          onTap: () => Scaffold.of(context).openDrawer(),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildStatCard(
                          isDark: isDark,
                          icon: LucideIcons.store,
                          title: 'Market Listings',
                          value: '$activeListings',
                          subtitle: 'Live Listings',
                          accentColor: const Color(0xFF8B5CF6),
                          onTap: () => context.go('/marketplace'),
                        ),
                      ),
                    ],
                  ),
                ],
              );
            }
          },
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required bool isDark,
    required IconData icon,
    required String title,
    required String value,
    required String subtitle,
    required Color accentColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? AppColors.darkCardBorder : AppColors.cardBorder,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: accentColor.withAlpha(25),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: accentColor, size: 18),
                ),
                Icon(
                  LucideIcons.arrowUpRight,
                  size: 14,
                  color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
              ),
            ),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 10,
                color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4: Revenue Analytics & Monthly Chart
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildRevenueAnalyticsSection({
    required bool isDark,
    required List<InvoiceModel> companyInvoices,
  }) {
    // 12 months array
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final monthlyRevenues = List<double>.filled(12, 0.0);
    final monthlyCounts = List<int>.filled(12, 0);

    for (final inv in companyInvoices) {
      if (inv.status.toLowerCase() != 'paid') continue;
      if (inv.date == null) continue;
      final parsed = DateTime.tryParse(inv.date!);
      if (parsed != null && parsed.year == _selectedAnalyticsYear) {
        final mIdx = parsed.month - 1;
        monthlyRevenues[mIdx] += inv.totalAmount;
        monthlyCounts[mIdx] += 1;
      }
    }

    final maxRevenue = monthlyRevenues.fold<double>(0.0, (max, v) => v > max ? v : max);
    final hasAnyRevenueInYear = maxRevenue > 0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? AppColors.darkCardBorder : AppColors.cardBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header & Year Filter
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Revenue Analytics',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Monthly collected payments comparison',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Year Filter Dropdown / Buttons
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF272A35) : AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isDark ? const Color(0xFF3B4054) : AppColors.cardBorder,
                  ),
                ),
                child: DropdownButton<int>(
                  value: _selectedAnalyticsYear,
                  underline: const SizedBox(),
                  dropdownColor: isDark ? AppColors.darkCard : Colors.white,
                  icon: Icon(
                    LucideIcons.chevronDown,
                    size: 14,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                  ),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                  ),
                  items: [
                    DropdownMenuItem(value: DateTime.now().year, child: Text('${DateTime.now().year}')),
                    DropdownMenuItem(value: DateTime.now().year - 1, child: Text('${DateTime.now().year - 1}')),
                  ],
                  onChanged: (y) {
                    if (y != null) {
                      setState(() {
                        _selectedAnalyticsYear = y;
                        _hoveredMonthIndex = null;
                      });
                    }
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Monthly Chart Visualization
          SizedBox(
            height: 160,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(12, (index) {
                final amount = monthlyRevenues[index];
                final normalizedHeight = hasAnyRevenueInYear ? (amount / maxRevenue) : 0.0;
                final isSelected = _hoveredMonthIndex == index;

                return Expanded(
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _hoveredMonthIndex = _hoveredMonthIndex == index ? null : index;
                      });
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          // Tooltip / value preview above bar
                          if (isSelected)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                              margin: const EdgeInsets.only(bottom: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                _currencyFormat.format(amount),
                                style: const TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                                maxLines: 1,
                              ),
                            ),

                          // Bar Indicator
                          Container(
                            height: (normalizedHeight * 110).clamp(amount > 0 ? 8.0 : 3.0, 110.0),
                            decoration: BoxDecoration(
                              color: amount > 0
                                  ? (isSelected ? AppColors.primary : AppColors.primary.withAlpha(200))
                                  : (isDark ? const Color(0xFF262A38) : const Color(0xFFE2E8F0)),
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                            ),
                          ),
                          const SizedBox(height: 6),

                          // Month Label
                          Text(
                            months[index],
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                              color: isSelected
                                  ? AppColors.primary
                                  : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 10),

          // Selected Month Details Banner or Empty State Notice
          if (_hoveredMonthIndex != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              margin: const EdgeInsets.only(top: 8),
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(20),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.primary.withAlpha(60)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${months[_hoveredMonthIndex!]} $_selectedAnalyticsYear Collections:',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary),
                  ),
                  Text(
                    '${_currencyFormat.format(monthlyRevenues[_hoveredMonthIndex!])} (${monthlyCounts[_hoveredMonthIndex!]} invoices)',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                ],
              ),
            )
          else if (!hasAnyRevenueInYear)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Center(
                child: Text(
                  'No collected payments recorded for $_selectedAnalyticsYear yet.',
                  style: TextStyle(
                    fontSize: 11,
                    fontStyle: FontStyle.italic,
                    color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5: Invoice Overview Card
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildInvoiceOverviewCard({
    required BuildContext context,
    required bool isDark,
    required int totalInvoices,
    required List<InvoiceModel> paidInvoices,
    required List<InvoiceModel> pendingInvoices,
    required List<InvoiceModel> overdueInvoices,
  }) {
    final paidAmount = paidInvoices.fold<double>(0.0, (sum, i) => sum + i.totalAmount);
    final pendingAmount = pendingInvoices.fold<double>(0.0, (sum, i) => sum + i.totalAmount);
    final overdueAmount = overdueInvoices.fold<double>(0.0, (sum, i) => sum + i.totalAmount);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? AppColors.darkCardBorder : AppColors.cardBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Invoices Breakdown',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                ),
              ),
              InkWell(
                onTap: () => context.go('/invoices'),
                child: const Text(
                  'View All →',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Status Rows
          _buildStatusProgressRow(
            label: 'Paid Invoices',
            count: paidInvoices.length,
            amount: _currencyFormat.format(paidAmount),
            color: AppColors.success,
            isDark: isDark,
          ),
          const SizedBox(height: 10),
          _buildStatusProgressRow(
            label: 'Pending Invoices',
            count: pendingInvoices.length,
            amount: _currencyFormat.format(pendingAmount),
            color: AppColors.warning,
            isDark: isDark,
          ),
          const SizedBox(height: 10),
          _buildStatusProgressRow(
            label: 'Overdue Invoices',
            count: overdueInvoices.length,
            amount: _currencyFormat.format(overdueAmount),
            color: AppColors.danger,
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildStatusProgressRow({
    required String label,
    required int count,
    required String amount,
    required Color color,
    required bool isDark,
  }) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(shape: BoxShape.circle, color: color),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: color.withAlpha(25),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            '$count',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          amount,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 6: Quotation Overview Card
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildQuotationOverviewCard({
    required BuildContext context,
    required bool isDark,
    required int totalQuotations,
    required double totalQuotedAmount,
    required List<QuotationModel> quotations,
  }) {
    final avgQuote = totalQuotations > 0 ? (totalQuotedAmount / totalQuotations) : 0.0;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? AppColors.darkCardBorder : AppColors.cardBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Quotations Overview',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                ),
              ),
              InkWell(
                onTap: () => context.go('/quotations'),
                child: const Text(
                  'View All →',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Total Estimates
          _buildStatusProgressRow(
            label: 'Total Estimates',
            count: totalQuotations,
            amount: _currencyFormat.format(totalQuotedAmount),
            color: const Color(0xFF3B82F6),
            isDark: isDark,
          ),
          const SizedBox(height: 10),

          // Average Value
          _buildStatusProgressRow(
            label: 'Average Quote Value',
            count: totalQuotations > 0 ? 1 : 0,
            amount: _currencyFormat.format(avgQuote),
            color: const Color(0xFF8B5CF6),
            isDark: isDark,
          ),
          const SizedBox(height: 10),

          // Conversion readiness
          _buildStatusProgressRow(
            label: 'Ready for Invoicing',
            count: totalQuotations,
            amount: '$totalQuotations Est',
            color: AppColors.primary,
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 7: Recent Business Activities Feed
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildRecentActivitiesSection({
    required BuildContext context,
    required bool isDark,
    required List<_DashboardActivityItem> activities,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? AppColors.darkCardBorder : AppColors.cardBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent Business Activity',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                ),
              ),
              Icon(
                LucideIcons.activity,
                size: 16,
                color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
              ),
            ],
          ),
          const SizedBox(height: 14),

          if (activities.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      LucideIcons.history,
                      size: 32,
                      color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'No recent business activity yet',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Activities appear automatically as you create invoices, send estimates, and add customers.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            ...activities.take(6).map((act) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: InkWell(
                  onTap: act.onTap,
                  borderRadius: BorderRadius.circular(10),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: act.color.withAlpha(25),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(act.icon, size: 16, color: act.color),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              act.title,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              act.subtitle,
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        act.timeAgoText ?? (act.timestamp != null ? _formatTimeAgo(act.timestamp!) : ''),
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 8: Application Quick-Access Overview
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildApplicationOverviewSection({
    required BuildContext context,
    required bool isDark,
    required int marketplaceCount,
    required int postersCount,
    required String subscriptionPlan,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'ReNote Suite',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 10),
        _buildModuleNavigationCard(
          context: context,
          isDark: isDark,
          icon: LucideIcons.store,
          title: 'B2B Marketplace',
          subtitle: 'Explore live listings, connect with wholesale buyers & suppliers',
          badgeText: '$marketplaceCount listings',
          route: '/marketplace',
        ),
        const SizedBox(height: 8),
        _buildModuleNavigationCard(
          context: context,
          isDark: isDark,
          icon: LucideIcons.palette,
          title: 'Poster Studio',
          subtitle: 'Create promotional marketing banners, flyers and deal posters',
          badgeText: '$postersCount saved',
          route: '/posters',
        ),
        const SizedBox(height: 8),
        _buildModuleNavigationCard(
          context: context,
          isDark: isDark,
          icon: LucideIcons.sparkles,
          title: 'Subscription & Billing',
          subtitle: 'Manage plan tiers, active business seats, and platform limits',
          badgeText: subscriptionPlan,
          route: '/subscription',
        ),
      ],
    );
  }

  Widget _buildModuleNavigationCard({
    required BuildContext context,
    required bool isDark,
    required IconData icon,
    required String title,
    required String subtitle,
    required String badgeText,
    required String route,
  }) {
    return InkWell(
      onTap: () => context.go(route),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? AppColors.darkCardBorder : AppColors.cardBorder,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(25),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF262A38) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                badgeText,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ),
            const SizedBox(width: 6),
            Icon(
              LucideIcons.chevronRight,
              size: 16,
              color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
            ),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPER: Activity Items Compiler
  // ══════════════════════════════════════════════════════════════════════════
  List<_DashboardActivityItem> _compileRecentActivities({
    required List<InvoiceModel> companyInvoices,
    required List<QuotationModel> companyQuotations,
    required List<CustomerModel> customers,
    required List<PosterModel> posters,
    required List<MarketplaceItemModel> marketplaceItems,
  }) {
    final List<_DashboardActivityItem> items = [];

    // 1. Invoices
    for (final inv in companyInvoices) {
      final isPaid = inv.status.toLowerCase() == 'paid';
      final dt = inv.date != null ? DateTime.tryParse(inv.date!) : null;
      items.add(
        _DashboardActivityItem(
          icon: isPaid ? LucideIcons.badgeCheck : LucideIcons.receipt,
          color: isPaid ? AppColors.success : AppColors.primary,
          title: isPaid
              ? 'Payment Settled: ${inv.invoiceId}'
              : 'Tax Invoice Created: ${inv.invoiceId}',
          subtitle: '${inv.customerName ?? "Client"} • ${_currencyFormat.format(inv.totalAmount)}',
          timestamp: dt,
          onTap: () => context.go('/invoices'),
        ),
      );
    }

    // 2. Quotations
    for (final q in companyQuotations) {
      final dt = q.date != null ? DateTime.tryParse(q.date!) : null;
      items.add(
        _DashboardActivityItem(
          icon: LucideIcons.fileText,
          color: const Color(0xFF3B82F6),
          title: 'Quotation Generated: ${q.estimateId}',
          subtitle: '${q.customerName ?? "Client"} • ${_currencyFormat.format(q.totalAmount)}',
          timestamp: dt,
          onTap: () => context.go('/quotations'),
        ),
      );
    }

    // 3. Customers
    for (final c in customers) {
      final dt = c.createdAt != null ? DateTime.tryParse(c.createdAt!) : null;
      items.add(
        _DashboardActivityItem(
          icon: LucideIcons.userPlus,
          color: AppColors.success,
          title: 'Customer Added: ${c.name}',
          subtitle: c.city != null && c.city!.isNotEmpty ? c.city! : c.phone,
          timestamp: dt,
          onTap: () => Scaffold.of(context).openDrawer(),
        ),
      );
    }

    // 4. Posters
    for (final p in posters) {
      items.add(
        _DashboardActivityItem(
          icon: LucideIcons.palette,
          color: const Color(0xFFEC4899),
          title: 'Poster Created: ${p.posterName}',
          subtitle: '${p.templateCategory} Template (${p.aspectRatio})',
          timestamp: null,
          timeAgoText: 'Saved',
          onTap: () => context.go('/posters'),
        ),
      );
    }

    // 5. Marketplace items
    for (final m in marketplaceItems.take(2)) {
      final dt = m.createdAt != null ? DateTime.tryParse(m.createdAt!) : null;
      items.add(
        _DashboardActivityItem(
          icon: LucideIcons.store,
          color: const Color(0xFF8B5CF6),
          title: 'Marketplace Product: ${m.title}',
          subtitle: '${m.category} • ${_currencyFormat.format(m.price)}',
          timestamp: dt,
          timeAgoText: m.timeAgo,
          onTap: () => context.go('/marketplace'),
        ),
      );
    }

    // Sort descending by timestamp
    items.sort((a, b) {
      if (a.timestamp == null && b.timestamp == null) return 0;
      if (a.timestamp == null) return 1;
      if (b.timestamp == null) return -1;
      return b.timestamp!.compareTo(a.timestamp!);
    });

    return items;
  }

  String _formatTimeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('dd MMM').format(dt);
  }
}

class _DashboardActivityItem {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final DateTime? timestamp;
  final String? timeAgoText;
  final VoidCallback? onTap;

  _DashboardActivityItem({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    this.timestamp,
    this.timeAgoText,
    this.onTap,
  });
}
