import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:renote_mobile/models/product_model.dart';
import 'package:renote_mobile/providers/product_provider.dart';
import 'package:renote_mobile/features/products/screens/products_screen.dart';

void main() {
  group('Module 5: Exact Product Warehouse Tests', () {
    test('ProductModel serialization, deserialization, HSN & GST mapping', () {
      final json = {
        '_id': 'prod_999',
        'name': 'Wireless Ergonomic Keyboard',
        'price': 2499.0,
        'qty': 15.0,
        'unit': 'PCS',
        'gst': 18.0,
        'hsn': '84716060',
        'description': 'Rechargeable multi-device Bluetooth keyboard',
        'companyId': 'comp_123',
        'isHeart': true,
        'createdAt': '2026-03-01T12:00:00.000Z',
      };

      final product = ProductModel.fromJson(json);
      expect(product.id, 'prod_999');
      expect(product.name, 'Wireless Ergonomic Keyboard');
      expect(product.price, 2499.0);
      expect(product.qty, 15.0);
      expect(product.unit, 'PCS');
      expect(product.gst, 18.0);
      expect(product.hsn, '84716060');
      expect(product.isFavorite, true);

      final serialized = product.toJson(companyId: 'comp_123');
      expect(serialized['name'], 'Wireless Ergonomic Keyboard');
      expect(serialized['price'], 2499.0);
      expect(serialized['gst'], 18.0);
      expect(serialized['hsn'], '84716060');
    });

    test('ProductState KPI calculations and filtering logic', () {
      final products = [
        ProductModel(
          id: '1',
          name: 'Steel Bolts M8',
          price: 50.0,
          qty: 100.0,
          unit: 'PCS',
          gst: 18.0,
          hsn: '7318',
          isFavorite: false,
        ),
        ProductModel(
          id: '2',
          name: 'Industrial Motor 5HP',
          price: 15000.0,
          qty: 2.0,
          unit: 'SET',
          gst: 28.0,
          hsn: '8501',
          isFavorite: true,
        ),
        ProductModel(
          id: '3',
          name: 'Lubricant Oil 5L',
          price: 1200.0,
          qty: 10.0,
          unit: 'CAN',
          gst: 18.0,
          hsn: '2710',
          isFavorite: true,
        ),
      ];

      final state = ProductState(products: products);

      // KPI Checks:
      // Total products: 3
      // Total stock: 100 + 2 + 10 = 112
      // Valuation: (50*100) + (15000*2) + (1200*10) = 5000 + 30000 + 12000 = 47000
      expect(state.totalProducts, 3);
      expect(state.totalStock, 112.0);
      expect(state.totalValuation, 47000.0);

      // Favorites filter check
      final favState = state.copyWith(favoritesOnly: true);
      expect(favState.filteredProducts.length, 2);

      // Price filter check
      final priceFiltered = state.copyWith(minPrice: 1000.0, maxPrice: 10000.0);
      expect(priceFiltered.filteredProducts.length, 1);
      expect(priceFiltered.filteredProducts.first.name, 'Lubricant Oil 5L');

      // Search check
      final searchFiltered = state.copyWith(searchQuery: 'Bolts');
      expect(searchFiltered.filteredProducts.length, 1);
      expect(searchFiltered.filteredProducts.first.name, 'Steel Bolts M8');
    });

    testWidgets('ProductsScreen renders 3 KPI cards, search, and Add Product button', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: ProductsScreen(),
          ),
        ),
      );

      // Verify 3 KPI metric headers
      expect(find.text('TOTAL PRODUCTS'), findsOneWidget);
      expect(find.text('STOCK QTY'), findsOneWidget);
      expect(find.text('STOCK VALUE'), findsOneWidget);

      // Verify search input
      expect(find.byType(TextField), findsOneWidget);

      // Verify Add Product button
      expect(find.text('Add Product'), findsWidgets);
    });
  });
}

