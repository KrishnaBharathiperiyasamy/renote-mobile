import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:renote_mobile/core/routing/app_router.dart';
import 'package:renote_mobile/features/dashboard/screens/dashboard_screen.dart';
import 'package:renote_mobile/features/quotations/screens/quotations_screen.dart';
import 'package:renote_mobile/features/marketplace/screens/marketplace_screen.dart';
import 'package:renote_mobile/features/invoices/screens/invoices_screen.dart';
import 'package:renote_mobile/features/posters/screens/posters_screen.dart';
import 'package:renote_mobile/features/products/screens/products_screen.dart';
import 'package:renote_mobile/features/customers/screens/customers_screen.dart';
import 'package:renote_mobile/features/profile/screens/settings_screen.dart';
import 'package:renote_mobile/features/subscriptions/screens/subscription_management_screen.dart';

void main() {
  setUp(() {
    AppRouter.router.go('/dashboard');
  });

  group('Sidebar Navigation & Estimations Bug Fix Tests', () {
    Future<void> pumpRouter(WidgetTester tester) async {
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
      await tester.pump(const Duration(milliseconds: 200));

      final scaffoldFinder = find.byType(Scaffold);
      final scaffoldState = tester.state<ScaffoldState>(scaffoldFinder.first);
      scaffoldState.openDrawer();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
    }

    testWidgets('Estimations item navigates to QuotationsScreen, NOT Marketplace/Dashboard', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpRouter(tester);

      final estimationsItem = find.widgetWithText(InkWell, 'Estimations');
      expect(estimationsItem, findsOneWidget);

      await tester.tap(estimationsItem);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // Verify that QuotationsScreen is displayed
      expect(find.byType(QuotationsScreen), findsOneWidget);
      // Verify that it is NOT MarketplaceScreen
      expect(find.byType(MarketplaceScreen), findsNothing);
    });

    testWidgets('Marketplace item navigates to MarketplaceScreen', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpRouter(tester);

      final item = find.widgetWithText(InkWell, 'Marketplace');
      expect(item, findsOneWidget);

      await tester.tap(item);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.byType(MarketplaceScreen), findsOneWidget);
    });

    testWidgets('Posters item navigates to PostersScreen', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpRouter(tester);

      final item = find.widgetWithText(InkWell, 'Posters');
      expect(item, findsOneWidget);

      await tester.tap(item);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.byType(PostersScreen), findsOneWidget);
    });

    testWidgets('Invoices item navigates to InvoicesScreen', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpRouter(tester);

      final item = find.widgetWithText(InkWell, 'Invoices');
      expect(item, findsOneWidget);

      await tester.tap(item);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.byType(InvoicesScreen), findsOneWidget);
    });

    testWidgets('Product Warehouse item navigates to ProductsScreen', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpRouter(tester);

      final item = find.widgetWithText(InkWell, 'Product Warehouse');
      expect(item, findsOneWidget);

      await tester.tap(item);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.byType(ProductsScreen), findsOneWidget);
    });

    testWidgets('My Poster Links navigates to PostersScreen with saved tab', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpRouter(tester);

      final item = find.widgetWithText(InkWell, 'My Poster Links');
      expect(item, findsOneWidget);

      await tester.tap(item);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.byType(PostersScreen), findsOneWidget);
    });

    testWidgets('My Customers item navigates to CustomersScreen', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpRouter(tester);

      final item = find.widgetWithText(InkWell, 'My Customers');
      expect(item, findsOneWidget);

      await tester.tap(item);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.byType(CustomersScreen), findsOneWidget);
    });

    testWidgets('Account Settings item navigates to SettingsScreen', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpRouter(tester);

      final item = find.widgetWithText(InkWell, 'Account Settings');
      expect(item, findsOneWidget);

      await tester.tap(item);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.byType(SettingsScreen), findsOneWidget);
    });

    testWidgets('Subscription Plans item navigates to SubscriptionManagementScreen', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpRouter(tester);

      final item = find.widgetWithText(InkWell, 'Subscription Plans');
      expect(item, findsOneWidget);

      await tester.tap(item);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.byType(SubscriptionManagementScreen), findsOneWidget);
    });

    testWidgets('My Companies opens business profile switcher', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpRouter(tester);

      final item = find.widgetWithText(InkWell, 'My Companies');
      expect(item, findsOneWidget);

      await tester.tap(item);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.text('Select Business Profile'), findsOneWidget);
    });

    testWidgets('Notifications opens Notifications modal sheet', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpRouter(tester);

      final item = find.widgetWithText(InkWell, 'Notifications');
      expect(item, findsOneWidget);

      await tester.tap(item);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.text('Notifications'), findsWidgets);
      expect(find.text('New Estimate Created'), findsOneWidget);
    });

    testWidgets('Dashboard quick-action section is removed from DashboardScreen', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

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
      await tester.pump(const Duration(milliseconds: 200));

      // Make sure DashboardScreen is loaded
      expect(find.byType(DashboardScreen), findsOneWidget);

      // Verify that quick-action pills (+ New Estimate, + New Invoice, + Design Poster, + Add Product, + Add Customer) are absent
      expect(find.text('+ New Estimate'), findsNothing);
      expect(find.text('+ New Invoice'), findsNothing);
      expect(find.text('+ Design Poster'), findsNothing);
      expect(find.text('+ Add Product'), findsNothing);
      expect(find.text('+ Add Customer'), findsNothing);
    });

    testWidgets('Dashboard search bar, All Cities selector, and Browse by Category grid are removed', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

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
      await tester.pump(const Duration(milliseconds: 200));

      expect(find.byType(DashboardScreen), findsOneWidget);

      // 1. Search bar & Location selector are removed from Dashboard
      expect(find.descendant(of: find.byType(DashboardScreen), matching: find.byType(TextField)), findsNothing);
      expect(find.text('Search products, electronics, furniture...'), findsNothing);
      expect(find.text('All Cities'), findsNothing);

      // 2. Browse by Category heading and View All are removed
      expect(find.text('Browse by Category'), findsNothing);
      expect(find.text('View All'), findsNothing);
      expect(find.text('All Items'), findsNothing);

      // 3. Business Overview elements:
      // Welcome banner removed
      expect(find.textContaining('Welcome back'), findsNothing);
      expect(find.text('Total Collected Revenue'), findsOneWidget);
      expect(find.text('Total Invoiced'), findsOneWidget);
      expect(find.text('MARKETPLACE LISTINGS FOUND'), findsNothing);

      // Bottom Navigation items (7 icons, no text labels below icons)
      expect(find.byType(BottomNavigationBar), findsOneWidget);
      final navBar = tester.widget<BottomNavigationBar>(find.byType(BottomNavigationBar));
      expect(navBar.items.length, 7);
      expect(navBar.showSelectedLabels, isFalse);
      expect(navBar.showUnselectedLabels, isFalse);
      expect(find.descendant(of: find.byType(BottomNavigationBar), matching: find.byIcon(LucideIcons.home)), findsOneWidget);
      expect(find.descendant(of: find.byType(BottomNavigationBar), matching: find.byIcon(LucideIcons.receipt)), findsOneWidget);
      expect(find.descendant(of: find.byType(BottomNavigationBar), matching: find.byIcon(LucideIcons.palette)), findsOneWidget);
      expect(find.descendant(of: find.byType(BottomNavigationBar), matching: find.byIcon(LucideIcons.package)), findsOneWidget);
      expect(find.descendant(of: find.byType(BottomNavigationBar), matching: find.byIcon(LucideIcons.link2)), findsOneWidget);
    });

    testWidgets('Dashboard item exists in sidebar and enables repeated Dashboard <-> Marketplace navigation', (tester) async {
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await pumpRouter(tester);

      // 1. Verify 'Dashboard' is in the drawer
      final dashboardItem = find.descendant(
        of: find.byType(Drawer),
        matching: find.widgetWithText(InkWell, 'Dashboard'),
      );
      expect(dashboardItem, findsOneWidget);

      // 2. Tap 'Marketplace' in drawer
      final marketplaceItem = find.descendant(
        of: find.byType(Drawer),
        matching: find.widgetWithText(InkWell, 'Marketplace'),
      );
      expect(marketplaceItem, findsOneWidget);
      await tester.tap(marketplaceItem);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // Verify we are on MarketplaceScreen
      expect(find.byType(MarketplaceScreen), findsOneWidget);
      expect(find.byType(DashboardScreen), findsNothing);

      // 3. Open drawer from MarketplaceScreen
      final scaffoldStateMarketplace = tester.state<ScaffoldState>(find.byType(Scaffold).first);
      scaffoldStateMarketplace.openDrawer();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // 4. Tap 'Dashboard' in drawer to return to Dashboard
      final dashboardItemFromMarketplace = find.descendant(
        of: find.byType(Drawer),
        matching: find.widgetWithText(InkWell, 'Dashboard'),
      );
      expect(dashboardItemFromMarketplace, findsOneWidget);
      await tester.tap(dashboardItemFromMarketplace);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // Verify we are back on DashboardScreen
      expect(find.byType(DashboardScreen), findsOneWidget);
      expect(find.byType(MarketplaceScreen), findsNothing);

      // 5. Open drawer again and navigate to Marketplace again (repeatability)
      final scaffoldStateDashboard = tester.state<ScaffoldState>(find.byType(Scaffold).first);
      scaffoldStateDashboard.openDrawer();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      final marketplaceItemAgain = find.descendant(
        of: find.byType(Drawer),
        matching: find.widgetWithText(InkWell, 'Marketplace'),
      );
      await tester.tap(marketplaceItemAgain);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.byType(MarketplaceScreen), findsOneWidget);

      // 6. Return to Dashboard one more time
      final scaffoldStateMarketplace2 = tester.state<ScaffoldState>(find.byType(Scaffold).first);
      scaffoldStateMarketplace2.openDrawer();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      final dashboardItemAgain = find.descendant(
        of: find.byType(Drawer),
        matching: find.widgetWithText(InkWell, 'Dashboard'),
      );
      await tester.tap(dashboardItemAgain);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.byType(DashboardScreen), findsOneWidget);
    });
  });
}
