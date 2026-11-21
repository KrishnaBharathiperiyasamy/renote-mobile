import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import 'package:renote_mobile/features/marketplace/screens/marketplace_screen.dart';
import 'package:renote_mobile/features/marketplace/screens/add_product_screen.dart';
import 'package:renote_mobile/core/constants/app_colors.dart';

void main() {
  group('Marketplace Floating Action Button (+) Tests', () {
    testWidgets('MarketplaceScreen renders FAB with flame orange and plus icon',
        (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: MarketplaceScreen(),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // FAB is present
      final fabFinder = find.byType(FloatingActionButton);
      expect(fabFinder, findsOneWidget);

      final fab = tester.widget<FloatingActionButton>(fabFinder);
      expect(fab.backgroundColor, AppColors.primary);
      expect(fab.tooltip, 'Add Product Listing');

      // White plus icon
      expect(find.descendant(of: fabFinder, matching: find.byIcon(LucideIcons.plus)),
          findsOneWidget);
    });
  });

  group('AddProductScreen UI & Validation Tests', () {
    testWidgets('AddProductScreen renders all required form sections',
        (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: AddProductScreen(),
          ),
        ),
      );
      await tester.pump();

      // Header
      expect(find.text('Add Product Listing'), findsOneWidget);

      // Section A: Photos & Videos
      expect(find.text('Product Photos & Videos'), findsOneWidget);
      expect(find.text('Add Media'), findsOneWidget);
      expect(find.text('0/5 photos'), findsOneWidget);

      // Section B: Product Details
      expect(find.text('Product Details'), findsOneWidget);
      expect(find.text('Product Title *'), findsOneWidget);
      expect(find.text('Marketplace Category *'), findsOneWidget);
      expect(find.text('Product Description *'), findsOneWidget);

      // Section C: Pricing
      expect(find.text('Product Price'), findsOneWidget);
      expect(find.text('Price (₹) *'), findsOneWidget);

      // Section D: Location
      expect(find.text('Product Location'), findsOneWidget);
      expect(
        find.text('Select City / Location * (Tap to choose or use GPS)'),
        findsOneWidget,
      );

      // Section E: Contact
      expect(find.text('Seller Contact Details'), findsOneWidget);
      expect(find.text('Contact Phone Number (10 digits) *'), findsOneWidget);

      // Section F: Publish Button
      expect(find.text('Publish Product to Marketplace'), findsOneWidget);
    });

    testWidgets('Validation triggers on empty submission', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: AddProductScreen(),
          ),
        ),
      );
      await tester.pump();

      // Tap Publish Product without filling anything
      final publishBtn = find.text('Publish Product to Marketplace');
      await tester.ensureVisible(publishBtn);
      await tester.tap(publishBtn);
      await tester.pump();

      // Validation errors should appear
      expect(find.text('Product title is required'), findsOneWidget);
      expect(find.text('Product description is required'), findsOneWidget);
      expect(find.text('Price is required'), findsOneWidget);
      expect(find.text('Contact phone is required'), findsOneWidget);
    });

    testWidgets('Invalid price and short description trigger validation errors',
        (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: AddProductScreen(),
          ),
        ),
      );
      await tester.pump();

      // Fill title with valid text
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Product Title *'),
        'Apple MacBook Pro M3',
      );

      // Fill description with less than 10 characters
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Product Description *'),
        'Short',
      );

      // Fill price with 0
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Price (₹) *'),
        '0',
      );

      // Fill phone with 5 digits
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Contact Phone Number (10 digits) *'),
        '12345',
      );

      final publishBtn = find.text('Publish Product to Marketplace');
      await tester.ensureVisible(publishBtn);
      await tester.tap(publishBtn);
      await tester.pump();

      expect(find.text('Please provide at least 10 characters'), findsOneWidget);
      expect(find.text('Enter a valid positive price'), findsOneWidget);
      expect(find.text('Phone must be exactly 10 digits'), findsOneWidget);
    });
  });
}
