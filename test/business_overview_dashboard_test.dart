import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:renote_mobile/features/dashboard/screens/dashboard_screen.dart';
import 'package:renote_mobile/models/company_model.dart';
import 'package:renote_mobile/models/customer_model.dart';
import 'package:renote_mobile/models/invoice_model.dart';
import 'package:renote_mobile/models/quotation_model.dart';
import 'package:renote_mobile/providers/company_provider.dart';
import 'package:renote_mobile/providers/customer_provider.dart';
import 'package:renote_mobile/providers/invoice_provider.dart';
import 'package:renote_mobile/providers/quotation_provider.dart';

class _TestCompanyNotifier extends CompanyNotifier {
  final CompanyModel company;
  _TestCompanyNotifier(this.company);
  @override
  CompanyState build() => CompanyState(companies: [company], selectedCompany: company);
  @override
  Future<void> loadCompanies() async {}
}

class _TestInvoiceNotifier extends InvoiceNotifier {
  final List<InvoiceModel> list;
  _TestInvoiceNotifier(this.list);
  @override
  InvoiceState build() => InvoiceState(invoices: list);
  @override
  Future<void> loadInvoices() async {}
}

class _TestQuotationNotifier extends QuotationNotifier {
  final List<QuotationModel> list;
  _TestQuotationNotifier(this.list);
  @override
  QuotationState build() => QuotationState(quotations: list);
  @override
  Future<void> loadQuotations() async {}
}

class _TestCustomerNotifier extends CustomerNotifier {
  final List<CustomerModel> list;
  _TestCustomerNotifier(this.list);
  @override
  CustomerState build() => CustomerState(customers: list);
  @override
  Future<void> loadCustomers() async {}
}

void main() {
  group('Business Overview Dashboard Tests', () {
    testWidgets('Dashboard renders all 8 Business Overview sections with real company data', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final testCompany = CompanyModel(
        id: 'comp_1',
        name: 'Apex Global Enterprises',
        phone: '9876543210',
        gstNo: '33AAAAA0000A1Z5',
      );

      final testInvoices = [
        InvoiceModel(
          id: 'inv_1',
          invoiceId: 'INV-101',
          vendorCompanyId: 'comp_1',
          totalAmount: 50000.0,
          status: 'Paid',
          date: '2026-05-10T10:00:00Z',
        ),
        InvoiceModel(
          id: 'inv_2',
          invoiceId: 'INV-102',
          vendorCompanyId: 'comp_1',
          totalAmount: 25000.0,
          status: 'Pending',
          dueDate: '2026-12-31T10:00:00Z',
          date: '2026-05-12T10:00:00Z',
        ),
      ];

      final testQuotations = [
        QuotationModel(
          id: 'q_1',
          estimateId: 'EST-201',
          vendorCompanyId: 'comp_1',
          totalAmount: 30000.0,
          date: '2026-05-11T10:00:00Z',
        ),
      ];

      final testCustomers = [
        CustomerModel(
          id: 'cust_1',
          name: 'Priya Sharma',
          phone: '9840012345',
          city: 'Chennai',
          createdAt: '2026-05-01T10:00:00Z',
        ),
      ];

      final router = GoRouter(
        initialLocation: '/dashboard',
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/invoices',
            builder: (context, state) => const Scaffold(body: Text('Invoices Page')),
          ),
          GoRoute(
            path: '/quotations',
            builder: (context, state) => const Scaffold(body: Text('Quotations Page')),
          ),
          GoRoute(
            path: '/marketplace',
            builder: (context, state) => const Scaffold(body: Text('Marketplace Page')),
          ),
          GoRoute(
            path: '/posters',
            builder: (context, state) => const Scaffold(body: Text('Posters Page')),
          ),
          GoRoute(
            path: '/subscription',
            builder: (context, state) => const Scaffold(body: Text('Subscription Page')),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            companyProvider.overrideWith(() => _TestCompanyNotifier(testCompany)),
            invoiceProvider.overrideWith(() => _TestInvoiceNotifier(testInvoices)),
            quotationProvider.overrideWith(() => _TestQuotationNotifier(testQuotations)),
            customerProvider.overrideWith(() => _TestCustomerNotifier(testCustomers)),
          ],
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // 1. Welcome & Business Profile Card is removed from Dashboard
      expect(find.textContaining('Welcome back'), findsNothing);
      expect(find.text('Apex Global Enterprises'), findsNothing);
      expect(find.text('GST Verified'), findsNothing);
      expect(find.text('FY 2025-26'), findsWidgets); // Still in AppHeader

      // 2. SECTION 2: Revenue Overview
      expect(find.text('Total Collected Revenue'), findsOneWidget);
      expect(find.text('₹50,000'), findsWidgets); // Collected revenue & Paid row
      expect(find.text('₹75,000'), findsOneWidget); // Total Invoiced (50k + 25k)
      expect(find.text('₹25,000'), findsWidgets); // Outstanding (25k)
      expect(find.text('66.7% Collected'), findsOneWidget); // 50k / 75k = 66.7%

      // 3. SECTION 3: Business Statistics Grid
      expect(find.text('Business Performance'), findsOneWidget);
      expect(find.text('Quotations'), findsWidgets);
      expect(find.text('Tax Invoices'), findsWidgets);
      expect(find.text('Customers'), findsOneWidget);
      expect(find.text('Market Listings'), findsOneWidget);

      // 4. SECTION 4: Revenue Analytics Chart
      expect(find.text('Revenue Analytics'), findsOneWidget);
      expect(find.text('Jan'), findsOneWidget);
      expect(find.text('May'), findsOneWidget);
      expect(find.text('Dec'), findsOneWidget);

      // 5. SECTION 5: Invoices Breakdown
      expect(find.text('Invoices Breakdown'), findsOneWidget);
      expect(find.text('Paid Invoices'), findsOneWidget);
      expect(find.text('Pending Invoices'), findsOneWidget);
      expect(find.text('Overdue Invoices'), findsOneWidget);

      // 6. SECTION 6: Quotations Overview
      expect(find.text('Quotations Overview'), findsOneWidget);
      expect(find.text('Total Estimates'), findsOneWidget);
      expect(find.text('Average Quote Value'), findsOneWidget);

      // 7. SECTION 7: Recent Business Activities
      expect(find.text('Recent Business Activity'), findsOneWidget);
      expect(find.textContaining('INV-101'), findsOneWidget);
      expect(find.textContaining('EST-201'), findsOneWidget);

      // 8. SECTION 8: Application Overview
      expect(find.text('ReNote Suite'), findsOneWidget);
      expect(find.text('B2B Marketplace'), findsOneWidget);
      expect(find.text('Poster Studio'), findsOneWidget);
      expect(find.text('Subscription & Billing'), findsOneWidget);

      // 9. Removed Marketplace clutter verification
      expect(find.text('Search products, electronics, furniture...'), findsNothing);
      expect(find.text('All Cities'), findsNothing);
      expect(find.text('Browse by Category'), findsNothing);
      expect(find.text('View All'), findsNothing);
      expect(find.text('MARKETPLACE LISTINGS FOUND'), findsNothing);
    });

    testWidgets('Tapping Revenue Overview / Invoices navigates to Invoices page', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final router = GoRouter(
        initialLocation: '/dashboard',
        routes: [
          GoRoute(path: '/dashboard', builder: (context, state) => const DashboardScreen()),
          GoRoute(path: '/invoices', builder: (context, state) => const Scaffold(body: Text('Target Invoices Screen'))),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(routerConfig: router),
        ),
      );
      await tester.pumpAndSettle();

      final invoicesStat = find.widgetWithText(InkWell, 'Tax Invoices');
      expect(invoicesStat, findsWidgets);

      await tester.tap(invoicesStat.first);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Target Invoices Screen'), findsOneWidget);
    });
  });
}
