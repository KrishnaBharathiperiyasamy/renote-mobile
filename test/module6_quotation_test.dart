import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:renote_mobile/models/quotation_model.dart';
import 'package:renote_mobile/providers/quotation_provider.dart';
import 'package:renote_mobile/features/quotations/screens/quotations_screen.dart';
import 'package:renote_mobile/features/quotations/screens/create_quotation_screen.dart';

void main() {
  group('Module 6: Exact Quotations and Estimations Tests', () {
    test('QuotationModel and DocumentItem serialization, deserialization, calculations', () {
      final json = {
        '_id': 'est_101',
        'estimateID': 'E2611001',
        'company_id': [
          {'_id': 'comp_001', 'name': 'KrishTech Computers'}
        ],
        'customers': [
          {
            'name': 'Acme Corporation',
            'phoneNumber': '9876543210',
            'email': 'acme@corp.com',
            'address': 'Bangalore, Karnataka',
            'gstNo': '29ABCDE1234F1Z5',
          }
        ],
        'products': [
          {
            'name': 'Dell Precision 3561 Laptop',
            'quantity': 2.0,
            'price': 65000.0,
            'unit': 'Pcs',
            'gst': 18.0,
            'hsn': '84713010',
          },
          {
            'name': 'Wireless Ergonomic Mouse',
            'quantity': 2.0,
            'price': 1500.0,
            'unit': 'Pcs',
            'gst': 18.0,
            'hsn': '84716060',
          },
        ],
        'total': 156940.0,
        'createdAt': '2026-11-17T10:00:00.000Z',
        'isHeart': true,
      };

      final quotation = QuotationModel.fromJson(json);

      expect(quotation.id, 'est_101');
      expect(quotation.estimateId, 'E2611001');
      expect(quotation.vendorCompanyName, 'KrishTech Computers');
      expect(quotation.customerName, 'Acme Corporation');
      expect(quotation.customerPhone, '9876543210');
      expect(quotation.customerEmail, 'acme@corp.com');
      expect(quotation.customerAddress, 'Bangalore, Karnataka');
      expect(quotation.customerGstNo, '29ABCDE1234F1Z5');
      expect(quotation.items.length, 2);
      expect(quotation.isFavorite, true);

      // Verify item calculations
      // Item 1: 2 * 65000 = 130000; Tax 18% = 23400; Total = 153400
      final it1 = quotation.items[0];
      expect(it1.amount, 130000.0);
      expect(it1.taxAmount, 23400.0);
      expect(it1.totalWithTax, 153400.0);

      // Item 2: 2 * 1500 = 3000; Tax 18% = 540; Total = 3540
      final it2 = quotation.items[1];
      expect(it2.amount, 3000.0);
      expect(it2.taxAmount, 540.0);
      expect(it2.totalWithTax, 3540.0);

      // Total Subtotal: 130000 + 3000 = 133000
      expect(quotation.subtotal, 133000.0);
      // Total Tax: 23400 + 540 = 23940
      expect(quotation.taxAmount, 23940.0);
      // Grand Total: 156940
      expect(quotation.totalAmount, 156940.0);

      // Test toJson
      final serialized = quotation.toJson();
      expect(serialized['estimateID'], 'E2611001');
      expect(serialized['company_id'], ['comp_001']);
      expect((serialized['customers'] as List).first['name'], 'Acme Corporation');
      expect((serialized['products'] as List).length, 2);
    });

    test('QuotationState metrics calculation and multi-criteria filtering', () {
      final sampleQuotations = [
        QuotationModel(
          id: '1',
          estimateId: 'E2611001',
          vendorCompanyId: 'comp_1',
          vendorCompanyName: 'KrishTech Computers',
          customerName: 'Alpha Tech',
          customerPhone: '9000000001',
          items: [
            DocumentItem(product: 'Office Desktop PC', price: 40000.0, qty: 1.0, gst: 18.0),
          ],
          subtotal: 40000.0,
          taxAmount: 7200.0,
          totalAmount: 47200.0,
          date: '2026-11-01T10:00:00.000Z',
          isFavorite: false,
        ),
        QuotationModel(
          id: '2',
          estimateId: 'E2611002',
          vendorCompanyId: 'comp_2',
          vendorCompanyName: 'RENAISSANCE TECH',
          customerName: 'Beta Logistics',
          customerPhone: '9000000002',
          items: [
            DocumentItem(product: 'Barcode Scanner Handheld', price: 5000.0, qty: 2.0, gst: 18.0),
          ],
          subtotal: 10000.0,
          taxAmount: 1800.0,
          totalAmount: 11800.0,
          date: '2026-11-10T10:00:00.000Z',
          isFavorite: true,
        ),
        QuotationModel(
          id: '3',
          estimateId: 'E2611003',
          vendorCompanyId: 'comp_1',
          vendorCompanyName: 'KrishTech Computers',
          customerName: 'Gamma Healthcare',
          customerPhone: '9000000003',
          items: [
            DocumentItem(product: 'Medical Tablet Display', price: 30000.0, qty: 1.0, gst: 18.0),
          ],
          subtotal: 30000.0,
          taxAmount: 5400.0,
          totalAmount: 35400.0,
          date: '2026-11-15T10:00:00.000Z',
          isFavorite: true,
        ),
      ];

      final state = QuotationState(quotations: sampleQuotations);

      // 1. KPI Metrics
      // Total: 47200 + 11800 + 35400 = 94400
      expect(state.totalValue, 94400.0);
      // Average: 94400 / 3 = 31466.666...
      expect(state.averageValue, closeTo(31466.66, 0.01));

      // 2. Search Filter (by customer name)
      final searchCust = state.copyWith(searchQuery: 'Alpha');
      expect(searchCust.filteredQuotations.length, 1);
      expect(searchCust.filteredQuotations.first.estimateId, 'E2611001');

      // 3. Search Filter (by item name)
      final searchItem = state.copyWith(searchQuery: 'Scanner');
      expect(searchItem.filteredQuotations.length, 1);
      expect(searchItem.filteredQuotations.first.estimateId, 'E2611002');

      // 4. Company Filter
      final companyFiltered = state.copyWith(selectedCompanyId: 'comp_1');
      expect(companyFiltered.filteredQuotations.length, 2);

      // 5. Price Range Filter
      final priceFiltered = state.copyWith(minPrice: 20000.0, maxPrice: 40000.0);
      expect(priceFiltered.filteredQuotations.length, 1);
      expect(priceFiltered.filteredQuotations.first.estimateId, 'E2611003');

      // 6. Favorites Filter
      final favFiltered = state.copyWith(favoritesOnly: true);
      expect(favFiltered.filteredQuotations.length, 2);

      // 7. Date Range Filter
      final dateFiltered = state.copyWith(
        startDate: DateTime.parse('2026-11-05T00:00:00.000Z'),
        endDate: DateTime.parse('2026-11-12T00:00:00.000Z'),
      );
      expect(dateFiltered.filteredQuotations.length, 1);
      expect(dateFiltered.filteredQuotations.first.estimateId, 'E2611002');
    });

    testWidgets('QuotationsScreen renders dashboard title, KPI cards, and quotation list', (tester) async {
      final sampleQuotation = QuotationModel(
        id: 'est_001',
        estimateId: 'E2611001',
        vendorCompanyId: 'comp_1',
        vendorCompanyName: 'KrishTech Computers',
        customerName: 'Acme Industries',
        customerPhone: '9876543210',
        items: [
          DocumentItem(product: 'High End Workstation', price: 75000.0, qty: 1.0, gst: 18.0),
        ],
        subtotal: 75000.0,
        taxAmount: 13500.0,
        totalAmount: 88500.0,
        date: '2026-11-17T10:00:00.000Z',
        isFavorite: true,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            quotationProvider.overrideWith(
              () => _TestQuotationNotifier(
                QuotationState(quotations: [sampleQuotation]),
              ),
            ),
          ],
          child: const MaterialApp(
            home: QuotationsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Check header and title
      expect(find.text('Estimation Dashboard'), findsOneWidget);
      expect(find.text('1 Active'), findsOneWidget);
      expect(find.text('Total Estimate Value'), findsOneWidget);
      expect(find.text('Average Value'), findsOneWidget);

      // Check card content
      expect(find.text('#E2611001'), findsOneWidget);
      expect(find.text('Acme Industries'), findsOneWidget);
      expect(find.text('9876543210'), findsOneWidget);
      expect(find.text('KrishTech Computers'), findsOneWidget);
      expect(find.text('New Quotation'), findsOneWidget);
    });

    testWidgets('CreateQuotationScreen renders edit mode with pre-filled line items', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final existingQuotation = QuotationModel(
        id: 'est_555',
        estimateId: 'E2611055',
        vendorCompanyId: 'comp_1',
        vendorCompanyName: 'KrishTech Computers',
        customerName: 'Stark Enterprises',
        customerPhone: '9123456780',
        customerEmail: 'tony@stark.com',
        customerAddress: 'Malibu Point, CA',
        items: [
          DocumentItem(product: 'Arc Reactor Power Supply', price: 250000.0, qty: 1.0, gst: 18.0, unit: 'Pcs'),
        ],
        subtotal: 250000.0,
        taxAmount: 45000.0,
        totalAmount: 295000.0,
        notes: 'Priority delivery requested',
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: CreateQuotationScreen(initialQuotation: existingQuotation),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Check pre-filled values
      expect(find.text('Edit Estimate #E2611055'), findsOneWidget);
      expect(find.text('Stark Enterprises'), findsOneWidget);
      expect(find.text('9123456780'), findsOneWidget);
      expect(find.text('tony@stark.com'), findsOneWidget);
      expect(find.text('Arc Reactor Power Supply'), findsOneWidget);
      expect(find.text('Update Quotation'), findsOneWidget);
    });
  });
}

class _TestQuotationNotifier extends QuotationNotifier {
  final QuotationState _initialState;
  _TestQuotationNotifier(this._initialState);

  @override
  QuotationState build() => _initialState;

  @override
  Future<void> loadQuotations() async {}
}
