import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:renote_mobile/shared/widgets/app_header.dart';
import 'package:renote_mobile/shared/widgets/app_drawer.dart';
import 'package:renote_mobile/shared/widgets/brand_flame_logo.dart';

void main() {
  group('Module 3: Exact Dashboard & Navigation Tests', () {
    testWidgets('AppHeader renders module switcher, FY selector, and PRO badge', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              appBar: AppHeader(),
            ),
          ),
        ),
      );

      // Verify Module Switcher
      expect(find.text('Estimations'), findsOneWidget);

      // Verify FY selector
      expect(find.text('FY 2025-26'), findsOneWidget);

      // Verify PRO badge
      expect(find.text('PRO'), findsOneWidget);
    });

    testWidgets('AppDrawer renders ReNote branding and 4 sections matching Next.js sidebar', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              drawer: AppDrawer(),
              body: Center(child: Text('Content')),
            ),
          ),
        ),
      );

      // Open the drawer
      final scaffoldState = tester.state<ScaffoldState>(find.byType(Scaffold));
      scaffoldState.openDrawer();
      await tester.pumpAndSettle();

      // Verify ReNote branding logo
      expect(find.byType(BrandFlameLogo), findsWidgets);

      // Verify the 4 collapsible sections matching Next.js Sidebar
      expect(find.text('CREATE & MANAGE'), findsOneWidget);
      expect(find.text('ACCOUNT'), findsOneWidget);
      expect(find.text('SUPPORT'), findsOneWidget);
      expect(find.text('DANGER ZONE'), findsOneWidget);

      // Verify core navigation destinations
      expect(find.text('Estimations'), findsOneWidget);
      expect(find.text('Posters'), findsOneWidget);
      expect(find.text('Marketplace'), findsOneWidget);
      expect(find.text('Invoices'), findsOneWidget);
      expect(find.text('Product Warehouse'), findsOneWidget);
    });
  });
}
