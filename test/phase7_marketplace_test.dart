import 'package:flutter_test/flutter_test.dart';
import 'package:renote_mobile/models/marketplace_item_model.dart';
import 'package:renote_mobile/providers/marketplace_provider.dart';

void main() {
  group('Phase 7 - Marketplace Module Tests', () {
    test('MarketplaceItemModel deserialization from backend JSON', () {
      final json = {
        '_id': 'mp_item_101',
        'poster_title': 'Apple MacBook Pro M3',
        'marketplaceCategory': 'Electronics',
        'marketplaceSubcategory': 'Laptops',
        'product_price': 125000.0,
        'product_image': 'uploads/products/macbook.png',
        'condition': 'Brand New',
        'marketplaceCity': 'Bengaluru',
        'company_id': {
          'name': 'KrishTech Computers',
          'city': 'Bengaluru',
          'phone': '9876543210',
          'gstNo': '29ABCDE1234F1Z5',
        },
        'user_id': {
          'firstName': 'Suresh',
          'lastName': 'Kumar',
        },
        'viewsCount': 120,
        'likesCount': 15,
        'averageRating': 4.8,
        'ratingsCount': 6,
        'isFavorite': true,
        'isSold': false,
        'createdAt': '2026-11-17T01:00:00Z',
      };

      final item = MarketplaceItemModel.fromJson(json);

      expect(item.id, 'mp_item_101');
      expect(item.title, 'Apple MacBook Pro M3');
      expect(item.category, 'Electronics');
      expect(item.subcategory, 'Laptops');
      expect(item.price, 125000.0);
      expect(item.location, 'Bengaluru');
      expect(item.companyName, 'KrishTech Computers');
      expect(item.companyGst, '29ABCDE1234F1Z5');
      expect(item.sellerName, 'Suresh Kumar');
      expect(item.phone, '9876543210');
      expect(item.viewsCount, 120);
      expect(item.likesCount, 15);
      expect(item.averageRating, 4.8);
      expect(item.isFavorite, isTrue);
      expect(item.isSold, isFalse);
    });

    test('MarketplaceItemModel fallback parsing for listing format', () {
      final json = {
        'id': 'listing_202',
        'title': 'Nike Air Zoom Sneakers',
        'category': 'Fashion',
        'price': 4999,
        'image': 'https://example.com/shoes.png',
        'location': 'Mumbai',
        'phone': '9123456789',
        'whatsapp': '9123456789',
        'companyName': 'Urban Footwear',
      };

      final item = MarketplaceItemModel.fromJson(json);

      expect(item.id, 'listing_202');
      expect(item.title, 'Nike Air Zoom Sneakers');
      expect(item.category, 'Fashion');
      expect(item.price, 4999.0);
      expect(item.location, 'Mumbai');
      expect(item.phone, '9123456789');
      expect(item.whatsapp, '9123456789');
      expect(item.companyName, 'Urban Footwear');
    });

    test('MarketplaceState category, price and city filtering', () {
      final items = [
        MarketplaceItemModel(
          id: '1',
          title: 'Dell Precision Workstation',
          category: 'Electronics',
          subcategory: 'Computers',
          price: 45000.0,
          image: '',
          location: 'Coimbatore',
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
          viewsCount: 50,
          createdAt: '2026-11-16T01:00:00Z',
        ),
        MarketplaceItemModel(
          id: '3',
          title: 'Mechanical Engineering Textbook',
          category: 'Books & Education',
          price: 650.0,
          image: '',
          location: 'Chennai',
          viewsCount: 15,
          createdAt: '2026-11-15T01:00:00Z',
        ),
        MarketplaceItemModel(
          id: '4',
          title: 'HP EliteBook Laptop',
          category: 'Electronics',
          subcategory: 'Laptops',
          price: 32000.0,
          image: '',
          location: 'Coimbatore',
          viewsCount: 320,
          createdAt: '2026-11-14T01:00:00Z',
        ),
      ];

      final baseState = MarketplaceState(items: items);
      expect(baseState.totalCount, 4);

      // 1. Filter by category
      final elecState = baseState.copyWith(selectedCategory: 'Electronics');
      expect(elecState.totalCount, 2);

      // 2. Filter by price range
      final priceState = baseState.copyWith(minPrice: 5000, maxPrice: 40000);
      expect(priceState.totalCount, 2); // 7500 and 32000

      // 3. Filter by city
      final cityState = baseState.copyWith(selectedCity: 'Coimbatore');
      expect(cityState.totalCount, 2);

      // 4. Search query
      final searchState = baseState.copyWith(searchQuery: 'chair');
      expect(searchState.totalCount, 1);
      expect(searchState.filteredItems.first.title, 'Office Ergonomic Chair');
    });

    test('MarketplaceState sorting: price low-high, high-low and popularity', () {
      final items = [
        MarketplaceItemModel(
          id: '1',
          title: 'Item A',
          category: 'General',
          price: 100.0,
          image: '',
          viewsCount: 50,
          createdAt: '2026-11-15T01:00:00Z',
        ),
        MarketplaceItemModel(
          id: '2',
          title: 'Item B',
          category: 'General',
          price: 500.0,
          image: '',
          viewsCount: 10,
          createdAt: '2026-11-16T01:00:00Z',
        ),
        MarketplaceItemModel(
          id: '3',
          title: 'Item C',
          category: 'General',
          price: 250.0,
          image: '',
          viewsCount: 500,
          createdAt: '2026-11-17T01:00:00Z',
        ),
      ];

      final state = MarketplaceState(items: items);

      // Low to High
      final lowHigh = state.copyWith(sortOption: 'Price: Low to High');
      expect(lowHigh.filteredItems.map((e) => e.price).toList(), [100.0, 250.0, 500.0]);

      // High to Low
      final highLow = state.copyWith(sortOption: 'Price: High to Low');
      expect(highLow.filteredItems.map((e) => e.price).toList(), [500.0, 250.0, 100.0]);

      // Most Popular
      final popular = state.copyWith(sortOption: 'Most Popular');
      expect(popular.filteredItems.first.title, 'Item C');
    });
  });
}

