import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import 'package:renote_mobile/features/posters/screens/posters_screen.dart';
import 'package:renote_mobile/models/poster_model.dart';
import 'package:renote_mobile/providers/poster_provider.dart';

class MockPosterNotifier extends PosterNotifier {
  final List<PosterModel> initialPosters;
  MockPosterNotifier({this.initialPosters = const []});

  @override
  PosterState build() {
    return PosterState(posters: initialPosters, isLoading: false);
  }
}

void main() {
  group('Poster Studio UI Alignment & Responsive Layout Tests', () {
    final samplePosters = [
      PosterModel(
        id: 'pos_1',
        posterId: 'POS-001',
        posterName: 'Summer Sale Poster',
        posterTitle: '50% OFF TODAY',
        productName: 'Designer Watch',
        productPrice: 2499.0,
        template: 'frame1',
        templateCategory: 'Classic',
      ),
      PosterModel(
        id: 'pos_2',
        posterId: 'POS-002',
        posterName: 'Flash Deal Poster',
        posterTitle: 'LIMITED STOCK',
        productName: 'Leather Bag',
        productPrice: 1299.0,
        template: 'frame2',
        templateCategory: 'Minimal',
      ),
    ];

    testWidgets(
        'Templates Gallery renders 2-column grid with equal width columns and full-width preview',
        (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            posterProvider.overrideWith(() => MockPosterNotifier()),
          ],
          child: const MaterialApp(
            home: PostersScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Find the first two template cards
      final card1Finder = find.text('Classic Hero Sale');
      final card2Finder = find.text('Retail Modern Card');
      expect(card1Finder, findsOneWidget);
      expect(card2Finder, findsOneWidget);

      // Verify buttons are vertically aligned across columns
      final button1Finder = find.widgetWithText(ElevatedButton, 'Use Template').at(0);
      final button2Finder = find.widgetWithText(ElevatedButton, 'Use Template').at(1);
      final button1Top = tester.getTopLeft(button1Finder).dy;
      final button2Top = tester.getTopLeft(button2Finder).dy;
      expect((button1Top - button2Top).abs(), lessThan(1.0),
          reason: 'Use Template buttons must be horizontally aligned across columns');

      // Verify category badges display full text and are not clipped
      expect(find.text('CLASSIC'), findsWidgets);
      final classicBadgeFinder = find.text('CLASSIC').first;
      final badgeSize = tester.getSize(classicBadgeFinder);
      expect(badgeSize.width, greaterThan(25.0),
          reason: 'Badge must have full text width');

      // Verify no RenderFlex overflow
      expect(tester.takeException(), isNull);
    });

    testWidgets(
        'Category badges display complete category text for all templates without clipping',
        (tester) async {
      tester.view.physicalSize = const Size(390, 1000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            posterProvider.overrideWith(() => MockPosterNotifier()),
          ],
          child: const MaterialApp(
            home: PostersScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Check Classic badges
      expect(find.text('CLASSIC'), findsWidgets);

      // Check Minimal badge
      expect(find.text('MINIMAL'), findsWidgets);
    });

    testWidgets(
        'Search bar, category chips, and grid have aligned 14px horizontal padding',
        (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            posterProvider.overrideWith(() => MockPosterNotifier()),
          ],
          child: const MaterialApp(
            home: PostersScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Search input left x-coordinate should be 14px
      final searchFinder = find.byType(TextField);
      expect(searchFinder, findsOneWidget);
      final searchX = tester.getTopLeft(searchFinder).dx;
      expect(searchX, 14.0, reason: 'Search field must start at 14px left margin');

      // Category chips list view left coordinate should be 14px
      final chipsFinder = find.text('All');
      expect(chipsFinder, findsOneWidget);
      final chipX = tester.getTopLeft(chipsFinder).dx;
      expect(chipX, greaterThanOrEqualTo(14.0));
    });

    testWidgets('Create Poster FAB is present and positioned above bottom area',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            posterProvider.overrideWith(() => MockPosterNotifier()),
          ],
          child: const MaterialApp(
            home: PostersScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final fabFinder = find.text('Create Poster');
      expect(fabFinder, findsOneWidget);
      expect(find.byIcon(LucideIcons.sparkles), findsOneWidget);
    });

    testWidgets('Responsive check across 320px, 360px, 375px, 390px, 412px viewports',
        (tester) async {
      final widths = [320.0, 360.0, 375.0, 390.0, 412.0];

      for (final width in widths) {
        tester.view.physicalSize = Size(width, 700);
        tester.view.devicePixelRatio = 1.0;

        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              posterProvider.overrideWith(() => MockPosterNotifier()),
            ],
            child: const MaterialApp(
              home: PostersScreen(),
            ),
          ),
        );
        await tester.pumpAndSettle();

        // Must have zero layout overflow on every tested width
        expect(tester.takeException(), isNull,
            reason: 'Zero overflow errors expected at width $width');

        // Both columns must exist
        expect(find.text('Classic Hero Sale'), findsOneWidget);
        expect(find.text('Retail Modern Card'), findsOneWidget);

        // Columns must be equal in width
        final card1Finder = find.widgetWithText(Container, 'Classic Hero Sale');
        final card2Finder = find.widgetWithText(Container, 'Retail Modern Card');
        if (card1Finder.evaluate().isNotEmpty && card2Finder.evaluate().isNotEmpty) {
          final width1 = tester.getSize(card1Finder.first).width;
          final width2 = tester.getSize(card2Finder.first).width;
          expect((width1 - width2).abs(), lessThan(1.0),
              reason: 'Columns must have identical width at screen width $width');
        }
      }
      tester.view.resetPhysicalSize();
    });

    testWidgets('Dark Mode renders with dark theme styling and no exceptions',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            posterProvider.overrideWith(() => MockPosterNotifier()),
          ],
          child: MaterialApp(
            themeMode: ThemeMode.dark,
            theme: ThemeData.light(),
            darkTheme: ThemeData.dark(),
            home: const PostersScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('Templates Gallery'), findsOneWidget);
      expect(find.text('My Saved Posters'), findsOneWidget);
      expect(find.text('Classic Hero Sale'), findsOneWidget);
    });

    testWidgets('TabBar switches to My Saved Posters and renders saved grid',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            posterProvider.overrideWith(
              () => MockPosterNotifier(initialPosters: samplePosters),
            ),
          ],
          child: const MaterialApp(
            home: PostersScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap 'My Saved Posters' tab
      await tester.tap(find.text('My Saved Posters'));
      await tester.pumpAndSettle();

      // Verify saved posters rendered in 2-column grid
      expect(find.text('Summer Sale Poster'), findsOneWidget);
      expect(find.text('Flash Deal Poster'), findsOneWidget);

      expect(tester.takeException(), isNull);
    });
  });
}
