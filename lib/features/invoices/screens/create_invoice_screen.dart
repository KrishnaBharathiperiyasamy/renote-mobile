import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/constants/app_colors.dart';
import '../../../models/customer_model.dart';
import '../../../models/invoice_model.dart';
import '../../../models/quotation_model.dart';
import '../../../providers/company_provider.dart';
import '../../../providers/customer_provider.dart';
import '../../../providers/invoice_provider.dart';
import '../../../providers/product_provider.dart';
import '../../../services/api_service.dart';
import '../../../services/pdf_service.dart';
import '../../../services/storage_service.dart';
import '../../../shared/widgets/brand_flame_logo.dart';
import '../../../shared/widgets/custom_text_field.dart';

class CreateInvoiceScreen extends ConsumerStatefulWidget {
  final InvoiceModel? initialInvoice;
  const CreateInvoiceScreen({super.key, this.initialInvoice});

  @override
  ConsumerState<CreateInvoiceScreen> createState() =>
      _CreateInvoiceScreenState();
}

class _CreateInvoiceScreenState extends ConsumerState<CreateInvoiceScreen> {
  final _formKey = GlobalKey<FormState>();
  late String _invoiceId;
  bool _isLoadingId = true;
  bool _isSaving = false;
  String _selectedStatus = 'Pending';
  DateTime? _dueDate;
  bool _isGstEnabled = true;

  String? _selectedCompanyId;
  final TextEditingController _customerNameController = TextEditingController();
  final TextEditingController _customerPhoneController =
      TextEditingController();
  final TextEditingController _customerEmailController =
      TextEditingController();
  final TextEditingController _customerAddressController =
      TextEditingController();
  final TextEditingController _customerCityController = TextEditingController();
  final TextEditingController _customerStateController =
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

  bool get _isEditMode => widget.initialInvoice != null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(companyProvider.notifier).loadCompanies();
      ref.read(customerProvider.notifier).loadCustomers();
      ref.read(productProvider.notifier).loadProducts();
    });

    if (_isEditMode) {
      final inv = widget.initialInvoice!;
      _invoiceId = inv.invoiceId;
      _isLoadingId = false;
      _selectedCompanyId = inv.vendorCompanyId;
      _selectedStatus = inv.status;
      if (inv.dueDate != null) {
        _dueDate = DateTime.tryParse(inv.dueDate!);
      }
      _customerNameController.text = inv.customerName ?? '';
      _customerPhoneController.text = inv.customerPhone ?? '';
      _customerEmailController.text = inv.customerEmail ?? '';
      _customerAddressController.text = inv.customerAddress ?? '';
      _customerCityController.text = inv.customerCity ?? '';
      _customerStateController.text = inv.customerState ?? '';
      _customerGstController.text = inv.customerGstNo ?? '';
      _notesController.text = inv.notes ?? '';

      if (inv.items.isNotEmpty) {
        for (final item in inv.items) {
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
        _isGstEnabled = inv.items.any((it) => it.gst > 0);
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
      _invoiceId = 'I/26-27/0001';
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
    _customerCityController.dispose();
    _customerStateController.dispose();
    _customerGstController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _fetchNextId() async {
    final userId = StorageService().getUserId();
    if (userId != null) {
      final nextId = await ApiService().fetchNextInvoiceId(userId);
      if (mounted) {
        setState(() {
          _invoiceId = nextId;
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
        _customerCityController.text = customer.city ?? '';
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
          gst: _isGstEnabled ? 18.0 : 0.0,
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
            'No warehouse products found. You can enter description manually.',
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
                        '${p.qty.toStringAsFixed(0)} ${p.unit} in stock',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: p.qty > 0
                              ? AppColors.success
                              : AppColors.error,
                        ),
                      ),
                      onTap: () {
                        setState(() {
                          _items[index].product = p.name;
                          _items[index].price = p.price;
                          _items[index].unit = _units.contains(p.unit)
                              ? p.unit
                              : 'Pcs';
                          _items[index].gst = _isGstEnabled ? p.gst : 0.0;
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

  double get _rawGstTotal => _isGstEnabled
      ? _items.fold(0.0, (acc, item) => acc + item.taxAmount)
      : 0.0;

  bool get _isInterState {
    final companyState = ref.read(companyProvider);
    String? compGst;
    String? compState;
    if (companyState.companies.isNotEmpty) {
      final found = companyState.companies.where(
        (c) => c.id == _selectedCompanyId,
      );
      final c = found.isNotEmpty ? found.first : companyState.companies.first;
      compGst = c.gstNo;
      compState = c.state;
    }
    final fromCode = extractGstStateCode(compGst, compState, null);
    final toCode = extractGstStateCode(
      _customerGstController.text.trim(),
      _customerStateController.text.trim(),
      _customerAddressController.text.trim(),
    );
    return fromCode.isNotEmpty && toCode.isNotEmpty && fromCode != toCode;
  }

  double get _cgstAmount =>
      (_isGstEnabled && !_isInterState) ? (_rawGstTotal / 2) : 0.0;
  double get _sgstAmount =>
      (_isGstEnabled && !_isInterState) ? (_rawGstTotal / 2) : 0.0;
  double get _igstAmount =>
      (_isGstEnabled && _isInterState) ? _rawGstTotal : 0.0;
  double get _totalGst =>
      _isInterState ? _igstAmount : (_cgstAmount + _sgstAmount);

  double get _unroundedTotal => _subtotal + _totalGst;
  double get _grandTotal => _unroundedTotal.roundToDouble();
  double get _roundOff => _grandTotal - _unroundedTotal;

  InvoiceModel _buildInvoiceModel() {
    final companyState = ref.read(companyProvider);
    String targetCompId = _selectedCompanyId ?? '';
    String targetCompName = 'KrishTech Computers';
    String? targetCompGst;
    String? targetCompState;

    if (companyState.companies.isNotEmpty) {
      final found = companyState.companies.where(
        (c) => c.id == _selectedCompanyId,
      );
      if (found.isNotEmpty) {
        targetCompId = found.first.id;
        targetCompName = found.first.name;
        targetCompGst = found.first.gstNo;
        targetCompState = found.first.state;
      } else {
        targetCompId = companyState.companies.first.id;
        targetCompName = companyState.companies.first.name;
        targetCompGst = companyState.companies.first.gstNo;
        targetCompState = companyState.companies.first.state;
      }
    }

    return InvoiceModel(
      id: widget.initialInvoice?.id ?? '',
      invoiceId: _invoiceId,
      vendorCompanyId: targetCompId,
      vendorCompanyName: targetCompName,
      vendorGstNo: targetCompGst,
      vendorState: targetCompState,
      customerName: _customerNameController.text.trim().isNotEmpty
          ? _customerNameController.text.trim()
          : 'Valued Customer',
      customerPhone: _customerPhoneController.text.trim(),
      customerEmail: _customerEmailController.text.trim(),
      customerAddress: _customerAddressController.text.trim(),
      customerCity: _customerCityController.text.trim(),
      customerState: _customerStateController.text.trim(),
      customerGstNo: _customerGstController.text.trim(),
      items: _items.where((i) => i.product.trim().isNotEmpty).toList(),
      subtotal: _subtotal,
      taxAmount: _totalGst,
      totalAmount: _grandTotal,
      status: _selectedStatus,
      dueDate: _dueDate?.toIso8601String(),
      notes: _notesController.text.trim(),
      date: widget.initialInvoice?.date ?? DateTime.now().toIso8601String(),
      isFavorite: widget.initialInvoice?.isFavorite ?? false,
    );
  }

  Future<void> _saveInvoice() async {
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
    final model = _buildInvoiceModel();

    bool success;
    if (_isEditMode) {
      success = await ref.read(invoiceProvider.notifier).updateInvoice(model);
    } else {
      success = await ref.read(invoiceProvider.notifier).createInvoice(model);
    }

    if (mounted) {
      setState(() => _isSaving = false);
      if (success) {
        // Refresh product stock since backend deducts quantity for invoices
        ref.read(productProvider.notifier).loadProducts();

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isEditMode
                  ? 'Invoice $_invoiceId updated successfully!'
                  : 'Invoice $_invoiceId created successfully!',
            ),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Failed to save invoice. Please verify your connection or login status.',
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
          content: Text(
            'Please enter at least one item to preview invoice PDF',
          ),
        ),
      );
      return;
    }
    final model = _buildInvoiceModel();
    PdfService.printOrShareInvoice(model);
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
          _isEditMode ? 'Edit Tax Invoice #$_invoiceId' : 'Create Tax Invoice',
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
            // Invoice Header Card
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
                                'Invoice Number',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: textMuted,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 2),
                              _isLoadingId
                                  ? const SizedBox(
                                      width: 80,
                                      height: 14,
                                      child: LinearProgressIndicator(
                                        color: AppColors.primary,
                                      ),
                                    )
                                  : Text(
                                      _invoiceId,
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
                            'Invoice Date',
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
                  const SizedBox(height: 12),

                  // Payment Status & Due Date Row
                  Row(
                    children: [
                      // Status Dropdown
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Payment Status',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
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
                                  value: _selectedStatus,
                                  isExpanded: true,
                                  items: ['Pending', 'Paid', 'Overdue'].map((
                                    s,
                                  ) {
                                    return DropdownMenuItem(
                                      value: s,
                                      child: Row(
                                        children: [
                                          Icon(
                                            s == 'Paid'
                                                ? LucideIcons.checkCircle
                                                : LucideIcons.clock,
                                            size: 13,
                                            color: s == 'Paid'
                                                ? AppColors.success
                                                : AppColors.warning,
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            s,
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: textPrimary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() => _selectedStatus = val);
                                    }
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),

                      // Due Date Picker
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Payment Due Date',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            InkWell(
                              onTap: () async {
                                final picked = await showDatePicker(
                                  context: context,
                                  initialDate:
                                      _dueDate ??
                                      DateTime.now().add(
                                        const Duration(days: 15),
                                      ),
                                  firstDate: DateTime(2020),
                                  lastDate: DateTime(2035),
                                );
                                if (picked != null) {
                                  setState(() => _dueDate = picked);
                                }
                              },
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                height: 42,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: inputBg,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: inputBorder,
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      _dueDate != null
                                          ? DateFormat('dd/MM/yyyy')
                                                .format(_dueDate!)
                                          : 'Select Due Date',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: _dueDate != null
                                            ? textPrimary
                                            : textMuted,
                                      ),
                                    ),
                                    Icon(
                                      LucideIcons.calendar,
                                      size: 14,
                                      color: textSecondary,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
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
                        'BILL TO (CUSTOMER)',
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
                                  'Select Customer',
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
                    label: 'Client / Buyer Name *',
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
                          hint: 'Address',
                          controller: _customerAddressController,
                          prefixIcon: LucideIcons.mapPin,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: CustomTextField(
                          label: 'State',
                          hint: 'e.g. Karnataka',
                          controller: _customerStateController,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  Row(
                    children: [
                      Expanded(
                        child: CustomTextField(
                          label: 'City',
                          hint: 'City',
                          controller: _customerCityController,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: CustomTextField(
                          label: 'GSTIN (Buyer)',
                          hint: 'Buyer GSTIN',
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

            // Line Items & GST Section
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
                          Text(
                            'INVOICE LINE ITEMS',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: textPrimary,
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Inter-state / Intra-state badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: _isInterState
                                  ? (isDark ? const Color(0x303B82F6) : const Color(0xFFEFF6FF))
                                  : (isDark ? const Color(0x3010B981) : const Color(0xFFECFDF5)),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: _isInterState
                                    ? const Color(0xFF3B82F6)
                                    : const Color(0xFF10B981),
                                width: 0.5,
                              ),
                            ),
                            child: Text(
                              _isInterState
                                  ? 'INTER-STATE (IGST)'
                                  : 'INTRA-STATE (CGST+SGST)',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: _isInterState
                                    ? const Color(0xFF3B82F6)
                                    : const Color(0xFF10B981),
                              ),
                            ),
                          ),
                        ],
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
                                    hintText: 'Product or Service description',
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

                          // Qty, Unit, Rate, GST %, HSN
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
                                item.hsn.isNotEmpty
                                    ? 'HSN/SAC: ${item.hsn}'
                                    : '',
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
                    'Invoice Notes & Payment Terms',
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
                      hintText: 'Payment due in 15 days. Bank Transfer or UPI accepted.',
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
                        'Subtotal (Taxable Value):',
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

                  if (_isInterState) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'IGST Tax:',
                          style: TextStyle(
                            color: textSecondary,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          _currencyFormat.format(_igstAmount),
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'CGST Tax (9%):',
                          style: TextStyle(
                            color: textSecondary,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          _currencyFormat.format(_cgstAmount),
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'SGST Tax (9%):',
                          style: TextStyle(
                            color: textSecondary,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          _currencyFormat.format(_sgstAmount),
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ],

                  if (_roundOff.abs() > 0.001) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Round Off:',
                          style: TextStyle(
                            color: textSecondary,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          '${_roundOff > 0 ? "+" : ""}${_roundOff.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 12,
                            color: textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                  Divider(
                    height: 20,
                    color: isDark ? AppColors.darkCardBorder : AppColors.border,
                  ),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total Payable:',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: textPrimary,
                        ),
                      ),
                      Text(
                        _currencyFormat.format(_grandTotal),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Amount in words: ${numberToWordsIndian(_grandTotal)}',
                      style: TextStyle(
                        fontSize: 11,
                        fontStyle: FontStyle.italic,
                        color: textSecondary,
                      ),
                    ),
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
                    onPressed: _isSaving ? null : _saveInvoice,
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
                            _isEditMode
                                ? 'Update Tax Invoice'
                                : 'Save Tax Invoice',
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
