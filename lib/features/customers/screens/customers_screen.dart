import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/constants/app_colors.dart';
import '../../../models/customer_model.dart';
import '../../../providers/customer_provider.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_header.dart';

class CustomersScreen extends ConsumerStatefulWidget {
  const CustomersScreen({super.key});

  @override
  ConsumerState<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends ConsumerState<CustomersScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(customerProvider.notifier).loadCustomers();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openCustomerForm([CustomerModel? existingCustomer]) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) =>
          _AddCustomerModal(existingCustomer: existingCustomer),
    );
  }

  void _showCustomerDetails(CustomerModel customer) {
    showDialog(
      context: context,
      builder: (context) => _CustomerDetailsModal(
        customer: customer,
        onEdit: () {
          Navigator.pop(context);
          _openCustomerForm(customer);
        },
      ),
    );
  }

  void _confirmDelete(CustomerModel customer) {
    showDialog(
      context: context,
      builder: (context) => _DeleteConfirmationModal(
        customerName: customer.name,
        onConfirm: () async {
          Navigator.pop(context);
          final messenger = ScaffoldMessenger.of(context);
          final success = await ref
              .read(customerProvider.notifier)
              .deleteCustomer(customer.id);
          messenger.showSnackBar(
            SnackBar(
              content: Text(
                success
                    ? 'Company deleted successfully'
                    : 'Error deleting company',
              ),
              backgroundColor: success ? AppColors.success : AppColors.error,
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final state = ref.watch(customerProvider);
    final customers = state.filteredCustomers;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.scaffoldBg,
      appBar: const AppHeader(title: 'Customers'),
      drawer: const AppDrawer(),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () => ref.read(customerProvider.notifier).loadCustomers(),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ── Top Header Actions: Search & Add Customer Button ──
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                child: Column(
                  children: [
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
                              boxShadow: isDark
                                  ? const []
                                  : const [
                                      BoxShadow(
                                        color: Color(0x08000000),
                                        blurRadius: 6,
                                        offset: Offset(0, 2),
                                      ),
                                    ],
                            ),
                            child: TextField(
                              controller: _searchController,
                              onChanged: (val) => ref
                                  .read(customerProvider.notifier)
                                  .setSearch(val),
                              style: TextStyle(
                                fontSize: 13,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                              ),
                              decoration: InputDecoration(
                                hintText:
                                    'Search customers by name, phone, GSTIN...',
                                hintStyle: TextStyle(
                                  fontSize: 12.5,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.textMuted,
                                ),
                                prefixIcon: Icon(
                                  LucideIcons.search,
                                  size: 17,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                ),
                                suffixIcon: _searchController.text.isNotEmpty
                                    ? IconButton(
                                        icon: Icon(
                                          LucideIcons.x,
                                          size: 15,
                                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                        ),
                                        onPressed: () {
                                          _searchController.clear();
                                          ref
                                              .read(customerProvider.notifier)
                                              .setSearch('');
                                        },
                                      )
                                    : null,
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 12,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),

                        // SecondaryBtn: "Add Customer"
                        InkWell(
                          onTap: () => _openCustomerForm(),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            height: 44,
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFF5722), Color(0xFFE63900)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFFF5722)
                                      .withValues(alpha: 0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  LucideIcons.userPlus,
                                  size: 15,
                                  color: Colors.white,
                                ),
                                SizedBox(width: 6),
                                Text(
                                  'Add Customer',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Filter Summary
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${customers.length} Customer${customers.length == 1 ? '' : 's'} found',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                          ),
                        ),
                        if (state.searchQuery.isNotEmpty)
                          GestureDetector(
                            onTap: () {
                              _searchController.clear();
                              ref.read(customerProvider.notifier).setSearch('');
                            },
                            child: const Text(
                              'Clear filter',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.primary,
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

            // ── Customer Cards List or States ──
            if (state.isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (customers.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Image.asset(
                          AppAssets.emptyIcon,
                          width: 90,
                          height: 90,
                          errorBuilder: (context, error, stackTrace) =>
                              Container(
                                width: 80,
                                height: 80,
                                decoration: const BoxDecoration(
                                  color: AppColors.primaryBg,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  LucideIcons.users,
                                  size: 40,
                                  color: AppColors.primary,
                                ),
                              ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'No companies yet, add your first company to get started',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF374151),
                          ),
                        ),
                        const SizedBox(height: 18),
                        ElevatedButton.icon(
                          onPressed: () => _openCustomerForm(),
                          icon: const Icon(
                            LucideIcons.plus,
                            size: 16,
                            color: Colors.white,
                          ),
                          label: const Text(
                            'Add Customer',
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
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final customer = customers[index];
                    return _ExactCustomerCard(
                      customer: customer,
                      onTap: () => _showCustomerDetails(customer),
                      onEdit: () => _openCustomerForm(customer),
                      onDelete: () => _confirmDelete(customer),
                    );
                  }, childCount: customers.length),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// ── Exact Customer Card matching Next.js page.tsx ──
class _ExactCustomerCard extends StatelessWidget {
  final CustomerModel customer;
  final VoidCallback onTap;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ExactCustomerCard({
    required this.customer,
    required this.onTap,
    required this.onEdit,
    required this.onDelete,
  });

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    try {
      final dt = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy').format(dt);
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final initial = customer.name.isNotEmpty
        ? customer.name[0].toUpperCase()
        : 'C';
    final formattedDate = _formatDate(customer.createdAt);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : null,
        gradient: isDark
            ? null
            : const LinearGradient(
                colors: [Colors.white, Color(0xFFFFF7ED)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkCardBorder : const Color(0xFFE5E7EB),
        ),
        boxShadow: isDark
            ? const []
            : const [
                BoxShadow(
                  color: Color(0x0A000000),
                  blurRadius: 8,
                  offset: Offset(0, 3),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Circular Initial Avatar matching Next.js ──
                // Outer ring: orange ring-4
                Container(
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isDark ? const Color(0x30FB923C) : const Color(0xFFFFEDD5), // orange-100
                    border: Border.all(
                      color: const Color(0xFFFB923C),
                      width: 3.5,
                    ), // ring-4 ring-orange-400
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x22FB923C),
                        blurRadius: 6,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Center(
                    // Inner circle: gray-200 with bold letter
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDark ? const Color(0xFF272A35) : const Color(0xFFE2E8F0), // bg-gray-200
                      ),
                      child: Center(
                        child: Text(
                          initial,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : const Color(0xFF374151), // text-gray-700
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),

                // ── Customer Information ──
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        customer.name,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isDark ? AppColors.darkTextPrimary : const Color(0xFF1F2937), // text-gray-800
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),

                      // Phone with 📞
                      Text(
                        '📞 ${customer.phone.isNotEmpty ? customer.phone : '—'}',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? AppColors.darkTextSecondary : const Color(0xFF4B5563), // text-gray-600
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),

                      // Created Date
                      if (formattedDate.isNotEmpty) ...[
                        const SizedBox(height: 3),
                        Text(
                          'Created: $formattedDate',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: isDark ? AppColors.darkTextSecondary : const Color(0xFF6B7280), // text-gray-500
                          ),
                        ),
                      ],

                      // Optional GSTIN or Company Type
                      if (customer.gstNo != null &&
                          customer.gstNo!.isNotEmpty) ...[
                        const SizedBox(height: 5),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'GST: ${customer.gstNo}',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w600,
                              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                            ),
                          ),
                        ),
                      ],

                      const SizedBox(height: 8),

                      // ── Actions matching Next.js buttons (Edit / Delete) ──
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          // Edit button: bg-blue-600
                          InkWell(
                            onTap: onEdit,
                            borderRadius: BorderRadius.circular(6),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFF2563EB), // bg-blue-600
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'Edit',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Delete button: bg-red-600
                          InkWell(
                            onTap: onDelete,
                            borderRadius: BorderRadius.circular(6),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDC2626), // bg-red-600
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'Delete',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
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
        ),
      ),
    );
  }
}

/// ── Customer Details Modal matching Next.js Details Modal ──
class _CustomerDetailsModal extends StatelessWidget {
  final CustomerModel customer;
  final VoidCallback onEdit;

  const _CustomerDetailsModal({required this.customer, required this.onEdit});

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    try {
      final dt = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy').format(dt);
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final formattedDate = _formatDate(customer.createdAt);
    final fullAddress = [
      customer.address,
      customer.city,
      customer.state,
      customer.zipCode,
    ].where((e) => e != null && e.trim().isNotEmpty).join(', ');

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Customer Name
            Text(
              customer.name,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextPrimary : const Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 16),

            // Detail lines matching Next.js
            if (formattedDate.isNotEmpty)
              _detailRow('Created At:', formattedDate, isDark),
            if (customer.email != null && customer.email!.isNotEmpty)
              _detailRow('Email:', customer.email!, isDark),
            if (customer.phone.isNotEmpty) _detailRow('Phone:', customer.phone, isDark),
            if (fullAddress.isNotEmpty) _detailRow('Address:', fullAddress, isDark),
            if (customer.gstNo != null && customer.gstNo!.isNotEmpty)
              _detailRow('GSTIN:', customer.gstNo!, isDark),
            if (customer.panNo != null && customer.panNo!.isNotEmpty)
              _detailRow('PAN:', customer.panNo!, isDark),
            if (customer.companyType != null &&
                customer.companyType!.isNotEmpty)
              _detailRow('Category:', customer.companyType!, isDark),

            const SizedBox(height: 20),

            // Bottom Buttons: Edit (Primary) & Close (Secondary)
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 10,
                    ),
                  ),
                  onPressed: onEdit,
                  child: const Text(
                    'Edit',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(
                      color: isDark ? AppColors.darkCardBorder : const Color(0xFFD1D5DB),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 10,
                    ),
                  ),
                  onPressed: () => Navigator.pop(context),
                  child: Text(
                    'Close',
                    style: TextStyle(
                      color: isDark ? AppColors.darkTextSecondary : const Color(0xFF374151),
                      fontWeight: FontWeight.bold,
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

  Widget _detailRow(String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: RichText(
        text: TextSpan(
          style: TextStyle(
            fontSize: 13.5,
            color: isDark ? AppColors.darkTextSecondary : const Color(0xFF374151),
          ),
          children: [
            TextSpan(
              text: '$label ',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextPrimary : const Color(0xFF111827),
              ),
            ),
            TextSpan(text: value),
          ],
        ),
      ),
    );
  }
}

/// ── ConfirmationPopUp matching Next.js ──
class _DeleteConfirmationModal extends StatelessWidget {
  final String customerName;
  final VoidCallback onConfirm;

  const _DeleteConfirmationModal({
    required this.customerName,
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
              'Are you sure want to delete the company?',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextPrimary : const Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '"$customerName"',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
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

/// ── Add / Edit Customer Modal matching AddCompanyModal index.tsx with flag="customer" ──
class _AddCustomerModal extends ConsumerStatefulWidget {
  final CustomerModel? existingCustomer;

  const _AddCustomerModal({this.existingCustomer});

  @override
  ConsumerState<_AddCustomerModal> createState() => _AddCustomerModalState();
}

class _AddCustomerModalState extends ConsumerState<_AddCustomerModal> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  late TextEditingController _gstController;
  late TextEditingController _panController;
  late TextEditingController _addressController;
  late TextEditingController _cityController;
  late TextEditingController _stateController;
  late TextEditingController _zipController;
  late TextEditingController _descriptionController;
  String _selectedCompanyType = 'Retail & Wholesale';
  bool _isSaving = false;
  bool _isFetchingGst = false;

  /// Company types from Next.js AddCompanyModal
  final List<String> _companyTypes = [
    'Agriculture & Food Processing',
    'Construction & Real Estate',
    'Education & Training',
    'Energy & Utilities',
    'Events & Entertainment',
    'Finance & Insurance',
    'Healthcare & Medical',
    'Hospitality & Tourism',
    'IT & Software Services',
    'Manufacturing & Industrial',
    'Retail & Wholesale',
    'Transportation & Logistics',
  ];

  @override
  void initState() {
    super.initState();
    final c = widget.existingCustomer;
    _nameController = TextEditingController(text: c?.name ?? '');
    _phoneController = TextEditingController(text: c?.phone ?? '');
    _emailController = TextEditingController(text: c?.email ?? '');
    _gstController = TextEditingController(text: c?.gstNo ?? '');
    _panController = TextEditingController(text: c?.panNo ?? '');
    _addressController = TextEditingController(text: c?.address ?? '');
    _cityController = TextEditingController(text: c?.city ?? '');
    _stateController = TextEditingController(text: c?.state ?? '');
    _zipController = TextEditingController(text: c?.zipCode ?? '');
    _descriptionController = TextEditingController();

    if (c?.companyType != null && _companyTypes.contains(c!.companyType)) {
      _selectedCompanyType = c.companyType!;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _gstController.dispose();
    _panController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _zipController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _validateGST() {
    final gst = _gstController.text.trim().toUpperCase();
    if (gst.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a GST number first.')),
      );
      return;
    }

    setState(() => _isFetchingGst = true);
    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      setState(() => _isFetchingGst = false);
      final gstRegex = RegExp(
        r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
      );
      if (gstRegex.hasMatch(gst)) {
        // Extract PAN from GSTIN (digits 3 to 12)
        if (gst.length >= 12 && _panController.text.isEmpty) {
          _panController.text = gst.substring(2, 12);
        }
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Valid GSTIN format! PAN extracted.'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invalid GSTIN format. Example: 22AAAAA0000A1Z5'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    final isEdit = widget.existingCustomer != null;

    final customerData = CustomerModel(
      id: widget.existingCustomer?.id ?? '',
      name: _nameController.text.trim(),
      phone: _phoneController.text.trim(),
      email: _emailController.text.trim().isNotEmpty
          ? _emailController.text.trim()
          : null,
      gstNo: _gstController.text.trim().isNotEmpty
          ? _gstController.text.trim().toUpperCase()
          : null,
      panNo: _panController.text.trim().isNotEmpty
          ? _panController.text.trim().toUpperCase()
          : null,
      address: _addressController.text.trim().isNotEmpty
          ? _addressController.text.trim()
          : null,
      city: _cityController.text.trim().isNotEmpty
          ? _cityController.text.trim()
          : null,
      state: _stateController.text.trim().isNotEmpty
          ? _stateController.text.trim()
          : null,
      zipCode: _zipController.text.trim().isNotEmpty
          ? _zipController.text.trim()
          : null,
      companyType: _selectedCompanyType,
    );

    bool success;
    if (isEdit) {
      success = await ref
          .read(customerProvider.notifier)
          .updateCustomer(customerData);
    } else {
      success = await ref
          .read(customerProvider.notifier)
          .addCustomer(customerData);
    }

    if (mounted) {
      setState(() => _isSaving = false);
      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isEdit
                  ? 'Customer updated successfully!'
                  : 'Customer created successfully!',
            ),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to save customer. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isEdit = widget.existingCustomer != null;

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
                // Header Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isEdit ? 'Edit Company' : 'Add Company',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: isDark ? AppColors.darkTextPrimary : const Color(0xFF1F2937),
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

                // GST No with Validate Button (Matching Next.js AddCompanyModal)
                Stack(
                  alignment: Alignment.centerRight,
                  children: [
                    TextFormField(
                      controller: _gstController,
                      textCapitalization: TextCapitalization.characters,
                      style: const TextStyle(fontSize: 13.5),
                      decoration: InputDecoration(
                        labelText: 'GST No (Optional)',
                        hintText: 'e.g. 33AAAAA0000A1Z5',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                      ),
                    ),
                    Positioned(
                      right: 8,
                      child: TextButton(
                        onPressed: _isFetchingGst ? null : _validateGST,
                        child: Text(
                          _isFetchingGst ? 'Loading...' : 'Validate',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFFF5722),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Company Name *
                TextFormField(
                  controller: _nameController,
                  style: const TextStyle(fontSize: 13.5),
                  decoration: InputDecoration(
                    labelText: 'Company Name *',
                    hintText: 'Enter business or customer name',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                  ),
                  validator: (val) => val == null || val.trim().isEmpty
                      ? 'Company name is required'
                      : null,
                ),
                const SizedBox(height: 12),

                // Phone Number *
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(fontSize: 13.5),
                  decoration: InputDecoration(
                    labelText: 'Phone Number *',
                    hintText: 'Enter 10-digit mobile number',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                  ),
                  validator: (val) => val == null || val.trim().isEmpty
                      ? 'Phone number is required'
                      : null,
                ),
                const SizedBox(height: 12),

                // Email (Optional)
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(fontSize: 13.5),
                  decoration: InputDecoration(
                    labelText: 'Email (Optional)',
                    hintText: 'contact@company.com',
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

                // Categories Dropdown *
                DropdownButtonFormField<String>(
                  initialValue: _selectedCompanyType,
                  decoration: InputDecoration(
                    labelText: 'Select Categories *',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                  ),
                  items: _companyTypes.map((type) {
                    return DropdownMenuItem(
                      value: type,
                      child: Text(type, style: const TextStyle(fontSize: 13)),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedCompanyType = val);
                  },
                ),
                const SizedBox(height: 12),

                // PAN No (Optional)
                TextFormField(
                  controller: _panController,
                  textCapitalization: TextCapitalization.characters,
                  maxLength: 10,
                  style: const TextStyle(fontSize: 13.5),
                  decoration: InputDecoration(
                    counterText: '',
                    labelText: 'PAN No (Optional)',
                    hintText: 'ABCDE1234F',
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

                // Street Address (Optional)
                TextFormField(
                  controller: _addressController,
                  maxLines: 2,
                  style: const TextStyle(fontSize: 13.5),
                  decoration: InputDecoration(
                    labelText: 'Street Address (Optional)',
                    hintText: 'Enter building, street, area',
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

                // City * & State Row
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _cityController,
                        style: const TextStyle(fontSize: 13.5),
                        decoration: InputDecoration(
                          labelText: 'City *',
                          hintText: 'City name',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                        ),
                        validator: (val) => val == null || val.trim().isEmpty
                            ? 'City is required'
                            : null,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextFormField(
                        controller: _stateController,
                        style: const TextStyle(fontSize: 13.5),
                        decoration: InputDecoration(
                          labelText: 'State (Optional)',
                          hintText: 'State',
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

                // Zip Code (Optional)
                TextFormField(
                  controller: _zipController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(fontSize: 13.5),
                  decoration: InputDecoration(
                    labelText: 'Zip Code (Optional)',
                    hintText: 'Postal code',
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

                // Action Buttons: Cancel and Save
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
                              isEdit ? 'Update Company' : 'Save Company',
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
