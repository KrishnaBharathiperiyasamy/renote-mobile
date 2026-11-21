import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:renote_mobile/core/routing/app_router.dart';
import 'package:renote_mobile/features/dashboard/screens/dashboard_screen.dart';
import 'package:renote_mobile/features/quotations/screens/quotations_screen.dart';
import 'package:renote_mobile/features/invoices/screens/invoices_screen.dart';
import 'package:renote_mobile/features/posters/screens/posters_screen.dart';
import 'package:renote_mobile/features/products/screens/products_screen.dart';
import 'package:renote_mobile/features/marketplace/screens/marketplace_screen.dart';
import 'package:renote_mobile/shared/widgets/main_shell_scaffold.dart';

void main() {
  setUp(() {
    AppRouter.router.go('/dashboard');
  });

  group('7-Option Icon-Only Persistent Bottom Navigation Tests', () {
    Future<void> pumpApp(WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: AppRouter.router,
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
    }

    testWidgets('Bottom navigation contains exactly 7 icon-only options with no text labels', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpApp(tester);

      expect(find.byType(DashboardScreen), findsOneWidget);
      expect(find.byType(BottomNavigationBar), findsOneWidget);

      final navBar = tester.widget<BottomNavigationBar>(find.byType(BottomNavigationBar));
      expect(navBar.items.length, 7);
      expect(navBar.showSelectedLabels, isFalse);
      expect(navBar.showUnselectedLabels, isFalse);

      // Verify all item labels are empty string (no labels displayed below icons)
      for (final item in navBar.items) {
        expect(item.label, isEmpty);
      }

      // Verify tooltips for accessibility
      expect(navBar.items[0].tooltip, 'Home');
      expect(navBar.items[1].tooltip, 'Quotes');
      expect(navBar.items[2].tooltip, 'Invoices');
      expect(navBar.items[3].tooltip, 'Posters');
      expect(navBar.items[4].tooltip, 'Product Warehouse');
      expect(navBar.items[5].tooltip, 'Marketplace');
      expect(navBar.items[6].tooltip, 'My Poster Links');

      // Verify active tab on Dashboard is index 0
      expect(navBar.currentIndex, 0);

      // Verify all 7 icons exist within BottomNavigationBar
      final navFinder = find.byType(BottomNavigationBar);
      expect(find.descendant(of: navFinder, matching: find.byIcon(LucideIcons.home)), findsOneWidget);
      expect(find.descendant(of: navFinder, matching: find.byIcon(LucideIcons.fileText)), findsOneWidget);
      expect(find.descendant(of: navFinder, matching: find.byIcon(LucideIcons.receipt)), findsOneWidget);
      expect(find.descendant(of: navFinder, matching: find.byIcon(LucideIcons.palette)), findsOneWidget);
      expect(find.descendant(of: navFinder, matching: find.byIcon(LucideIcons.package)), findsOneWidget);
      expect(find.descendant(of: navFinder, matching: find.byIcon(LucideIcons.store)), findsOneWidget);
      expect(find.descendant(of: navFinder, matching: find.byIcon(LucideIcons.link2)), findsOneWidget);
    });

    testWidgets('Tapping Marketplace navigates to MarketplaceScreen with active tab 5', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpApp(tester);

      final marketplaceBtn = find.descendant(
        of: find.byType(BottomNavigationBar),
        matching: find.byIcon(LucideIcons.store),
      );
      expect(marketplaceBtn, findsOneWidget);

      await tester.tap(marketplaceBtn);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.byType(MarketplaceScreen), findsOneWidget);
      expect(find.byType(BottomNavigationBar), findsOneWidget);

      final navBar = tester.widget<BottomNavigationBar>(find.byType(BottomNavigationBar));
      expect(navBar.currentIndex, 5);
    });

    testWidgets('Tapping My Poster Links navigates to PostersScreen with saved tab & active tab 6', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpApp(tester);

      final posterLinksBtn = find.descendant(
        of: find.byType(BottomNavigationBar),
        matching: find.byIcon(LucideIcons.link2),
      );
      expect(posterLinksBtn, findsOneWidget);

      await tester.tap(posterLinksBtn);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.byType(PostersScreen), findsOneWidget);
      expect(find.byType(BottomNavigationBar), findsOneWidget);

      final navBar = tester.widget<BottomNavigationBar>(find.byType(BottomNavigationBar));
      expect(navBar.currentIndex, 6);
    });

    testWidgets('Tapping Product Warehouse navigates to ProductsScreen with active tab 4', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpApp(tester);

      final warehouseBtn = find.descendant(
        of: find.byType(BottomNavigationBar),
        matching: find.byIcon(LucideIcons.package),
      );
      expect(warehouseBtn, findsOneWidget);

      await tester.tap(warehouseBtn);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.byType(ProductsScreen), findsOneWidget);
      expect(find.byType(BottomNavigationBar), findsOneWidget);

      final navBar = tester.widget<BottomNavigationBar>(find.byType(BottomNavigationBar));
      expect(navBar.currentIndex, 4);
    });

    testWidgets('Tapping Quotes, Invoices, Posters and Home sets proper active tabs', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpApp(tester);

      final navFinder = find.byType(BottomNavigationBar);

      // Quotes -> index 1
      await tester.tap(find.descendant(of: navFinder, matching: find.byIcon(LucideIcons.fileText)));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.byType(QuotationsScreen), findsOneWidget);
      expect(tester.widget<BottomNavigationBar>(find.byType(BottomNavigationBar)).currentIndex, 1);

      // Invoices -> index 2
      await tester.tap(find.descendant(of: navFinder, matching: find.byIcon(LucideIcons.receipt)));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.byType(InvoicesScreen), findsOneWidget);
      expect(tester.widget<BottomNavigationBar>(find.byType(BottomNavigationBar)).currentIndex, 2);

      // Posters -> index 3
      await tester.tap(find.descendant(of: navFinder, matching: find.byIcon(LucideIcons.palette)));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.byType(PostersScreen), findsOneWidget);
      expect(tester.widget<BottomNavigationBar>(find.byType(BottomNavigationBar)).currentIndex, 3);

      // Home -> index 0
      await tester.tap(find.descendant(of: navFinder, matching: find.byIcon(LucideIcons.home)));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.byType(DashboardScreen), findsOneWidget);
      expect(tester.widget<BottomNavigationBar>(find.byType(BottomNavigationBar)).currentIndex, 0);
    });

    testWidgets('Responsive check: 7 icons fit without overflow on 360px mobile viewport', (tester) async {
      tester.view.physicalSize = const Size(360, 740);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        MaterialApp(
          home: MainShellScaffold(
            currentUri: Uri.parse('/dashboard'),
            child: const SizedBox.expand(),
          ),
        ),
      );
      await tester.pump();

      expect(find.byType(BottomNavigationBar), findsOneWidget);
      final navBar = tester.widget<BottomNavigationBar>(find.byType(BottomNavigationBar));
      expect(navBar.items.length, 7);
      expect(tester.takeException(), isNull);
    });
  });
}
