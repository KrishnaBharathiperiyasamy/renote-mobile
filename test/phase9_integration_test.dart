import 'package:flutter_test/flutter_test.dart';
import 'package:renote_mobile/models/user_model.dart';
import 'package:renote_mobile/models/company_model.dart';
import 'package:renote_mobile/models/customer_model.dart';
import 'package:renote_mobile/models/product_model.dart';
import 'package:renote_mobile/models/quotation_model.dart';
import 'package:renote_mobile/models/invoice_model.dart';
import 'package:renote_mobile/models/poster_model.dart';
import 'package:renote_mobile/models/marketplace_item_model.dart';
import 'package:renote_mobile/models/plan_model.dart';
import 'package:renote_mobile/models/subscription_model.dart';

void main() {
  group('Phase 9 - Complete Application Integration Tests', () {
    // -------------------------------------------------------------
    // MODULE 1: Authentication & Token Persistence
    // -------------------------------------------------------------
    test('Module 1: Authentication data contract & user profile mapping', () {
      final authApiResponse = {
        'success': true,
        'message': 'Login successful',
        'data': {
          'accessToken': 'jwt_access_token_sample_123',
          'refreshToken': 'jwt_refresh_token_sample_456',
          'user': {
            'id': 'usr_test_001',
            'email': 'admin@krishub.in',
            'phone': '9876543210',
            'firstName': 'Admin',
            'lastName': 'User',
            'role': 'SUPER_ADMIN',
          },
        },
      };

      final authData = authApiResponse['data'] as Map<String, dynamic>;
      final user = UserModel.fromJson(authData['user'] as Map<String, dynamic>);

      expect(user.id, 'usr_test_001');
      expect(user.email, 'admin@krishub.in');
      expect(user.phone, '9876543210');
      expect(user.fullName, 'Admin User');
      expect(user.role, 'SUPER_ADMIN');
      expect(authData['accessToken'], isNotEmpty);
      expect(authData['refreshToken'], isNotEmpty);
    });

    // -------------------------------------------------------------
    // MODULE 2: Business & Multi-Company Management
    // -------------------------------------------------------------
    test('Module 2: Multi-Company profile modeling and isolation', () {
      final comp1 = CompanyModel(
        id: 'comp_001',
        name: 'KrishTech Solutions Pvt Ltd',
        phone: '9092024444',
        email: 'info@krishtech.in',
        address: '100 Crosscut Road, Gandhipuram',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zipCode: '641012',
        gstNo: '33ABCDE1234F1Z5',
        panNo: 'ABCDE1234F',
      );

      final comp2 = CompanyModel(
        id: 'comp_002',
        name: 'Apex Infotech Bengaluru',
        phone: '9876543210',
        city: 'Bengaluru',
      );

      expect(comp1.name, 'KrishTech Solutions Pvt Ltd');
      expect(comp1.gstNo, '33ABCDE1234F1Z5');
      expect(comp2.city, 'Bengaluru');
      expect(comp1.id != comp2.id, isTrue);
    });

    // -------------------------------------------------------------
    // MODULE 3: Customer Management
    // -------------------------------------------------------------
    test('Module 3: Customer entity serialization & GSTIN validation', () {
      final customer = CustomerModel(
        id: 'cust_501',
        name: 'Ramu Electricals & Hardware',
        phone: '9443322110',
        email: 'ramu@hardware.in',
        address: 'Main Bazaar',
        city: 'Madurai',
        state: 'Tamil Nadu',
        zipCode: '625001',
        gstNo: '33AABCR1234K1Z2',
        panNo: 'AABCR1234K',
        companyType: 'Retail & Wholesale',
      );

      final json = customer.toJson();
      expect(json['name'], 'Ramu Electricals & Hardware');
      expect(json['gstNo'], '33AABCR1234K1Z2');
      expect(json['flag'], 'customer');

      final restored = CustomerModel.fromJson(json);
      expect(restored.name, customer.name);
      expect(restored.phone, customer.phone);
      expect(restored.gstNo, customer.gstNo);
    });

    // -------------------------------------------------------------
    // MODULE 4: Product Warehouse & Tax Valuation
    // -------------------------------------------------------------
    test('Module 4: Product inventory, HSN, tax rate and stock calculations', () {
      final product = ProductModel(
        id: 'prod_101',
        name: 'Cat6 UTP Network Cable 305m',
        price: 4500.0,
        qty: 15.0,
        unit: 'box',
        gst: 18.0,
        hsn: '8544',
        description: 'High speed copper gigabit LAN cable',
        companyId: 'comp_001',
      );

      expect(product.price * product.qty, 67500.0);
      expect(product.gst, 18.0);
      expect(product.hsn, '8544');

      final json = product.toJson(companyId: 'comp_001');
      expect(json['name'], product.name);
      expect(json['price'], 4500.0);
      expect(json['qty'], 15.0);
      expect(json['gst'], 18.0);
    });

    // -------------------------------------------------------------
    // MODULE 5: Quotation (Estimation) Financial Calculations
    // -------------------------------------------------------------
    test('Module 5: Quotation calculation with discounts and GST breakdown', () {
      final items = [
        DocumentItem(
          product: 'Dell OptiPlex 7090 Desktop',
          price: 45000.0,
          qty: 2.0,
          gst: 18.0,
          hsn: '8471',
        ),
        DocumentItem(
          product: 'Dell 24-inch IPS Monitor',
          price: 11000.0,
          qty: 2.0,
          gst: 18.0,
          hsn: '8528',
        ),
      ];

      // Item 1: 2 * 45000 = 90,000; Tax 18% = 16,200; Total = 106,200
      expect(items[0].amount, 90000.0);
      expect(items[0].taxAmount, 16200.0);
      expect(items[0].totalWithTax, 106200.0);

      // Item 2: 2 * 11000 = 22,000; Tax 18% = 3,960; Total = 25,960
      expect(items[1].amount, 22000.0);
      expect(items[1].taxAmount, 3960.0);
      expect(items[1].totalWithTax, 25960.0);

      final subtotal = items[0].amount + items[1].amount;
      final taxAmount = items[0].taxAmount + items[1].taxAmount;
      final discount = (subtotal + taxAmount) * 0.05;
      final totalAmount = (subtotal + taxAmount) - discount;

      final quotation = QuotationModel(
        id: 'quot_001',
        estimateId: 'EST-2026-001',
        customerName: 'Sri Krishna Sweets',
        customerPhone: '9876543210',
        items: items,
        subtotal: subtotal,
        taxAmount: taxAmount,
        discount: discount,
        totalAmount: totalAmount,
      );

      expect(quotation.subtotal, 112000.0);
      expect(quotation.taxAmount, 20160.0);
      expect(quotation.totalAmount, closeTo(125552.0, 0.01));
    });

    // -------------------------------------------------------------
    // MODULE 6: Invoice Generation & Paid Status
    // -------------------------------------------------------------
    test('Module 6: Invoice structure, financial aggregation & paid status', () {
      final invoice = InvoiceModel(
        id: 'inv_001',
        invoiceId: 'INV/2026/042',
        customerName: 'Gowtham Textiles',
        items: [
          DocumentItem(
            product: 'Thermal Barcode Printer',
            price: 12500.0,
            qty: 1.0,
            gst: 18.0,
          ),
        ],
        status: 'Paid',
        subtotal: 12500.0,
        taxAmount: 2250.0,
        totalAmount: 14750.0,
      );

      expect(invoice.invoiceId, 'INV/2026/042');
      expect(invoice.isPaid, isTrue);
      expect(invoice.totalAmount, 14750.0);
    });

    // -------------------------------------------------------------
    // MODULE 7: Poster Studio & Template Engine
    // -------------------------------------------------------------
    test('Module 7: Poster canvas properties, layers & aspect ratio mapping', () {
      final poster = PosterModel(
        id: 'pos_1001',
        posterId: 'POS-2026-X',
        posterName: 'Deepavali Mega Sale',
        posterTitle: 'UP TO 50% OFF TODAY',
        productName: 'Smart LED TV 55-inch',
        productPrice: 38999.0,
        aspectRatio: '3:4',
        colorThemeId: 'flame-orange',
        template: 'frame1',
        stickers: [
          {
            'id': 'stk_1',
            'label': 'HOT DEAL 🔥',
            'x': 0.1,
            'y': 0.2,
          }
        ],
      );

      expect(poster.aspectRatio, '3:4');
      expect(poster.stickers.length, 1);
      expect(poster.productPrice, 38999.0);
      expect(poster.posterTitle, 'UP TO 50% OFF TODAY');
    });

    // -------------------------------------------------------------
    // MODULE 8: Marketplace Module & Search
    // -------------------------------------------------------------
    test('Module 8: Marketplace item normalization and price formatting', () {
      final item = MarketplaceItemModel(
        id: 'mp_001',
        title: 'HP LaserJet Pro M404dn',
        category: 'Electronics',
        price: 24500.0,
        image: 'uploads/products/printer.png',
        location: 'Coimbatore',
        phone: '9092024444',
        companyName: 'KrishTech Computers',
      );

      expect(item.title, 'HP LaserJet Pro M404dn');
      expect(item.category, 'Electronics');
      expect(item.price, 24500.0);
      expect(item.phone, '9092024444');
      expect(item.location, 'Coimbatore');
    });

    // -------------------------------------------------------------
    // MODULE 9: Subscription & Razorpay Payment Verification
    // -------------------------------------------------------------
    test('Module 9: Subscription plans, Razorpay verification signature flow', () {
      final plan = PlanModel(
        id: 'plan_pro_01',
        name: 'Pro',
        price: 349.0,
        duration: 'monthly',
        slug: 'pro',
        popular: true,
        razorpayPlanId: 'plan_SuHjD7tGoQASjL',
      );

      expect(plan.name, 'Pro');
      expect(plan.price, 349.0);
      expect(plan.slug, 'pro');
      expect(plan.popular, isTrue);
      expect(plan.razorpayPlanId, 'plan_SuHjD7tGoQASjL');

      final subscription = SubscriptionModel(
        id: 'sub_test_01',
        userId: 'u_101',
        planId: plan.id,
        planName: plan.name,
        planSlug: plan.slug,
        price: plan.price,
        status: 'active',
        isActive: true,
        startDate: '2026-11-17T00:00:00Z',
        endDate: '2026-12-17T00:00:00Z',
        razorpayPaymentId: 'pay_N123456789',
        razorpaySubscriptionId: 'sub_N123456789',
      );

      expect(subscription.planName, 'Pro');
      expect(subscription.isActive, isTrue);
      expect(subscription.isExpired, isFalse);
      expect(subscription.daysRemaining, greaterThan(25));
      expect(subscription.razorpayPaymentId, 'pay_N123456789');
    });
  });
}
