import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:renote_mobile/models/marketplace_item_model.dart';
import 'package:renote_mobile/providers/marketplace_provider.dart';
import 'package:renote_mobile/providers/quotation_provider.dart';
import 'package:renote_mobile/providers/company_provider.dart';
import 'package:renote_mobile/providers/subscription_provider.dart';

void main() {
  group('Marketplace & Estimations Network Resilience Tests', () {
    test('MarketplaceState preserves items when loaded with valid products', () {
      final sample = MarketplaceItemModel(
        id: 'pos_101',
        title: 'Industrial Heavy Duty Drill',
        category: 'Electronics',
        price: 3499.0,
        image: 'https://example.com/drill.png',
        location: 'Bengaluru',
      );

      final state = MarketplaceState(items: [sample]);
      expect(state.items.length, 1);
      expect(state.filteredItems.length, 1);
      expect(state.filteredItems.first.title, 'Industrial Heavy Duty Drill');
    });

    test('MarketplaceState filteredItems properly returns all items on default filters', () {
      final item1 = MarketplaceItemModel(
        id: 'pos_1',
        title: 'Product One',
        category: 'Electronics',
        price: 500.0,
        image: '',
      );
      final item2 = MarketplaceItemModel(
        id: 'pos_2',
        title: 'Product Two',
        category: 'Fashion',
        price: 1500.0,
        image: '',
      );

      final state = MarketplaceState(
        items: [item1, item2],
        selectedCategory: 'All',
        selectedCity: 'All',
        searchQuery: '',
      );

      expect(state.totalCount, 2);
      expect(state.filteredItems.length, 2);
    });

    test('QuotationState initializes and filters correctly', () {
      final state = QuotationState(quotations: []);
      expect(state.isLoading, false);
      expect(state.quotations, isEmpty);
      expect(state.filteredQuotations, isEmpty);
    });

    test('SubscriptionState displayedPlans returns fallback plans when server plans empty', () {
      final state = SubscriptionState(plans: []);
      final displayed = state.displayedPlans;
      expect(displayed.isNotEmpty, true);
      expect(displayed.any((p) => p.slug == 'pro'), true);
    });

    test('CompanyState initializes with empty list', () {
      final state = CompanyState();
      expect(state.isLoading, false);
      expect(state.companies, isEmpty);
      expect(state.selectedCompany, isNull);
    });
  });
}
