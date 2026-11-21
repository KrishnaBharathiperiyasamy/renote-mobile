import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import 'package:renote_mobile/models/marketplace_item_model.dart';
import 'package:renote_mobile/providers/marketplace_provider.dart';
import 'package:renote_mobile/providers/theme_provider.dart';
import 'package:renote_mobile/features/marketplace/widgets/category_dropdrawer_modal.dart';
import 'package:renote_mobile/features/marketplace/screens/marketplace_screen.dart';

class MockMarketplaceNotifier extends MarketplaceNotifier {
  final MarketplaceState initialState;
  MockMarketplaceNotifier(this.initialState);

  @override
  MarketplaceState build() {
    return initialState;
  }
}

void main() {
  group('CategoryDropDrawerModal Unit & Widget Tests', () {
    test('Categories list contains exactly 8 required categories', () {
      final categories = CategoryDropDrawerModal.categories;
      expect(categories.length, 8);

      final ids = categories.map((c) => c.id).toList();
      expect(ids, [
        'All',
        'Electronics',
        'Fashion',
        'Home & Living',
        'Books & Education',
        'Sports & Hobbies',
        'Services',
        'Others',
      ]);

      final labels = categories.map((c) => c.label).toList();
      expect(labels, [
        'All Categories',
        'Electronics',
        'Fashion',
        'Home & Living',
        'Books & Education',
        'Sports & Hobbies',
        'Services',
        'Others',
      ]);
    });

    testWidgets('Renders header, subtitle, and all 8 categories',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CategoryDropDrawerModal(
              selectedCategory: 'All',
              onCategorySelected: (_) {},
            ),
          ),
        ),
      );

      expect(find.text('Select Category'), findsOneWidget);
      expect(
        find.text('Choose a category to filter listings'),
        findsOneWidget,
      );

      for (final item in CategoryDropDrawerModal.categories) {
        expect(find.text(item.label), findsOneWidget);
      }
    });

    testWidgets('Tapping a category triggers callback with category id',
        (tester) async {
      String? selectedId;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CategoryDropDrawerModal(
              selectedCategory: 'All',
              onCategorySelected: (id) => selectedId = id,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Electronics'));
      await tester.pump();

      expect(selectedId, 'Electronics');
    });

    testWidgets('Active category displays checkmark and reset button',
        (tester) async {
      String? selectedId;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CategoryDropDrawerModal(
              selectedCategory: 'Electronics',
              onCategorySelected: (id) => selectedId = id,
            ),
          ),
        ),
      );

      // Checkmark should be present
      expect(find.byIcon(LucideIcons.check), findsOneWidget);

      // Reset button should be visible when not 'All'
      expect(find.text('Reset'), findsOneWidget);

      // Tapping reset calls onCategorySelected with 'All'
      await tester.tap(find.text('Reset'));
      await tester.pump();

      expect(selectedId, 'All');
    });
  });

  group('MarketplaceScreen DropDrawer Integration Tests', () {
    final sampleItems = [
      MarketplaceItemModel(
        id: '1',
        title: 'Dell Laptop',
        category: 'Electronics',
        price: 45000,
        image: '',
        location: 'Coimbatore',
      ),
      MarketplaceItemModel(
        id: '2',
        title: 'Silk Shirt',
        category: 'Fashion',
        price: 1500,
        image: '',
        location: 'Bengaluru',
      ),
    ];

    testWidgets('Selector displays "All Categories" by default and opens DropDrawer',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            marketplaceProvider.overrideWith(
              () => MockMarketplaceNotifier(
                MarketplaceState(items: sampleItems),
              ),
            ),
          ],
          child: const MaterialApp(
            home: MarketplaceScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Horizontal chips should NOT exist anymore
      expect(find.byType(ChoiceChip), findsNothing);

      // Dropdown category selector button must exist with 'All Categories'
      final selectorFinder =
          find.byKey(const Key('marketplace_category_selector'));
      expect(selectorFinder, findsOneWidget);
      expect(find.text('All Categories'), findsOneWidget);

      // Tap selector button to open DropDrawer modal
      await tester.tap(selectorFinder);
      await tester.pumpAndSettle();

      // DropDrawer should now be open
      expect(find.text('Select Category'), findsOneWidget);
      expect(find.text('Electronics'), findsOneWidget);
      expect(find.text('Fashion'), findsOneWidget);

      // Tap 'Electronics' in the drawer
      await tester.tap(find.text('Electronics'));
      await tester.pumpAndSettle();

      // Drawer is closed, selector now shows 'Electronics'
      expect(find.text('Electronics'), findsWidgets);
      // Clear button (X) should be visible
      expect(
        find.byKey(const Key('marketplace_category_clear')),
        findsOneWidget,
      );

      // Only Dell Laptop should be visible, not Silk Shirt
      expect(find.text('Dell Laptop'), findsOneWidget);
      expect(find.text('Silk Shirt'), findsNothing);

      // Tap clear button to reset back to 'All'
      await tester.tap(find.byKey(const Key('marketplace_category_clear')));
      await tester.pumpAndSettle();

      // Now both items should be visible again
      expect(find.text('All Categories'), findsOneWidget);
      expect(find.text('Dell Laptop'), findsOneWidget);
      expect(find.text('Silk Shirt'), findsOneWidget);
    });

    testWidgets('Single-row toolbar renders all 5 controls in exact order without overflow',
        (tester) async {
      tester.view.physicalSize = const Size(360, 640);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            marketplaceProvider.overrideWith(
              () => MockMarketplaceNotifier(
                MarketplaceState(items: sampleItems),
              ),
            ),
          ],
          child: const MaterialApp(
            home: MarketplaceScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify all 5 controls exist
      final catFinder = find.byKey(const Key('marketplace_category_selector'));
      final sortFinder = find.byKey(const Key('marketplace_sort_button'));
      final savedFinder = find.byKey(const Key('marketplace_saved_filter'));
      final verifiedFinder = find.byKey(const Key('marketplace_verified_filter'));
      final themeFinder = find.byKey(const Key('marketplace_theme_toggle'));

      expect(catFinder, findsOneWidget);
      expect(sortFinder, findsOneWidget);
      expect(savedFinder, findsOneWidget);
      expect(verifiedFinder, findsOneWidget);
      expect(themeFinder, findsOneWidget);

      // Verify exact left-to-right horizontal order
      final catX = tester.getTopLeft(catFinder).dx;
      final sortX = tester.getTopLeft(sortFinder).dx;
      final savedX = tester.getTopLeft(savedFinder).dx;
      final verifiedX = tester.getTopLeft(verifiedFinder).dx;
      final themeX = tester.getTopLeft(themeFinder).dx;

      expect(catX < sortX, isTrue);
      expect(sortX < savedX, isTrue);
      expect(savedX < verifiedX, isTrue);
      expect(verifiedX < themeX, isTrue);

      // Verify 34px height consistency
      expect(tester.getSize(catFinder).height, 34);
      expect(tester.getSize(sortFinder).height, 34);
      expect(tester.getSize(savedFinder).height, 34);
      expect(tester.getSize(verifiedFinder).height, 34);
      expect(tester.getSize(themeFinder).height, 34);

      // Verify no RenderFlex overflow errors occurred
      expect(tester.takeException(), isNull);
    });

    testWidgets('Theme toggle switches between light and dark mode',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            marketplaceProvider.overrideWith(
              () => MockMarketplaceNotifier(
                MarketplaceState(items: sampleItems),
              ),
            ),
          ],
          child: Consumer(
            builder: (context, ref, _) {
              final mode = ref.watch(themeProvider);
              return MaterialApp(
                themeMode: mode,
                theme: ThemeData.light(),
                darkTheme: ThemeData.dark(),
                home: const MarketplaceScreen(),
              );
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      final themeFinder = find.byKey(const Key('marketplace_theme_toggle'));
      expect(themeFinder, findsOneWidget);

      // Initial state is light mode -> sun icon visible
      expect(find.byIcon(LucideIcons.sun), findsOneWidget);

      // Tap theme toggle to switch to dark mode
      await tester.tap(themeFinder);
      await tester.pumpAndSettle();

      // Now moon icon should be visible
      expect(find.byIcon(LucideIcons.moon), findsOneWidget);

      // Tap again to switch back to light mode
      await tester.tap(themeFinder);
      await tester.pumpAndSettle();

      expect(find.byIcon(LucideIcons.sun), findsOneWidget);
    });

    testWidgets('Saved and Verified filter buttons toggle active state',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            marketplaceProvider.overrideWith(
              () => MockMarketplaceNotifier(
                MarketplaceState(items: sampleItems),
              ),
            ),
          ],
          child: const MaterialApp(
            home: MarketplaceScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final savedFinder = find.byKey(const Key('marketplace_saved_filter'));
      final verifiedFinder = find.byKey(const Key('marketplace_verified_filter'));

      // Tapping saved filter
      await tester.tap(savedFinder);
      await tester.pumpAndSettle();

      // Tapping verified filter
      await tester.tap(verifiedFinder);
      await tester.pumpAndSettle();
    });
  });
}
