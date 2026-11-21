import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/constants/app_colors.dart';
import '../../../models/customer_model.dart';
import '../../../models/quotation_model.dart';
import '../../../providers/company_provider.dart';
import '../../../providers/customer_provider.dart';
import '../../../providers/product_provider.dart';
import '../../../providers/quotation_provider.dart';
import '../../../services/api_service.dart';
import '../../../services/pdf_service.dart';
import '../../../services/storage_service.dart';
import '../../../shared/widgets/brand_flame_logo.dart';
import '../../../shared/widgets/custom_text_field.dart';

class CreateQuotationScreen extends ConsumerStatefulWidget {
  final QuotationModel? initialQuotation;
  const CreateQuotationScreen({super.key, this.initialQuotation});

  @override
  ConsumerState<CreateQuotationScreen> createState() =>
      _CreateQuotationScreenState();
}

class _CreateQuotationScreenState extends ConsumerState<CreateQuotationScreen> {
  final _formKey = GlobalKey<FormState>();
  late String _estimateId;
  bool _isLoadingId = true;
  bool _isSaving = false;

  String? _selectedCompanyId;
  final TextEditingController _customerNameController = TextEditingController();
  final TextEditingController _customerPhoneController =
      TextEditingController();
  final TextEditingController _customerEmailController =
      TextEditingController();
  final TextEditingController _customerAddressController =
      TextEditingController();
  final TextEditingController _customerGstController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  final List<DocumentItem> _items = [];

  final List<String> _units = [
    'Pcs',
    'Kg',
    'Meter',
    'Box',
    'Ltr',
    'Dozen',
    'Sqft',
    'Hours',
    'PC',
  ];
  final List<double> _gstRates = [0.0, 5.0, 12.0, 18.0, 28.0];

  final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 2,
  );

  bool get _isEditMode => widget.initialQuotation != null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(companyProvider.notifier).loadCompanies();
      ref.read(customerProvider.notifier).loadCustomers();
      ref.read(productProvider.notifier).loadProducts();
    });

    if (_isEditMode) {
      final q = widget.initialQuotation!;
      _estimateId = q.estimateId;
      _isLoadingId = false;
      _selectedCompanyId = q.vendorCompanyId;
      _customerNameController.text = q.customerName ?? '';
      _customerPhoneController.text = q.customerPhone ?? '';
      _customerEmailController.text = q.customerEmail ?? '';
      _customerAddressController.text = q.customerAddress ?? '';
      _customerGstController.text = q.customerGstNo ?? '';
      _notesController.text = q.notes ?? '';

      if (q.items.isNotEmpty) {
        for (final item in q.items) {
          _items.add(
            DocumentItem(
              product: item.product,
              price: item.price,
              qty: item.qty,
              unit: item.unit,
              gst: item.gst,
              hsn: item.hsn,
            ),
          );
        }
      } else {
        _items.add(
          DocumentItem(
            product: '',
            price: 0.0,
            qty: 1.0,
            unit: 'Pcs',
            gst: 18.0,
            hsn: '',
          ),
        );
      }
    } else {
      _estimateId = 'E2611001';
      _items.add(
        DocumentItem(
          product: '',
          price: 0.0,
          qty: 1.0,
          unit: 'Pcs',
          gst: 18.0,
          hsn: '',
        ),
      );
      _fetchNextId();
    }
  }

  @override
  void dispose() {
    _customerNameController.dispose();
    _customerPhoneController.dispose();
    _customerEmailController.dispose();
    _customerAddressController.dispose();
    _customerGstController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _fetchNextId() async {
    final userId = StorageService().getUserId();
    if (userId != null) {
      final nextId = await ApiService().fetchNextQuotationId(userId);
      if (mounted) {
        setState(() {
          _estimateId = nextId;
          _isLoadingId = false;
        });
      }
    } else {
      if (mounted) setState(() => _isLoadingId = false);
    }
  }

  void _onCustomerSelected(CustomerModel? customer) {
    if (customer != null) {
      setState(() {
        _customerNameController.text = customer.name;
        _customerPhoneController.text = customer.phone;
        _customerEmailController.text = customer.email ?? '';
        _customerAddressController.text = customer.address ?? '';
        _customerGstController.text = customer.gstNo ?? '';
      });
    }
  }

  void _addItem() {
    setState(() {
      _items.add(
        DocumentItem(
          product: '',
          price: 0.0,
          qty: 1.0,
          unit: 'Pcs',
          gst: 18.0,
          hsn: '',
        ),
      );
    });
  }

  void _removeItem(int index) {
    if (_items.length <= 1) return;
    setState(() {
      _items.removeAt(index);
    });
  }

  void _pickProductForItem(int index) {
    final products = ref.read(productProvider).products;
    if (products.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'No warehouse products found. You can enter the product name manually.',
          ),
        ),
      );
      return;
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(16),
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.6,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Select Product from Warehouse',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      LucideIcons.x,
                      size: 18,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Expanded(
                child: ListView.separated(
                  itemCount: products.length,
                  separatorBuilder: (_, _) => Divider(
                    height: 1,
                    color: isDark ? AppColors.darkCardBorder : AppColors.border,
                  ),
                  itemBuilder: (context, idx) {
                    final p = products[idx];
                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 4,
                        vertical: 2,
                      ),
                      title: Text(
                        p.name,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                        ),
                      ),
                      subtitle: Text(
                        '₹${p.price.toStringAsFixed(2)} • ${p.gst.toStringAsFixed(0)}% GST • HSN: ${p.hsn ?? "-"}',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                        ),
                      ),
                      trailing: Text(
                        '${p.qty.toStringAsFixed(0)} ${p.unit}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      onTap: () {
                        setState(() {
                          _items[index].product = p.name;
                          _items[index].price = p.price;
                          _items[index].unit = _units.contains(p.unit)
                              ? p.unit
                              : 'Pcs';
                          _items[index].gst = p.gst;
                          _items[index].hsn = p.hsn ?? '';
                        });
                        Navigator.pop(context);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  double get _subtotal => _items.fold(0.0, (acc, item) => acc + item.amount);
  double get _totalGst => _items.fold(0.0, (acc, item) => acc + item.taxAmount);
  double get _grandTotal => _subtotal + _totalGst;

  QuotationModel _buildQuotationModel() {
    final companyState = ref.read(companyProvider);
    String targetCompId = _selectedCompanyId ?? '';
    String targetCompName = 'KrishTech Computers';

    if (companyState.companies.isNotEmpty) {
      final found = companyState.companies.where(
        (c) => c.id == _selectedCompanyId,
      );
      if (found.isNotEmpty) {
        targetCompId = found.first.id;
        targetCompName = found.first.name;
      } else {
        targetCompId = companyState.companies.first.id;
        targetCompName = companyState.companies.first.name;
      }
    }

    return QuotationModel(
      id: widget.initialQuotation?.id ?? '',
      estimateId: _estimateId,
      vendorCompanyId: targetCompId,
      vendorCompanyName: targetCompName,
      customerName: _customerNameController.text.trim().isNotEmpty
          ? _customerNameController.text.trim()
          : 'Valued Customer',
      customerPhone: _customerPhoneController.text.trim(),
      customerEmail: _customerEmailController.text.trim(),
      customerAddress: _customerAddressController.text.trim(),
      customerGstNo: _customerGstController.text.trim(),
      items: _items.where((i) => i.product.trim().isNotEmpty).toList(),
      subtotal: _subtotal,
      taxAmount: _totalGst,
      totalAmount: _grandTotal,
      notes: _notesController.text.trim(),
      date: widget.initialQuotation?.date ?? DateTime.now().toIso8601String(),
      isFavorite: widget.initialQuotation?.isFavorite ?? false,
    );
  }

  Future<void> _saveQuotation() async {
    if (!_formKey.currentState!.validate()) return;

    if (_customerNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter or select a customer name'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    final validItems = _items
        .where((i) => i.product.trim().isNotEmpty)
        .toList();
    if (validItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Please add at least one item with a valid description and rate',
          ),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);
    final model = _buildQuotationModel();

    bool success;
    if (_isEditMode) {
      success = await ref
          .read(quotationProvider.notifier)
          .updateQuotation(model);
    } else {
      success = await ref
          .read(quotationProvider.notifier)
          .createQuotation(model);
    }

    if (mounted) {
      setState(() => _isSaving = false);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isEditMode
                  ? 'Quotation #$_estimateId updated successfully!'
                  : 'Quotation #$_estimateId saved successfully!',
            ),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Failed to save quotation. Please verify your connection or login status.',
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _shareOrPrintPreview() {
    final validItems = _items
        .where((i) => i.product.trim().isNotEmpty)
        .toList();
    if (validItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter at least one item to preview PDF'),
        ),
      );
      return;
    }
    final model = _buildQuotationModel();
    PdfService.printOrShareQuotation(model);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : Colors.white;
    final cardBorder = isDark ? AppColors.darkCardBorder : AppColors.cardBorder;
    final itemBg = isDark ? AppColors.darkSurface : AppColors.scaffoldBg;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.textPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.textSecondary;
    final textMuted = isDark ? AppColors.darkTextMuted : AppColors.textMuted;
    final inputBg = isDark ? AppColors.darkInputBg : AppColors.inputBg;
    final inputBorder = isDark ? AppColors.darkInputBorder : AppColors.inputBorder;

    final companyState = ref.watch(companyProvider);
    final customerState = ref.watch(customerProvider);

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.scaffoldBg,
      appBar: AppBar(
        title: Text(
          _isEditMode ? 'Edit Estimate #$_estimateId' : 'Create Estimate',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 18,
            color: textPrimary,
          ),
        ),
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: textPrimary),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.printer, color: AppColors.primary),
            tooltip: 'Preview / Print PDF',
            onPressed: _shareOrPrintPreview,
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Quotation Header Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: cardBorder),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const BrandFlameLogo(size: 24),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Estimate ID',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: textMuted,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 2),
                              _isLoadingId
                                  ? const SizedBox(
                                      width: 70,
                                      height: 14,
                                      child: LinearProgressIndicator(
                                        color: AppColors.primary,
                                      ),
                                    )
                                  : Text(
                                      '#$_estimateId',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.primary,
                                      ),
                                    ),
                            ],
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Date',
                            style: TextStyle(
                              fontSize: 10,
                              color: textMuted,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            DateFormat('dd MMM yyyy').format(DateTime.now()),
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Divider(
                    height: 20,
                    color: isDark ? AppColors.darkCardBorder : AppColors.border,
                  ),

                  // Company Picker (FROM)
                  Text(
                    'Company / Seller (FROM)',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: textSecondary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: inputBg,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: inputBorder),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        dropdownColor: isDark ? AppColors.darkCard : Colors.white,
                        value:
                            (_selectedCompanyId != null &&
                                companyState.companies.any(
                                  (c) => c.id == _selectedCompanyId,
                                ))
                            ? _selectedCompanyId
                            : (companyState.companies.isNotEmpty
                                  ? companyState.companies.first.id
                                  : null),
                        isExpanded: true,
                        hint: Text(
                          'Select Company',
                          style: TextStyle(fontSize: 13, color: textMuted),
                        ),
                        items: companyState.companies.map((c) {
                          return DropdownMenuItem(
                            value: c.id,
                            child: Row(
                              children: [
                                const Icon(
                                  LucideIcons.building,
                                  size: 14,
                                  color: AppColors.primary,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    c.name,
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: textPrimary,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setState(() => _selectedCompanyId = val);
                          }
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Customer (TO) Section
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: cardBorder),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'CLIENT DETAILS (TO)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: textPrimary,
                        ),
                      ),
                      if (customerState.customers.isNotEmpty)
                        PopupMenuButton<CustomerModel>(
                          onSelected: _onCustomerSelected,
                          itemBuilder: (context) =>
                              customerState.customers.map((c) {
                                return PopupMenuItem(
                                  value: c,
                                  child: Row(
                                    children: [
                                      const Icon(
                                        LucideIcons.user,
                                        size: 14,
                                        color: AppColors.textSecondary,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          c.name,
                                          style: const TextStyle(fontSize: 13),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primaryBg,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(
                              children: [
                                Icon(
                                  LucideIcons.users,
                                  size: 13,
                                  color: AppColors.primary,
                                ),
                                SizedBox(width: 4),
                                Text(
                                  'Select Client',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppColors.primary,
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

                  CustomTextField(
                    label: 'Client Name *',
                    hint: 'Client or Company Name',
                    controller: _customerNameController,
                    prefixIcon: LucideIcons.user,
                  ),
                  const SizedBox(height: 10),

                  Row(
                    children: [
                      Expanded(
                        child: CustomTextField(
                          label: 'Phone Number',
                          hint: 'Mobile number',
                          controller: _customerPhoneController,
                          prefixIcon: LucideIcons.phone,
                          keyboardType: TextInputType.phone,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: CustomTextField(
                          label: 'Email',
                          hint: 'client@domain.com',
                          controller: _customerEmailController,
                          prefixIcon: LucideIcons.mail,
                          keyboardType: TextInputType.emailAddress,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: CustomTextField(
                          label: 'Address',
                          hint: 'City, State',
                          controller: _customerAddressController,
                          prefixIcon: LucideIcons.mapPin,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: CustomTextField(
                          label: 'GSTIN (Opt)',
                          hint: 'GSTIN',
                          controller: _customerGstController,
                          textCapitalization: TextCapitalization.characters,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Items / Products Section
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: cardBorder),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'LINE ITEMS',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: textPrimary,
                        ),
                      ),
                      TextButton.icon(
                        onPressed: _addItem,
                        icon: const Icon(LucideIcons.plus, size: 14),
                        label: const Text(
                          'Add Row',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  Divider(
                    height: 16,
                    color: isDark ? AppColors.darkCardBorder : AppColors.border,
                  ),

                  ..._items.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final item = entry.value;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: itemBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: cardBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Item Name & Warehouse Picker
                          Row(
                            children: [
                              Container(
                                width: 22,
                                height: 22,
                                decoration: const BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '${idx + 1}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextFormField(
                                  initialValue: item.product,
                                  onChanged: (val) =>
                                      setState(() => item.product = val),
                                  style: TextStyle(fontSize: 13, color: textPrimary),
                                  decoration: InputDecoration(
                                    hintText: 'Item Description / Name',
                                    hintStyle: TextStyle(
                                      fontSize: 12,
                                      color: textMuted,
                                    ),
                                    suffixIcon: IconButton(
                                      icon: const Icon(
                                        LucideIcons.packageSearch,
                                        size: 16,
                                        color: AppColors.primary,
                                      ),
                                      tooltip: 'Choose from Warehouse',
                                      onPressed: () => _pickProductForItem(idx),
                                    ),
                                    isDense: true,
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 8,
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide: BorderSide(color: inputBorder),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide: const BorderSide(color: AppColors.primary),
                                    ),
                                    filled: true,
                                    fillColor: inputBg,
                                  ),
                                ),
                              ),
                              if (_items.length > 1)
                                IconButton(
                                  icon: const Icon(
                                    LucideIcons.trash2,
                                    size: 16,
                                    color: AppColors.error,
                                  ),
                                  onPressed: () => _removeItem(idx),
                                  visualDensity: VisualDensity.compact,
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),

                          // Qty, Unit, Rate, GST
                          Row(
                            children: [
                              // Quantity
                              Expanded(
                                flex: 2,
                                child: TextFormField(
                                  initialValue: item.qty.toStringAsFixed(
                                    item.qty.truncateToDouble() == item.qty
                                        ? 0
                                        : 2,
                                  ),
                                  keyboardType:
                                      const TextInputType.numberWithOptions(
                                        decimal: true,
                                      ),
                                  style: TextStyle(fontSize: 13, color: textPrimary),
                                  onChanged: (val) {
                                    final parsed = double.tryParse(val) ?? 1.0;
                                    setState(() => item.qty = parsed);
                                  },
                                  decoration: InputDecoration(
                                    labelText: 'Qty',
                                    labelStyle: TextStyle(fontSize: 11, color: textSecondary),
                                    isDense: true,
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 8,
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide: BorderSide(color: inputBorder),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide: const BorderSide(color: AppColors.primary),
                                    ),
                                    filled: true,
                                    fillColor: inputBg,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),

                              // Unit
                              Expanded(
                                flex: 2,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: inputBg,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: inputBorder,
                                    ),
                                  ),
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<String>(
                                      dropdownColor: isDark ? AppColors.darkCard : Colors.white,
                                      value: _units.contains(item.unit)
                                          ? item.unit
                                          : _units.first,
                                      isExpanded: true,
                                      items: _units.map((u) {
                                        return DropdownMenuItem(
                                          value: u,
                                          child: Text(
                                            u,
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: textPrimary,
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                      onChanged: (val) {
                                        if (val != null) {
                                          setState(() => item.unit = val);
                                        }
                                      },
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),

                              // Price
                              Expanded(
                                flex: 3,
                                child: TextFormField(
                                  initialValue: item.price > 0
                                      ? item.price.toStringAsFixed(2)
                                      : '',
                                  keyboardType:
                                      const TextInputType.numberWithOptions(
                                        decimal: true,
                                      ),
                                  style: TextStyle(fontSize: 13, color: textPrimary),
                                  onChanged: (val) {
                                    final parsed = double.tryParse(val) ?? 0.0;
                                    setState(() => item.price = parsed);
                                  },
                                  decoration: InputDecoration(
                                    labelText: 'Rate (₹)',
                                    labelStyle: TextStyle(fontSize: 11, color: textSecondary),
                                    isDense: true,
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 8,
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide: BorderSide(color: inputBorder),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide: const BorderSide(color: AppColors.primary),
                                    ),
                                    filled: true,
                                    fillColor: inputBg,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),

                              // GST %
                              Expanded(
                                flex: 2,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: inputBg,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: inputBorder,
                                    ),
                                  ),
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<double>(
                                      dropdownColor: isDark ? AppColors.darkCard : Colors.white,
                                      value: _gstRates.contains(item.gst)
                                          ? item.gst
                                          : 18.0,
                                      isExpanded: true,
                                      items: _gstRates.map((r) {
                                        return DropdownMenuItem(
                                          value: r,
                                          child: Text(
                                            '${r.toStringAsFixed(0)}%',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: textPrimary,
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                      onChanged: (val) {
                                        if (val != null) {
                                          setState(() => item.gst = val);
                                        }
                                      },
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),

                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                item.hsn.isNotEmpty ? 'HSN: ${item.hsn}' : '',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: textMuted,
                                ),
                              ),
                              Text(
                                'Amount: ₹${item.totalWithTax.toStringAsFixed(2)}',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Notes / Terms
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: cardBorder),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Notes & Terms',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _notesController,
                    maxLines: 2,
                    style: TextStyle(fontSize: 13, color: textPrimary),
                    decoration: InputDecoration(
                      hintText:
                          'Validity: 30 days. Payment terms: 50% advance...',
                      hintStyle: TextStyle(
                        fontSize: 12,
                        color: textMuted,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: inputBorder),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: AppColors.primary),
                      ),
                      filled: true,
                      fillColor: inputBg,
                      contentPadding: const EdgeInsets.all(10),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Financial Summary Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: cardBorder),
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
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Subtotal (Taxable):',
                        style: TextStyle(
                          color: textSecondary,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        _currencyFormat.format(_subtotal),
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: textPrimary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Estimated GST Tax (18%):',
                        style: TextStyle(
                          color: textSecondary,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        _currencyFormat.format(_totalGst),
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: textPrimary,
                        ),
                      ),
                    ],
                  ),
                  Divider(
                    height: 20,
                    color: isDark ? AppColors.darkCardBorder : AppColors.border,
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Grand Total:',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: textPrimary,
                        ),
                      ),
                      Text(
                        _currencyFormat.format(_grandTotal),
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 20,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _shareOrPrintPreview,
                    icon: const Icon(
                      LucideIcons.fileText,
                      size: 18,
                      color: AppColors.primary,
                    ),
                    label: const Text(
                      'PDF Preview',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : _saveQuotation,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isSaving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            _isEditMode ? 'Update Quotation' : 'Save Quotation',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
