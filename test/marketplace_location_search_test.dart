import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import 'package:renote_mobile/models/marketplace_item_model.dart';
import 'package:renote_mobile/providers/marketplace_provider.dart';
import 'package:renote_mobile/services/location_service.dart';
import 'package:renote_mobile/features/marketplace/widgets/location_picker_modal.dart';
import 'package:renote_mobile/features/marketplace/screens/marketplace_screen.dart';

void main() {
  group('Marketplace Location Search & Filtering Tests', () {
    final sampleItems = [
      MarketplaceItemModel(
        id: '1',
        title: 'Dell Precision Workstation',
        category: 'Electronics',
        subcategory: 'Computers',
        price: 45000.0,
        image: '',
        location: 'Coimbatore',
        companyCity: 'R S PURAM',
        companyAddress: '55, Venkataswamy Road West, R S Puram, Coimbatore',
        viewsCount: 200,
        createdAt: '2026-11-17T01:00:00Z',
      ),
      MarketplaceItemModel(
        id: '2',
        title: 'Office Ergonomic Chair',
        category: 'Home & Living',
        subcategory: 'Furniture',
        price: 7500.0,
        image: '',
        location: 'Bengaluru',
        companyCity: 'Bengaluru',
        companyAddress: 'Koramangala, Bengaluru',
        viewsCount: 150,
        createdAt: '2026-11-17T02:00:00Z',
      ),
      MarketplaceItemModel(
        id: '3',
        title: 'Sony Alpha Camera',
        category: 'Electronics',
        subcategory: 'Cameras',
        price: 82000.0,
        image: '',
        location: 'Chennai',
        companyCity: 'Chennai',
        viewsCount: 300,
        createdAt: '2026-11-17T03:00:00Z',
      ),
    ];

    test('1. Product search without location returns all matching items', () {
      final state = MarketplaceState(
        items: sampleItems,
        searchQuery: 'chair',
        selectedCity: 'All',
      );

      final results = state.filteredItems;
      expect(results.length, 1);
      expect(results.first.title, 'Office Ergonomic Chair');
    });

    test('2. Product search with selected location filters by city', () {
      final state = MarketplaceState(
        items: sampleItems,
        selectedCity: 'Coimbatore',
      );

      final results = state.filteredItems;
      expect(results.length, 1);
      expect(results.first.title, 'Dell Precision Workstation');
      expect(results.first.location, 'Coimbatore');
    });

    test('3. Location filter matches company city and address aliases', () {
      // Searching for "RS Puram" should match item 1
      final stateRsPuram = MarketplaceState(
        items: sampleItems,
        selectedCity: 'RS Puram',
      );
      expect(stateRsPuram.filteredItems.length, 1);
      expect(stateRsPuram.filteredItems.first.id, '1');

      // Searching for "Bengaluru" should match item 2
      final stateBlr = MarketplaceState(
        items: sampleItems,
        selectedCity: 'Bengaluru',
      );
      expect(stateBlr.filteredItems.length, 1);
      expect(stateBlr.filteredItems.first.id, '2');
    });

    test('4. Combining location filter with category filter', () {
      // Electronics in Chennai
      final state1 = MarketplaceState(
        items: sampleItems,
        selectedCategory: 'Electronics',
        selectedCity: 'Chennai',
      );
      expect(state1.filteredItems.length, 1);
      expect(state1.filteredItems.first.title, 'Sony Alpha Camera');

      // Home & Living in Chennai -> should be empty
      final state2 = MarketplaceState(
        items: sampleItems,
        selectedCategory: 'Home & Living',
        selectedCity: 'Chennai',
      );
      expect(state2.filteredItems.isEmpty, isTrue);
    });

    test('5. Combining location with search query', () {
      // Search 'Dell' in Coimbatore
      final state1 = MarketplaceState(
        items: sampleItems,
        searchQuery: 'Dell',
        selectedCity: 'Coimbatore',
      );
      expect(state1.filteredItems.length, 1);

      // Search 'Dell' in Bengaluru -> empty
      final state2 = MarketplaceState(
        items: sampleItems,
        searchQuery: 'Dell',
        selectedCity: 'Bengaluru',
      );
      expect(state2.filteredItems.isEmpty, isTrue);
    });

    test('6. Empty results when location has no products', () {
      final state = MarketplaceState(
        items: sampleItems,
        selectedCity: 'Mumbai',
      );
      expect(state.filteredItems.isEmpty, isTrue);
    });

    test('7. Reset filters clears location back to All', () {
      final state = MarketplaceState(
        items: sampleItems,
        selectedCategory: 'Electronics',
        selectedCity: 'Coimbatore',
        searchQuery: 'Dell',
      );

      final reset = state.copyWith(
        selectedCategory: 'All',
        selectedCity: 'All',
        searchQuery: '',
      );

      expect(reset.selectedCity, 'All');
      expect(reset.selectedCategory, 'All');
      expect(reset.searchQuery, '');
      expect(reset.filteredItems.length, 3);
    });

    test('8. LocationService popular cities contains major hubs', () {
      expect(LocationService.popularCities.isNotEmpty, isTrue);
      final names = LocationService.popularCities.map((c) => c['name']).toList();
      expect(names.contains('Coimbatore'), isTrue);
      expect(names.contains('RS Puram'), isTrue);
      expect(names.contains('Bengaluru'), isTrue);
      expect(names.contains('Chennai'), isTrue);
      expect(names.contains('Mumbai'), isTrue);
    });
  });

  group('LocationPickerModal Widget Tests', () {
    testWidgets('Renders header, search field, GPS tile, and All Locations',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: LocationPickerModal(
              currentCity: 'All',
              onLocationSelected: (_) {},
            ),
          ),
        ),
      );

      expect(find.text('Select Location'), findsOneWidget);
      expect(find.byType(TextField), findsOneWidget);
      expect(find.text('Use Current Location'), findsOneWidget);
      expect(find.text('All Locations (No location filter)'), findsOneWidget);
      expect(find.text('Popular Cities'), findsOneWidget);
    });

    testWidgets('Typing in search field filters suggestions and shows custom option',
        (tester) async {
      String? selected;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: LocationPickerModal(
              currentCity: 'All',
              onLocationSelected: (city) => selected = city,
            ),
          ),
        ),
      );

      // Enter search text
      await tester.enterText(find.byType(TextField), 'Coimbatore');
      await tester.pump();

      expect(find.text('Suggested Locations'), findsOneWidget);
      expect(find.widgetWithText(ListTile, 'Coimbatore'), findsOneWidget);

      // Tap on Coimbatore suggestion tile
      await tester.tap(find.widgetWithText(ListTile, 'Coimbatore'));
      await tester.pump();

      expect(selected, 'Coimbatore');
    });

    testWidgets('Custom unlisted location shows "Use <query>" option',
        (tester) async {
      String? selected;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: LocationPickerModal(
              currentCity: 'All',
              onLocationSelected: (city) => selected = city,
            ),
          ),
        ),
      );

      await tester.enterText(find.byType(TextField), 'Ooty');
      await tester.pump();

      expect(find.text('Use "Ooty"'), findsOneWidget);

      await tester.tap(find.text('Use "Ooty"'));
      await tester.pump();

      expect(selected, 'Ooty');
    });

    testWidgets('Selecting All Locations resets city filter',
        (tester) async {
      String? selected;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: LocationPickerModal(
              currentCity: 'Coimbatore',
              onLocationSelected: (city) => selected = city,
            ),
          ),
        ),
      );

      await tester.tap(find.text('All Locations (No location filter)'));
      await tester.pump();

      expect(selected, 'All');
    });
  });

  group('MarketplaceScreen Location Search UI Tests', () {
    testWidgets(
        'Marketplace screen renders search input, location button and filter button',
        (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: MarketplaceScreen(),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Search field
      expect(find.byType(TextField), findsAtLeastNWidgets(1));

      // Location button showing 'Location' by default
      expect(find.text('Location'), findsOneWidget);
      expect(find.byIcon(LucideIcons.mapPin), findsAtLeastNWidgets(1));

      // Filter button
      expect(find.byIcon(LucideIcons.slidersHorizontal), findsOneWidget);
    });
  });
}
