import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:renote_mobile/models/invoice_model.dart';
import 'package:renote_mobile/models/quotation_model.dart';
import 'package:renote_mobile/providers/invoice_provider.dart';
import 'package:renote_mobile/features/invoices/screens/invoices_screen.dart';
import 'package:renote_mobile/features/invoices/screens/create_invoice_screen.dart';

void main() {
  group('Module 7: Native Flutter GST Invoice Management Tests', () {
    test('InvoiceModel serialization, deserialization, and Intra-state GST calculations', () {
      final json = {
        '_id': 'inv_101',
        'invoiceID': 'I/26-27/0001',
        'company_id': [
          {
            '_id': 'comp_001',
            'name': 'KrishTech Solutions Pvt Ltd',
            'gstNo': '29AAAAA0000A1Z5',
            'state': 'Karnataka',
            'address': 'MG Road, Bangalore',
          }
        ],
        'customers': [
          {
            'name': 'Karnataka Enterprises',
            'phoneNumber': '9876543210',
            'email': 'contact@ke.com',
            'address': 'Indiranagar, Bangalore, Karnataka',
            'gstNo': '29BBBBB1111B1Z2',
          }
        ],
        'products': [
          {
            'name': 'Server Blade Pro 16C',
            'quantity': 2.0,
            'price': 50000.0,
            'unit': 'Pcs',
            'gst': 18.0,
            'hsn': '84715000',
          },
          {
            'name': 'Gigabit Network Switch',
            'quantity': 1.0,
            'price': 10000.0,
            'unit': 'Pcs',
            'gst': 18.0,
            'hsn': '85176290',
          },
        ],
        'total': 129800.0,
        'status': 'Paid',
        'dueDate': '2026-12-15T00:00:00.000Z',
        'notes': 'Terms: payment received with thanks',
        'createdAt': '2026-11-17T10:00:00.000Z',
        'isHeart': true,
      };

      final invoice = InvoiceModel.fromJson(json);

      expect(invoice.id, 'inv_101');
      expect(invoice.invoiceId, 'I/26-27/0001');
      expect(invoice.vendorCompanyName, 'KrishTech Solutions Pvt Ltd');
      expect(invoice.vendorGstNo, '29AAAAA0000A1Z5');
      expect(invoice.customerName, 'Karnataka Enterprises');
      expect(invoice.customerGstNo, '29BBBBB1111B1Z2');
      expect(invoice.status, 'Paid');
      expect(invoice.isFavorite, true);
      expect(invoice.items.length, 2);

      // Intra-state verification (both 29)
      expect(invoice.isInterState, false);

      // Subtotal = 2 * 50000 + 1 * 10000 = 110,000
      expect(invoice.subtotal, 110000.0);

      // Total GST at 18% of 110,000 = 19,800
      // Intra-state: CGST = 9,900, SGST = 9,900, IGST = 0
      expect(invoice.taxAmount, 19800.0);
      expect(invoice.cgstAmount, 9900.0);
      expect(invoice.sgstAmount, 9900.0);
      expect(invoice.igstAmount, 0.0);

      // Grand total = 110,000 + 19,800 = 129,800
      expect(invoice.totalAmount, 129800.0);
      expect(invoice.roundOff, 0.0);

      // Amount in words
      expect(invoice.amountInWords, contains('One Lakh Twenty Nine Thousand Eight Hundred Rupees Only'));

      // Test serialization toJson
      final serialized = invoice.toJson();
      expect(serialized['invoiceID'], 'I/26-27/0001');
      expect(serialized['company_id'], ['comp_001']);
      expect(serialized['status'], 'Paid');
      expect((serialized['products'] as List).length, 2);
    });

    test('InvoiceModel Inter-state GST calculation and Indian currency NumberToWords', () {
      final interStateInvoice = InvoiceModel(
        id: 'inv_102',
        invoiceId: 'I/26-27/0002',
        vendorCompanyId: 'comp_001',
        vendorCompanyName: 'KrishTech Solutions Pvt Ltd',
        vendorGstNo: '29AAAAA0000A1Z5', // Karnataka (29)
        customerName: 'Maharashtra Traders Ltd',
        customerPhone: '9123456780',
        customerGstNo: '27CCCCCC2222C1Z8', // Maharashtra (27)
        items: [
          DocumentItem(
            product: 'Enterprise Router X1',
            price: 45250.25,
            qty: 2.0,
            gst: 18.0,
            hsn: '85176200',
            unit: 'Pcs',
          ),
        ],
        subtotal: 90500.50,
        taxAmount: 16290.09,
        totalAmount: 106791.0,
        status: 'Pending',
      );

      // Inter-state check
      expect(interStateInvoice.isInterState, true);
      // For inter-state: IGST takes the full tax, CGST and SGST are 0
      expect(interStateInvoice.cgstAmount, 0.0);
      expect(interStateInvoice.sgstAmount, 0.0);
      expect(interStateInvoice.igstAmount, 16290.09);

      // Round off verification: unrounded = 90500.50 + 16290.09 = 106790.59
      // Rounded = 106791.0 => roundOff = 0.41
      expect(interStateInvoice.roundOff, closeTo(0.41, 0.01));

      // Number to words Indian format test
      final words1 = numberToWordsIndian(106791);
      expect(words1, 'One Lakh Six Thousand Seven Hundred Ninety One Rupees Only');

      final words2 = numberToWordsIndian(2543015.50);
      expect(words2, 'Twenty Five Lakh Forty Three Thousand Fifteen Rupees and Fifty Paise Only');

      final words3 = numberToWordsIndian(10000000);
      expect(words3, 'One Crore Rupees Only');
    });

    test('InvoiceState KPI metrics and multi-criteria filters', () {
      final sampleInvoices = [
        InvoiceModel(
          id: '1',
          invoiceId: 'I/26-27/0001',
          vendorCompanyId: 'comp_1',
          customerName: 'Alpha Corp',
          customerPhone: '9000000001',
          subtotal: 50000.0,
          totalAmount: 59000.0,
          status: 'Paid',
          date: '2026-11-10T10:00:00.000Z',
          isFavorite: true,
        ),
        InvoiceModel(
          id: '2',
          invoiceId: 'I/26-27/0002',
          vendorCompanyId: 'comp_1',
          customerName: 'Beta Services',
          customerPhone: '9000000002',
          subtotal: 100000.0,
          totalAmount: 118000.0,
          status: 'Pending',
          date: '2026-11-12T10:00:00.000Z',
          isFavorite: false,
        ),
        InvoiceModel(
          id: '3',
          invoiceId: 'I/26-27/0003',
          vendorCompanyId: 'comp_2',
          customerName: 'Gamma Logistics',
          customerPhone: '9000000003',
          subtotal: 20000.0,
          totalAmount: 23600.0,
          status: 'Paid',
          date: '2026-11-15T10:00:00.000Z',
          isFavorite: true,
        ),
      ];

      // Initial State
      var state = InvoiceState(invoices: sampleInvoices);
      expect(state.invoices.length, 3);
      expect(state.totalValue, 200600.0);
      expect(state.paidCount, 2);
      expect(state.pendingCount, 1);
      expect(state.averageValue, closeTo(66866.66, 0.01));

      // 1. Status Filter: Paid
      state = state.copyWith(statusFilter: 'Paid');
      expect(state.filteredInvoices.length, 2);
      expect(state.filteredInvoices.every((inv) => inv.status == 'Paid'), true);

      // 2. Status Filter: Pending
      state = state.copyWith(statusFilter: 'Pending');
      expect(state.filteredInvoices.length, 1);
      expect(state.filteredInvoices.first.customerName, 'Beta Services');

      // Reset status
      state = state.copyWith(statusFilter: 'All');

      // 3. Search query filter
      state = state.copyWith(searchQuery: 'gamma');
      expect(state.filteredInvoices.length, 1);
      expect(state.filteredInvoices.first.invoiceId, 'I/26-27/0003');

      // Reset search query
      state = state.copyWith(searchQuery: '');

      // 4. Company ID filter
      state = state.copyWith(selectedCompanyId: 'comp_1');
      expect(state.filteredInvoices.length, 2);

      // 5. Favorites filter
      state = state.copyWith(favoritesOnly: true);
      expect(state.filteredInvoices.length, 1);
      expect(state.filteredInvoices.first.customerName, 'Alpha Corp');

      // 6. Price range filter
      state = state.copyWith(favoritesOnly: false, minPrice: 50000.0, maxPrice: 60000.0);
      expect(state.filteredInvoices.length, 1);
      expect(state.filteredInvoices.first.totalAmount, 59000.0);
    });

    testWidgets('InvoicesScreen renders KPI cards, status chips, and invoice card', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final sampleInvoice = InvoiceModel(
        id: 'inv_999',
        invoiceId: 'I/26-27/0001',
        vendorCompanyId: 'comp_1',
        vendorCompanyName: 'KrishTech Computers',
        customerName: 'Acme Mega Corp',
        customerPhone: '9876543210',
        items: [
          DocumentItem(product: 'Enterprise Cloud Server', price: 80000.0, qty: 1.0, gst: 18.0),
        ],
        subtotal: 80000.0,
        taxAmount: 14400.0,
        totalAmount: 94400.0,
        status: 'Paid',
        date: '2026-11-17T10:00:00.000Z',
        isFavorite: true,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            invoiceProvider.overrideWith(
              () => _TestInvoiceNotifier(
                InvoiceState(invoices: [sampleInvoice]),
              ),
            ),
          ],
          child: const MaterialApp(
            home: InvoicesScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Check header and KPI titles
      expect(find.text('Tax Invoices'), findsAtLeastNWidgets(1));
      expect(find.text('1 Active'), findsOneWidget);
      expect(find.text('Total Invoiced'), findsOneWidget);
      expect(find.text('Paid Invoices'), findsOneWidget);
      expect(find.text('Pending Invoices'), findsOneWidget);

      // Check Status Chips
      expect(find.text('All'), findsOneWidget);
      expect(find.text('Paid'), findsOneWidget);
      expect(find.text('Pending'), findsOneWidget);

      // Check invoice card content
      expect(find.text('I/26-27/0001'), findsOneWidget);
      expect(find.text('Acme Mega Corp'), findsOneWidget);
      expect(find.text('9876543210'), findsOneWidget);
      expect(find.text('KrishTech Computers'), findsOneWidget);
      expect(find.text('PAID'), findsOneWidget);
      expect(find.text('New Invoice'), findsOneWidget);
    });

    testWidgets('CreateInvoiceScreen renders edit mode with pre-filled line items and totals', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final existingInvoice = InvoiceModel(
        id: 'inv_555',
        invoiceId: 'I/26-27/0055',
        vendorCompanyId: 'comp_1',
        vendorCompanyName: 'KrishTech Computers',
        customerName: 'Wayne Industries',
        customerPhone: '9123456789',
        customerEmail: 'bruce@wayne.com',
        customerAddress: 'Gotham City Tower',
        items: [
          DocumentItem(
            product: 'Bat-Computer Server Rack',
            price: 500000.0,
            qty: 1.0,
            gst: 18.0,
            unit: 'Pcs',
            hsn: '847150',
          ),
        ],
        subtotal: 500000.0,
        taxAmount: 90000.0,
        totalAmount: 590000.0,
        status: 'Pending',
        notes: 'Deliver to sub-level 3',
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: CreateInvoiceScreen(initialInvoice: existingInvoice),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Check pre-filled values
      expect(find.text('Edit Tax Invoice #I/26-27/0055'), findsOneWidget);
      expect(find.text('Wayne Industries'), findsOneWidget);
      expect(find.text('9123456789'), findsOneWidget);
      expect(find.text('bruce@wayne.com'), findsOneWidget);
      expect(find.text('Bat-Computer Server Rack'), findsOneWidget);
      expect(find.text('Update Tax Invoice'), findsOneWidget);
    });
  });
}

class _TestInvoiceNotifier extends InvoiceNotifier {
  final InvoiceState _initialState;
  _TestInvoiceNotifier(this._initialState);

  @override
  InvoiceState build() => _initialState;

  @override
  Future<void> loadInvoices() async {}
}
