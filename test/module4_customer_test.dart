import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:renote_mobile/models/customer_model.dart';
import 'package:renote_mobile/providers/customer_provider.dart';
import 'package:renote_mobile/features/customers/screens/customers_screen.dart';

void main() {
  group('Module 4: Exact Customer Management Tests', () {
    test('CustomerModel serialization, deserialization & flag verification', () {
      final json = {
        '_id': 'cust_123',
        'name': 'Sri Venkateshwara Traders',
        'phone': '9876543210',
        'email': 'sri@traders.com',
        'address': '12 Cross Cut Road',
        'city': 'Coimbatore',
        'state': 'Tamil Nadu',
        'zipCode': '641012',
        'gstNo': '33AAAAA0000A1Z5',
        'panNo': 'AAAAA0000A',
        'companyType': 'Retail & Wholesale',
        'createdAt': '2026-02-15T10:30:00.000Z',
      };

      final customer = CustomerModel.fromJson(json);
      expect(customer.id, 'cust_123');
      expect(customer.name, 'Sri Venkateshwara Traders');
      expect(customer.phone, '9876543210');
      expect(customer.city, 'Coimbatore');
      expect(customer.gstNo, '33AAAAA0000A1Z5');
      expect(customer.panNo, 'AAAAA0000A');
      expect(customer.createdAt, '2026-02-15T10:30:00.000Z');

      final serialized = customer.toJson();
      expect(serialized['flag'], 'customer');
      expect(serialized['name'], 'Sri Venkateshwara Traders');
      expect(serialized['gstNo'], '33AAAAA0000A1Z5');
    });

    test('CustomerState filtering by name, phone and city', () {
      final customers = [
        CustomerModel(
          id: '1',
          name: 'Apex Electricals',
          phone: '9845012345',
          city: 'Bengaluru',
          companyType: 'Retail & Wholesale',
        ),
        CustomerModel(
          id: '2',
          name: 'Bharathi Steels',
          phone: '9443312345',
          city: 'Coimbatore',
          companyType: 'Manufacturing & Industrial',
        ),
        CustomerModel(
          id: '3',
          name: 'City Supermarket',
          phone: '9123456780',
          city: 'Chennai',
          companyType: 'Retail & Wholesale',
        ),
      ];

      final state = CustomerState(customers: customers, searchQuery: '');
      expect(state.filteredCustomers.length, 3);

      final searchName = state.copyWith(searchQuery: 'Bharathi');
      expect(searchName.filteredCustomers.length, 1);
      expect(searchName.filteredCustomers.first.name, 'Bharathi Steels');

      final searchPhone = state.copyWith(searchQuery: '98450');
      expect(searchPhone.filteredCustomers.length, 1);
      expect(searchPhone.filteredCustomers.first.name, 'Apex Electricals');

      final searchCity = state.copyWith(searchQuery: 'Chennai');
      expect(searchCity.filteredCustomers.length, 1);
      expect(searchCity.filteredCustomers.first.name, 'City Supermarket');
    });

    testWidgets('CustomersScreen renders header, search bar, and Add Customer button', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CustomersScreen(),
          ),
        ),
      );

      // Verify top actions
      expect(find.text('Add Customer'), findsWidgets);
      expect(find.byType(TextField), findsOneWidget);
      expect(find.textContaining('Customer'), findsWidgets);
    });
  });
}

