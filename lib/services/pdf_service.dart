import 'dart:typed_data';

import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../models/quotation_model.dart';
import '../models/invoice_model.dart';

class PdfService {
  static final currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: 'Rs. ',
    decimalDigits: 2,
  );

  static Future<Uint8List> generateQuotationPdf(
    QuotationModel quotation,
  ) async {
    final pdf = pw.Document();
    final primaryColor = PdfColor.fromHex('#FF6B00');
    final darkColor = PdfColor.fromHex('#1E2230');

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'ReNote',
                        style: pw.TextStyle(
                          color: primaryColor,
                          fontSize: 26,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        'OFFICIAL ESTIMATION / QUOTATION',
                        style: pw.TextStyle(
                          color: darkColor,
                          fontSize: 10,
                          fontWeight: pw.FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: pw.BoxDecoration(
                          color: primaryColor,
                          borderRadius: pw.BorderRadius.circular(4),
                        ),
                        child: pw.Text(
                          '#${quotation.estimateId}',
                          style: pw.TextStyle(
                            color: PdfColors.white,
                            fontSize: 12,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                      ),
                      pw.SizedBox(height: 6),
                      pw.Text(
                        'Date: ${quotation.date != null ? DateFormat('dd MMM yyyy').format(DateTime.tryParse(quotation.date!) ?? DateTime.now()) : DateFormat('dd MMM yyyy').format(DateTime.now())}',
                        style: const pw.TextStyle(
                          fontSize: 10,
                          color: PdfColors.grey700,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              pw.Divider(color: primaryColor, thickness: 1.5, height: 24),

              // Parties Information
              pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  // Seller / Vendor
                  pw.Expanded(
                    child: pw.Container(
                      padding: const pw.EdgeInsets.all(10),
                      decoration: pw.BoxDecoration(
                        color: PdfColors.grey100,
                        borderRadius: pw.BorderRadius.circular(6),
                      ),
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(
                            'QUOTED BY (FROM)',
                            style: pw.TextStyle(
                              fontSize: 9,
                              fontWeight: pw.FontWeight.bold,
                              color: primaryColor,
                            ),
                          ),
                          pw.SizedBox(height: 4),
                          pw.Text(
                            quotation.vendorCompanyName ??
                                'ReNote Business Partner',
                            style: pw.TextStyle(
                              fontSize: 11,
                              fontWeight: pw.FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  pw.SizedBox(width: 16),
                  // Buyer / Customer
                  pw.Expanded(
                    child: pw.Container(
                      padding: const pw.EdgeInsets.all(10),
                      decoration: pw.BoxDecoration(
                        color: PdfColors.grey100,
                        borderRadius: pw.BorderRadius.circular(6),
                      ),
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(
                            'QUOTED TO (CLIENT)',
                            style: pw.TextStyle(
                              fontSize: 9,
                              fontWeight: pw.FontWeight.bold,
                              color: primaryColor,
                            ),
                          ),
                          pw.SizedBox(height: 4),
                          pw.Text(
                            quotation.customerName ?? 'Valued Customer',
                            style: pw.TextStyle(
                              fontSize: 11,
                              fontWeight: pw.FontWeight.bold,
                            ),
                          ),
                          if (quotation.customerPhone != null &&
                              quotation.customerPhone!.isNotEmpty)
                            pw.Text(
                              'Phone: ${quotation.customerPhone}',
                              style: const pw.TextStyle(fontSize: 9),
                            ),
                          if (quotation.customerEmail != null &&
                              quotation.customerEmail!.isNotEmpty)
                            pw.Text(
                              'Email: ${quotation.customerEmail}',
                              style: const pw.TextStyle(fontSize: 9),
                            ),
                          if (quotation.customerGstNo != null &&
                              quotation.customerGstNo!.isNotEmpty)
                            pw.Text(
                              'GSTIN: ${quotation.customerGstNo}',
                              style: const pw.TextStyle(fontSize: 9),
                            ),
                          if (quotation.customerAddress != null &&
                              quotation.customerAddress!.isNotEmpty)
                            pw.Text(
                              'Address: ${quotation.customerAddress}',
                              style: const pw.TextStyle(fontSize: 9),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 20),

              // Items Table
              pw.Table(
                border: pw.TableBorder.all(
                  color: PdfColors.grey300,
                  width: 0.5,
                ),
                columnWidths: {
                  0: const pw.FixedColumnWidth(28),
                  1: const pw.FlexColumnWidth(4),
                  2: const pw.FlexColumnWidth(2),
                  3: const pw.FlexColumnWidth(1.5),
                  4: const pw.FlexColumnWidth(2),
                  5: const pw.FlexColumnWidth(1.5),
                  6: const pw.FlexColumnWidth(2.5),
                },
                children: [
                  pw.TableRow(
                    decoration: pw.BoxDecoration(color: darkColor),
                    children: [
                      _th('#'),
                      _th('Item Description'),
                      _th('HSN/SAC'),
                      _th('Qty'),
                      _th('Rate (Rs)'),
                      _th('GST %'),
                      _th('Total (Rs)'),
                    ],
                  ),
                  ...quotation.items.asMap().entries.map((entry) {
                    final idx = entry.key + 1;
                    final it = entry.value;
                    return pw.TableRow(
                      decoration: pw.BoxDecoration(
                        color: idx % 2 == 0
                            ? PdfColors.grey50
                            : PdfColors.white,
                      ),
                      children: [
                        _td('$idx', align: pw.TextAlign.center),
                        _td(it.product),
                        _td(it.hsn.isNotEmpty ? it.hsn : '-'),
                        _td(
                          '${it.qty.toStringAsFixed(it.qty.truncateToDouble() == it.qty ? 0 : 2)} ${it.unit}',
                        ),
                        _td(
                          it.price.toStringAsFixed(2),
                          align: pw.TextAlign.right,
                        ),
                        _td('${it.gst.toStringAsFixed(0)}%'),
                        _td(
                          it.totalWithTax.toStringAsFixed(2),
                          align: pw.TextAlign.right,
                        ),
                      ],
                    );
                  }),
                ],
              ),
              pw.SizedBox(height: 16),

              // Summary Box
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.end,
                children: [
                  pw.Container(
                    width: 240,
                    padding: const pw.EdgeInsets.all(12),
                    decoration: pw.BoxDecoration(
                      border: pw.TableBorder.all(
                        color: PdfColors.grey300,
                        width: 0.5,
                      ),
                      borderRadius: pw.BorderRadius.circular(6),
                      color: PdfColors.grey50,
                    ),
                    child: pw.Column(
                      children: [
                        _summaryRow(
                          'Subtotal (Taxable):',
                          currencyFormat.format(quotation.subtotal),
                        ),
                        pw.SizedBox(height: 4),
                        _summaryRow(
                          'Estimated GST Tax:',
                          currencyFormat.format(quotation.taxAmount),
                        ),
                        pw.Divider(
                          color: PdfColors.grey400,
                          thickness: 0.5,
                          height: 12,
                        ),
                        _summaryRow(
                          'Grand Total:',
                          currencyFormat.format(quotation.totalAmount),
                          isBold: true,
                          color: primaryColor,
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              pw.Spacer(),

              // Footer
              pw.Divider(color: PdfColors.grey300, thickness: 0.5),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(
                    'Generated via ReNote Business Management Mobile',
                    style: const pw.TextStyle(
                      fontSize: 8,
                      color: PdfColors.grey500,
                    ),
                  ),
                  pw.Text(
                    'Authorized Signatory',
                    style: pw.TextStyle(
                      fontSize: 9,
                      fontWeight: pw.FontWeight.bold,
                      color: darkColor,
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }

  static Future<Uint8List> generateInvoicePdf(InvoiceModel invoice) async {
    final pdf = pw.Document();
    final primaryColor = PdfColor.fromHex('#FF6B00');
    final darkColor = PdfColor.fromHex('#1E2230');

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'ReNote',
                        style: pw.TextStyle(
                          color: primaryColor,
                          fontSize: 26,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        'TAX INVOICE',
                        style: pw.TextStyle(
                          color: darkColor,
                          fontSize: 11,
                          fontWeight: pw.FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: pw.BoxDecoration(
                          color: darkColor,
                          borderRadius: pw.BorderRadius.circular(4),
                        ),
                        child: pw.Text(
                          invoice.invoiceId,
                          style: pw.TextStyle(
                            color: PdfColors.white,
                            fontSize: 12,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                      ),
                      pw.SizedBox(height: 6),
                      pw.Text(
                        'Status: ${invoice.status.toUpperCase()}',
                        style: pw.TextStyle(
                          fontSize: 9,
                          fontWeight: pw.FontWeight.bold,
                          color: invoice.isPaid
                              ? PdfColors.green700
                              : primaryColor,
                        ),
                      ),
                      pw.Text(
                        'Invoice Date: ${invoice.date != null ? DateFormat('dd MMM yyyy').format(DateTime.tryParse(invoice.date!) ?? DateTime.now()) : DateFormat('dd MMM yyyy').format(DateTime.now())}',
                        style: const pw.TextStyle(
                          fontSize: 9,
                          color: PdfColors.grey700,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              pw.Divider(color: primaryColor, thickness: 1.5, height: 24),

              // Parties Information
              pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  // Seller / Vendor
                  pw.Expanded(
                    child: pw.Container(
                      padding: const pw.EdgeInsets.all(10),
                      decoration: pw.BoxDecoration(
                        color: PdfColors.grey100,
                        borderRadius: pw.BorderRadius.circular(6),
                      ),
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(
                            'SUPPLIER (BILL FROM)',
                            style: pw.TextStyle(
                              fontSize: 9,
                              fontWeight: pw.FontWeight.bold,
                              color: primaryColor,
                            ),
                          ),
                          pw.SizedBox(height: 4),
                          pw.Text(
                            invoice.vendorCompanyName ?? 'ReNote Merchant',
                            style: pw.TextStyle(
                              fontSize: 11,
                              fontWeight: pw.FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  pw.SizedBox(width: 16),
                  // Buyer / Customer
                  pw.Expanded(
                    child: pw.Container(
                      padding: const pw.EdgeInsets.all(10),
                      decoration: pw.BoxDecoration(
                        color: PdfColors.grey100,
                        borderRadius: pw.BorderRadius.circular(6),
                      ),
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(
                            'RECIPIENT (BILL TO)',
                            style: pw.TextStyle(
                              fontSize: 9,
                              fontWeight: pw.FontWeight.bold,
                              color: primaryColor,
                            ),
                          ),
                          pw.SizedBox(height: 4),
                          pw.Text(
                            invoice.customerName ?? 'Valued Customer',
                            style: pw.TextStyle(
                              fontSize: 11,
                              fontWeight: pw.FontWeight.bold,
                            ),
                          ),
                          if (invoice.customerPhone != null &&
                              invoice.customerPhone!.isNotEmpty)
                            pw.Text(
                              'Phone: ${invoice.customerPhone}',
                              style: const pw.TextStyle(fontSize: 9),
                            ),
                          if (invoice.customerEmail != null &&
                              invoice.customerEmail!.isNotEmpty)
                            pw.Text(
                              'Email: ${invoice.customerEmail}',
                              style: const pw.TextStyle(fontSize: 9),
                            ),
                          if (invoice.customerGstNo != null &&
                              invoice.customerGstNo!.isNotEmpty)
                            pw.Text(
                              'GSTIN: ${invoice.customerGstNo}',
                              style: const pw.TextStyle(fontSize: 9),
                            ),
                          if (invoice.customerAddress != null &&
                              invoice.customerAddress!.isNotEmpty)
                            pw.Text(
                              'Address: ${invoice.customerAddress}',
                              style: const pw.TextStyle(fontSize: 9),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 20),

              // Items Table
              pw.Table(
                border: pw.TableBorder.all(
                  color: PdfColors.grey300,
                  width: 0.5,
                ),
                columnWidths: {
                  0: const pw.FixedColumnWidth(28),
                  1: const pw.FlexColumnWidth(4),
                  2: const pw.FlexColumnWidth(2),
                  3: const pw.FlexColumnWidth(1.5),
                  4: const pw.FlexColumnWidth(2),
                  5: const pw.FlexColumnWidth(1.5),
                  6: const pw.FlexColumnWidth(2.5),
                },
                children: [
                  pw.TableRow(
                    decoration: pw.BoxDecoration(color: darkColor),
                    children: [
                      _th('#'),
                      _th('Item Description'),
                      _th('HSN/SAC'),
                      _th('Qty'),
                      _th('Rate (Rs)'),
                      _th('GST %'),
                      _th('Amount (Rs)'),
                    ],
                  ),
                  ...invoice.items.asMap().entries.map((entry) {
                    final idx = entry.key + 1;
                    final it = entry.value;
                    return pw.TableRow(
                      decoration: pw.BoxDecoration(
                        color: idx % 2 == 0
                            ? PdfColors.grey50
                            : PdfColors.white,
                      ),
                      children: [
                        _td('$idx', align: pw.TextAlign.center),
                        _td(it.product),
                        _td(it.hsn.isNotEmpty ? it.hsn : '-'),
                        _td(
                          '${it.qty.toStringAsFixed(it.qty.truncateToDouble() == it.qty ? 0 : 2)} ${it.unit}',
                        ),
                        _td(
                          it.price.toStringAsFixed(2),
                          align: pw.TextAlign.right,
                        ),
                        _td('${it.gst.toStringAsFixed(0)}%'),
                        _td(
                          it.totalWithTax.toStringAsFixed(2),
                          align: pw.TextAlign.right,
                        ),
                      ],
                    );
                  }),
                ],
              ),
              pw.SizedBox(height: 16),

              // Summary Box
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.end,
                children: [
                  pw.Container(
                    width: 240,
                    padding: const pw.EdgeInsets.all(12),
                    decoration: pw.BoxDecoration(
                      border: pw.TableBorder.all(
                        color: PdfColors.grey300,
                        width: 0.5,
                      ),
                      borderRadius: pw.BorderRadius.circular(6),
                      color: PdfColors.grey50,
                    ),
                    child: pw.Column(
                      children: [
                        _summaryRow(
                          'Taxable Amount:',
                          currencyFormat.format(invoice.subtotal),
                        ),
                        pw.SizedBox(height: 4),
                        _summaryRow(
                          'Total GST Tax:',
                          currencyFormat.format(invoice.taxAmount),
                        ),
                        pw.Divider(
                          color: PdfColors.grey400,
                          thickness: 0.5,
                          height: 12,
                        ),
                        _summaryRow(
                          'Total Invoice Amount:',
                          currencyFormat.format(invoice.totalAmount),
                          isBold: true,
                          color: primaryColor,
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              pw.Spacer(),

              // Footer
              pw.Divider(color: PdfColors.grey300, thickness: 0.5),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(
                    'This is a computer generated invoice and needs no physical signature.',
                    style: const pw.TextStyle(
                      fontSize: 8,
                      color: PdfColors.grey500,
                    ),
                  ),
                  pw.Text(
                    'Authorized Signatory',
                    style: pw.TextStyle(
                      fontSize: 9,
                      fontWeight: pw.FontWeight.bold,
                      color: darkColor,
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }

  static Future<void> printOrShareQuotation(QuotationModel quotation) async {
    final bytes = await generateQuotationPdf(quotation);
    await Printing.sharePdf(
      bytes: bytes,
      filename: 'quotation-${quotation.estimateId}.pdf',
    );
  }

  static Future<void> printQuotation(QuotationModel quotation) async {
    final bytes = await generateQuotationPdf(quotation);
    await Printing.layoutPdf(
      onLayout: (format) async => bytes,
      name: 'quotation-${quotation.estimateId}.pdf',
    );
  }

  static Future<void> shareQuotation(QuotationModel quotation) async {
    final bytes = await generateQuotationPdf(quotation);
    await Printing.sharePdf(
      bytes: bytes,
      filename: 'quotation-${quotation.estimateId}.pdf',
    );
  }

  static Future<void> printOrShareInvoice(InvoiceModel invoice) async {
    final bytes = await generateInvoicePdf(invoice);
    await Printing.sharePdf(
      bytes: bytes,
      filename: 'invoice-${invoice.invoiceId.replaceAll('/', '-')}.pdf',
    );
  }

  static Future<void> printInvoice(InvoiceModel invoice) async {
    final bytes = await generateInvoicePdf(invoice);
    await Printing.layoutPdf(
      onLayout: (format) async => bytes,
      name: 'invoice-${invoice.invoiceId.replaceAll('/', '-')}.pdf',
    );
  }

  static Future<void> shareInvoice(InvoiceModel invoice) async {
    final bytes = await generateInvoicePdf(invoice);
    await Printing.sharePdf(
      bytes: bytes,
      filename: 'invoice-${invoice.invoiceId.replaceAll('/', '-')}.pdf',
    );
  }

  static pw.Widget _th(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          color: PdfColors.white,
          fontSize: 8,
          fontWeight: pw.FontWeight.bold,
        ),
      ),
    );
  }

  static pw.Widget _td(String text, {pw.TextAlign align = pw.TextAlign.left}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 6),
      child: pw.Text(
        text,
        textAlign: align,
        style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey900),
      ),
    );
  }

  static pw.Widget _summaryRow(
    String label,
    String value, {
    bool isBold = false,
    PdfColor color = PdfColors.black,
  }) {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Text(
          label,
          style: pw.TextStyle(
            fontSize: isBold ? 10 : 9,
            fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
            color: color,
          ),
        ),
        pw.Text(
          value,
          style: pw.TextStyle(
            fontSize: isBold ? 11 : 9,
            fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
            color: color,
          ),
        ),
      ],
    );
  }
}
