import 'package:flutter_test/flutter_test.dart';
import 'package:renote_mobile/models/customer_model.dart';
import 'package:renote_mobile/models/product_model.dart';
import 'package:renote_mobile/models/quotation_model.dart';
import 'package:renote_mobile/models/invoice_model.dart';

void main() {
  group('Phase 5 - Core Business Modules Tests', () {
    test('CustomerModel serialization & deserialization', () {
      final customer = CustomerModel(
        id: 'cust_123',
        name: 'Apex Infotech',
        phone: '9876543210',
        email: 'apex@example.com',
        address: '42 Brigade Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560001',
        gstNo: '29ABCDE1234F1Z5',
        panNo: 'ABCDE1234F',
        companyType: 'IT & Software Services',
      );

      final json = customer.toJson();
      expect(json['name'], 'Apex Infotech');
      expect(json['phone'], '9876543210');
      expect(json['gstNo'], '29ABCDE1234F1Z5');
      expect(json['flag'], 'customer');

      final fromJson = CustomerModel.fromJson(json);
      expect(fromJson.name, 'Apex Infotech');
      expect(fromJson.phone, '9876543210');
      expect(fromJson.gstNo, '29ABCDE1234F1Z5');
      expect(fromJson.city, 'Bengaluru');
    });

    test('ProductModel pricing, tax & stock serialization', () {
      final product = ProductModel(
        id: 'prod_999',
        name: 'Wireless Bluetooth Headset',
        price: 2499.00,
        qty: 25.0,
        unit: 'pcs',
        gst: 18.0,
        hsn: '8518',
        description: 'Noise cancelling overhead headphones',
        companyId: 'comp_111',
      );

      final json = product.toJson(companyId: 'comp_111');
      expect(json['name'], 'Wireless Bluetooth Headset');
      expect(json['price'], 2499.00);
      expect(json['qty'], 25.0);
      expect(json['gst'], 18.0);
      expect(json['hsn'], '8518');

      final fromJson = ProductModel.fromJson(json);
      expect(fromJson.name, 'Wireless Bluetooth Headset');
      expect(fromJson.price, 2499.00);
      expect(fromJson.unit, 'pcs');
    });

    test('DocumentItem price, tax & total calculations', () {
      final item = DocumentItem(
        product: 'Office Desk Chair',
        price: 5000.0,
        qty: 2.0,
        unit: 'Pcs',
        gst: 18.0,
        hsn: '9403',
      );

      expect(item.amount, 10000.0);
      expect(item.taxAmount, 1800.0);
      expect(item.totalWithTax, 11800.0);
    });

    test('QuotationModel financial aggregation & parsing', () {
      final item1 = DocumentItem(
        product: 'Custom Website Design',
        price: 25000.0,
        qty: 1.0,
        gst: 18.0,
      );
      final item2 = DocumentItem(
        product: 'Hosting & Domain Setup',
        price: 5000.0,
        qty: 1.0,
        gst: 18.0,
      );

      final quotation = QuotationModel(
        id: 'est_101',
        estimateId: 'E2611001',
        customerName: 'Tech Innovations Ltd',
        customerPhone: '9988776655',
        vendorCompanyName: 'ReNote Studio',
        items: [item1, item2],
        subtotal: item1.amount + item2.amount,
        taxAmount: item1.taxAmount + item2.taxAmount,
        totalAmount: item1.totalWithTax + item2.totalWithTax,
      );

      expect(quotation.estimateId, 'E2611001');
      expect(quotation.subtotal, 30000.0);
      expect(quotation.taxAmount, 5400.0);
      expect(quotation.totalAmount, 35400.0);

      final json = quotation.toJson();
      expect(json['estimateID'], 'E2611001');
      expect((json['products'] as List).length, 2);
    });

    test('InvoiceModel paid status and financial aggregation', () {
      final invoicePaid = InvoiceModel(
        id: 'inv_201',
        invoiceId: 'I/26-27/0001',
        customerName: 'Global Exporters',
        status: 'Paid',
        subtotal: 10000.0,
        taxAmount: 1800.0,
        totalAmount: 11800.0,
      );

      final invoicePending = InvoiceModel(
        id: 'inv_202',
        invoiceId: 'I/26-27/0002',
        customerName: 'Local Retailer',
        status: 'Pending',
        subtotal: 5000.0,
        taxAmount: 900.0,
        totalAmount: 5900.0,
      );

      expect(invoicePaid.isPaid, true);
      expect(invoicePending.isPaid, false);
      expect(invoicePaid.totalAmount, 11800.0);
      expect(invoicePending.totalAmount, 5900.0);
    });
  });
}

