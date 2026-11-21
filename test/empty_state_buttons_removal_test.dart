import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:renote_mobile/core/routing/app_router.dart';
import 'package:renote_mobile/features/invoices/screens/invoices_screen.dart';
import 'package:renote_mobile/features/quotations/screens/quotations_screen.dart';

void main() {
  group('Empty State Buttons Removal Verification Tests', () {
    testWidgets('Tax Invoices page does NOT have centered "Create New Tax Invoice" but retains floating "+ New Invoice"', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      AppRouter.router.go('/invoices');

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: AppRouter.router,
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(InvoicesScreen), findsOneWidget);
      expect(find.text('No Tax Invoices Found'), findsOneWidget);
      expect(
        find.text(
          'Create commercial tax invoices for your clients with automatic GST calculation and PDF sharing.',
        ),
        findsOneWidget,
      );

      // Centered button must be removed
      expect(find.text('Create New Tax Invoice'), findsNothing);

      // Floating action button "+ New Invoice" must remain present
      expect(find.text('New Invoice'), findsOneWidget);
      expect(find.byType(FloatingActionButton), findsOneWidget);
    });

    testWidgets('Estimations page does NOT have centered "Create New Estimate" but retains floating "+ New Quotation"', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      AppRouter.router.go('/quotations');

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: AppRouter.router,
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(QuotationsScreen), findsOneWidget);
      expect(find.text('No Quotations Found'), findsOneWidget);
      expect(
        find.text(
          'Create commercial estimates for your clients with automatic GST calculation and PDF sharing.',
        ),
        findsOneWidget,
      );

      // Centered button must be removed
      expect(find.text('Create New Estimate'), findsNothing);

      // Floating action button "+ New Quotation" must remain present
      expect(find.text('New Quotation'), findsOneWidget);
      expect(find.byType(FloatingActionButton), findsOneWidget);
    });
  });
}
