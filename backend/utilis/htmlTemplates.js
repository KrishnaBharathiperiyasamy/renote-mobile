// quotationTemplate.js
function numberToWords(num) {
  if (isNaN(num) || num <= 0) return "Zero Rupees Only";
  const roundedTotal = Math.round(num);
  const rupees = Math.floor(roundedTotal);
  const paise = Math.round((num - Math.floor(num)) * 100);

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
  }

  let result = inWords(rupees) + " Rupees";
  if (paise > 0) {
    result += " and " + inWords(paise) + " Paise";
  }
  return result + " Only";
}

export const generateQuotationHTML = ({
  quotation,
  company,
  customer,
  products,
  hasGST,
  subtotal,
  gstTotal,
  grandTotal,
  formatCard,
  formattedDate,
  formattedTime,
  logoDataUrl
}) => {
  const validTill = new Date();
  validTill.setDate(validTill.getDate() + 10);
  const formattedValidTill = validTill.toLocaleDateString("en-IN");
  const roundedGrandTotal = Math.round(grandTotal);
  const roundOff = roundedGrandTotal - grandTotal;
  const rawId = quotation.estimateID || quotation._id || "E2610002";
  const displayId = String(rawId).replace(/^#/, "").replace(/^E\/?/, "E").replace(/[-\/]/g, "") || "E2610002";

  return `
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #111827; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #ffffff; }

          .invoice-wrapper { padding: 24px 32px 20px; position: relative; max-width: 900px; margin: 0 auto; }

          /* ── Header ── */
          .header { display: flex; justify-content: space-between; align-items: flex-start; }
          .company-name { font-size: 16px; font-weight: 700; color: #111827; }
          .company-sub { font-size: 10.5px; color: #6b7280; margin-top: 2px; line-height: 1.35; }
          .header-right { text-align: right; }
          .invoice-title { font-size: 20px; font-weight: 900; color: #FF5722; letter-spacing: -0.5px; line-height: 1; text-transform: uppercase; }
          .invoice-id { font-size: 11px; font-weight: 700; color: #111827; margin-top: 3px; font-family: monospace; }
          .invoice-date { font-size: 10px; color: #6b7280; margin-top: 2px; }
          .invoice-date strong { color: #374151; font-weight: 700; }

          /* Divider */
          .orange-divider { height: 2px; background: #FF5722; width: 100%; margin: 10px 0 14px; border-radius: 9999px; }

          /* ── Estimate To Box ── */
          .estimate-to-box { background: #FFFBF8; border: 1px solid #FED7AA; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
          .party-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #FF5722; margin-bottom: 4px; }
          .party-name { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 2px; }
          .party-detail { font-size: 12px; color: #6b7280; line-height: 1.5; }

          /* ── Table ── */
          table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
          thead th { background: #FF5722; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; }
          thead th.right { text-align: right; }
          thead th.center { text-align: center; }
          tbody td { padding: 12px 12px; font-size: 12px; vertical-align: middle; border-bottom: 1px solid #f3f4f6; color: #374151; }
          td.right { text-align: right; }
          td.center { text-align: center; }
          td.amount { font-weight: 700; color: #111827; }
          td.desc { color: #111827; font-weight: 400; }
          .table-bottom-bar { height: 2.5px; background: #FF5722; width: 100%; }

          /* ── Totals & Words ── */
          .financials-section { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 14px; margin-bottom: 24px; }
          .words-container { flex: 1; max-width: 360px; }
          .words-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #374151; letter-spacing: 0.5px; margin-bottom: 6px; }
          .words-box { border: 1px solid #FED7AA; background: #FFFBF8; border-radius: 8px; padding: 10px 14px; font-size: 12px; font-weight: 700; color: #111827; display: inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
          .totals-box { width: 260px; }
          .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; color: #4b5563; }
          .total-row span:last-child { font-weight: 700; color: #111827; }
          .total-row.grand { padding-top: 6px; font-size: 16px; color: #111827; }
          .total-row.grand span:first-child { font-weight: 700; }
          .total-row.grand span:last-child { font-weight: 800; }
          .totals-divider { height: 1.5px; background: #FF5722; width: 100%; margin: 6px 0; }

          /* ── Terms & Signature ── */
          .terms-signature-section { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 16px; border-top: 1px solid #E5E7EB; margin-bottom: 16px; }
          .terms { flex: 1; max-width: 60%; }
          .terms-title { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 4px; }
          .terms-text { font-size: 10.5px; color: #6b7280; line-height: 1.5; }
          .signature-box { text-align: center; width: 180px; }
          .sig-line { width: 180px; border-bottom: 1px solid #9ca3af; margin: 0 auto 6px; }
          .sig-label { font-size: 10px; color: #6b7280; }

          /* ── Footer Banner ── */
          .footer-banner { background: #FF5722; color: #ffffff; text-align: center; padding: 10px 0; border-radius: 6px; font-size: 13px; font-weight: 700; letter-spacing: 0.3px; }
        </style>
      </head>

      <body>
        <div class="invoice-wrapper">

          <!-- Header -->
          <div class="header">
            <div>
              <div class="company-name">${company.name || "Param Systems"}</div>
              <div class="company-sub">${company.address || "Saravanampatti, Coimbatore"}</div>
              <div class="company-sub">${company.phone || "9092024443"}</div>
              ${company.email ? `<div class="company-sub">${company.email}</div>` : ""}
              ${company.gstNo ? `<div class="company-sub" style="font-weight:600;color:#374151;">GSTIN: ${company.gstNo}</div>` : ""}
            </div>
            <div class="header-right">
              <div class="invoice-title">ESTIMATE</div>
              <div class="invoice-id">#${displayId}</div>
              <div class="invoice-date"><strong>Date :</strong> ${formattedDate || "22/10/2026"}</div>
              <div class="invoice-date"><strong>Valid Till :</strong> ${formattedValidTill || "01/11/2026"}</div>
            </div>
          </div>

          <!-- Divider -->
          <div class="orange-divider"></div>

          <!-- Estimate To -->
          <div class="estimate-to-box">
            <div class="party-label">ESTIMATE TO</div>
            <div class="party-name">${customer.name || "Breeks Memorial Higher Secondary School"}</div>
            <div class="party-detail">${customer.address || "Wenlock Rd, Upper Bazar"}</div>
            <div class="party-detail">${customer.phoneNumber || customer.phone || "9750019199"}</div>
            ${customer.gstNo ? `<div class="party-detail" style="font-weight:bold;color:#FF5722;margin-top:2px;">GSTIN: ${customer.gstNo}</div>` : ""}
          </div>

          <!-- Products Table -->
          <table>
            <thead>
              <tr>
                <th class="center" style="width:50px;">SL.</th>
                <th>DESCRIPTION</th>
                <th class="right" style="width:110px;">PRICE</th>
                <th class="center" style="width:60px;">QTY</th>
                <th class="center" style="width:80px;">UNIT</th>
                <th class="right" style="width:130px;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${products.map((p, i) => {
                const amount = p.price * p.quantity;
                return `
                  <tr>
                    <td class="center" style="font-weight:500;">${String(i + 1).padStart(2, "0")}</td>
                    <td class="desc">${p.name}</td>
                    <td class="right">₹${Number(p.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="center">${p.quantity}</td>
                    <td class="center" style="text-transform:uppercase;">${p.unit || "BKT"}</td>
                    <td class="right amount">₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>`;
              }).join("")}
            </tbody>
          </table>
          <div class="table-bottom-bar"></div>

          <!-- Financials and Amount in Words -->
          <div class="financials-section">
            <div class="words-container">
              <div class="words-label">AMOUNT IN WORDS:</div>
              <div class="words-box">${numberToWords(roundedGrandTotal)}</div>
            </div>
            <div class="totals-box">
              <div class="total-row"><span>Taxable Value</span><span>₹ ${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div class="total-row"><span>Round Off</span><span>₹ ${roundOff >= 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}</span></div>
              ${hasGST ? `<div class="total-row"><span>GST Total</span><span style="color:#FF5722;">₹ ${gstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
              <div class="totals-divider"></div>
              <div class="total-row grand"><span>Total</span><span>₹ ${roundedGrandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            </div>
          </div>

          <!-- Terms & Signature -->
          <div class="terms-signature-section">
            <div class="terms">
              <div class="terms-title">Terms &amp; Conditions</div>
              <div class="terms-text">This estimate is valid for 10 days from the date of issue. Prices are subject to change after the validity period.</div>
            </div>
            <div class="signature-box">
              <div class="sig-line"></div>
              <div class="sig-label">Authorised Signature</div>
            </div>
          </div>

          <!-- Bottom Banner -->
          <div class="footer-banner">
            Thank you for your interest
          </div>

        </div>
      </body>
    </html>
  `;
};

export const generateInvoiceHTML = ({ 
  invoice, company, customer, products, hasGST, hasHSN, 
  subtotal, gstTotal, grandTotal, formatCard, 
  formattedDate, formattedTime, logoDataUrl, qrCodeDataUrl 
}) => {
  const validTill = new Date();
  validTill.setDate(validTill.getDate() + 10);
  const formattedValidTill = validTill.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });

  const fromState = (company.gstNo || "").substring(0, 2);
  const toState = (customer.gstNo || "").substring(0, 2);
  const isInterState = Boolean(fromState && toState && fromState !== toState);

  const rawGstTotal = hasGST
    ? products.reduce((acc, p) => acc + (p.price * p.quantity * (p.gst || 0)) / 100, 0)
    : 0;

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let roundedGstTotal = 0;

  if (hasGST) {
    if (isInterState) {
      igstAmount = Math.round(rawGstTotal);
      roundedGstTotal = igstAmount;
    } else {
      const halfGst = rawGstTotal / 2;
      cgstAmount = Math.round(halfGst);
      sgstAmount = cgstAmount;
      roundedGstTotal = cgstAmount + sgstAmount;
    }
  }

  const unroundedTotal = subtotal + roundedGstTotal;
  const finalGrandTotal = Math.round(unroundedTotal);
  const roundOff = finalGrandTotal - unroundedTotal;

  const nonZeroGstRates = Array.from(new Set(products.map(p => p.gst || 0).filter(g => g > 0)));
  const gstRateLabel = nonZeroGstRates.length === 1 ? ` (${nonZeroGstRates[0]}%)` : nonZeroGstRates.length > 1 ? ` (${nonZeroGstRates.join("%, ")}%)` : "";
  const halfGstRateLabel = nonZeroGstRates.length === 1 ? ` (${nonZeroGstRates[0] / 2}%)` : nonZeroGstRates.length > 1 ? ` (${nonZeroGstRates.map(g => g / 2).join("%, ")}%)` : "";

  // HSN Breakdown
  const hsnSummaryMap = new Map();
  products.forEach((p) => {
    const hsn = (p.hsn || "-").toString().trim() || "-";
    const price = p.price || 0;
    const qty = p.quantity || 0;
    const gstRate = hasGST ? (p.gst || 0) : 0;
    const taxableVal = price * qty;
    const taxAmt = (taxableVal * gstRate) / 100;
    const centralTaxAmt = taxAmt / 2;
    const stateTaxAmt = taxAmt / 2;

    const key = `${hsn}_${gstRate}`;
    if (hsnSummaryMap.has(key)) {
      const existing = hsnSummaryMap.get(key);
      existing.taxableValue += taxableVal;
      existing.taxAmount += taxAmt;
      existing.centralTaxAmount += centralTaxAmt;
      existing.stateTaxAmount += stateTaxAmt;
    } else {
      hsnSummaryMap.set(key, {
        hsn,
        gstRate,
        taxableValue: taxableVal,
        centralTaxAmount: centralTaxAmt,
        stateTaxAmount: stateTaxAmt,
        taxAmount: taxAmt,
      });
    }
  });
  const hsnSummaryList = Array.from(hsnSummaryMap.values());

  const invoiceIdDisplay = invoice.invoiceID || invoice._id;
  const isMultiPage = products.length > 5;
  const page1Products = isMultiPage ? products.slice(0, 5) : products;
  const page2Products = isMultiPage ? products.slice(5) : [];

  return `
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; color: #111827; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          .invoice-wrapper { padding: 20px 24px; position: relative; max-width: 800px; margin: 0 auto; }
          .page-break { page-break-after: always; break-after: page; }

          /* Top Banner */
          .top-banner { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 10px; }
          .copy-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 4px; padding: 2px 8px; }
          .invoice-no-center { font-size: 14px; font-weight: 800; color: #111827; letter-spacing: 0.3px; text-align: center; }
          .invoice-no-highlight { font-weight: 900; color: #ea580c; }
          .page-tag { font-size: 11px; font-weight: 600; color: #6b7280; margin-left: 6px; }

          /* Header */
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid #f97316; gap: 12px; }
          .header-left { display: flex; align-items: flex-start; gap: 12px; }
          .company-logo { width: 56px; height: 56px; object-fit: contain; border-radius: 6px; }
          .company-name { font-size: 18px; font-weight: 700; color: #111827; }
          .verified-badge { display: inline-flex; align-items: center; background: #d1fae5; color: #047857; font-size: 10px; font-weight: 600; border-radius: 9999px; padding: 2px 8px; margin-left: 6px; }
          .company-sub { font-size: 11px; color: #6b7280; margin-top: 2px; line-height: 1.4; }
          .header-right { text-align: right; }
          .tax-title { font-size: 24px; font-weight: 900; color: #f97316; letter-spacing: -0.5px; text-transform: uppercase; }
          .invoice-meta { font-size: 11px; color: #6b7280; margin-top: 4px; line-height: 1.6; }
          .invoice-meta strong { color: #1f2937; }

          /* Billed To */
          .billed-to { margin-bottom: 12px; }
          .party-card { display: inline-block; min-width: 240px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 14px; }
          .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #f97316; margin-bottom: 4px; }
          .party-name { font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 2px; }
          .party-detail { font-size: 11px; color: #4b5563; line-height: 1.5; }
          .party-gst { font-size: 11px; color: #ea580c; font-weight: 500; margin-top: 2px; }

          /* Product Table */
          .table-wrapper { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          thead th { background: #f97316; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 6px 10px; }
          thead th.center { text-align: center; }
          thead th.right { text-align: right; }
          tbody td { padding: 6px 10px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #374151; }
          tbody tr:hover { background: #f9fafb; }
          td.center { text-align: center; }
          td.right { text-align: right; }
          td.sl { color: #6b7280; font-weight: 500; width: 32px; text-align: center; }
          td.prod-desc { max-width: 220px; color: #111827; font-weight: 400; }

          .continuation-bar { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; color: #ea580c; font-weight: 700; font-size: 11px; margin-top: 12px; }

          /* Totals Section */
          .totals-flex { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px; margin-bottom: 12px; gap: 12px; }
          .amount-words-box { max-width: 55%; }
          .words-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #374151; margin-bottom: 4px; letter-spacing: 0.5px; }
          .words-content { font-size: 11px; font-weight: 600; color: #111827; background: #fff7ed; border: 1px solid #ffedd5; border-radius: 6px; padding: 8px 10px; line-height: 1.4; }

          .totals-table { min-width: 240px; }
          .totals-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #4b5563; }
          .totals-row.grand { border-top: 2px solid #f97316; margin-top: 4px; padding-top: 6px; font-size: 14px; font-weight: 700; color: #111827; }

          /* HSN Breakdown */
          .hsn-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #374151; margin-bottom: 4px; }
          .hsn-table { width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; margin-bottom: 12px; font-size: 10px; }
          .hsn-table th { border: 1px solid #d1d5db; background: #f3f4f6; color: #1f2937; padding: 4px 6px; font-weight: 600; text-align: center; }
          .hsn-table td { border: 1px solid #d1d5db; padding: 3px 6px; color: #374151; }
          .hsn-table tr.total-row { background: #f9fafb; font-weight: 700; color: #111827; }

          /* Payment & QR */
          .payment-section { display: flex; justify-content: space-between; align-items: flex-start; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-bottom: 12px; gap: 12px; }
          .payment-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #f97316; margin-bottom: 2px; }
          .payment-detail { font-size: 11px; color: #4b5563; line-height: 1.5; }
          .payment-detail strong { color: #1f2937; }
          .qr-box { text-align: center; flex-shrink: 0; }
          .qr-img { width: 70px; height: 70px; }
          .qr-sub { font-size: 9px; color: #9ca3af; margin-top: 2px; }

          /* Terms & Sig */
          .terms-section { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-bottom: 12px; gap: 12px; }
          .terms-box { max-width: 55%; }
          .terms-title { font-size: 10px; font-weight: 700; color: #374151; margin-bottom: 2px; }
          .terms-text { font-size: 9px; color: #6b7280; line-height: 1.4; }
          .sig-box { text-align: center; min-width: 130px; }
          .sig-line { width: 120px; border-bottom: 1px solid #9ca3af; height: 28px; margin: 0 auto 4px; }
          .sig-label { font-size: 9px; color: #6b7280; font-weight: 500; }

          /* Footer */
          .footer { background: #f97316; color: #ffffff; text-align: center; padding: 6px; border-radius: 0 0 6px 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; }
        </style>
      </head>

      <body>
        <!-- PAGE 1 -->
        <div class="invoice-wrapper ${isMultiPage ? 'page-break' : ''}">
          <div class="top-banner">
            <div class="copy-badge">ORIGINAL FOR RECIPIENT</div>
            <div class="invoice-no-center">INVOICE NO: <span class="invoice-no-highlight">${invoiceIdDisplay}</span>${isMultiPage ? '<span class="page-tag">(Page 1 of 2)</span>' : ''}</div>
            <div></div>
          </div>

          <div class="header">
            <div class="header-left">
              ${logoDataUrl ? `<img src="${logoDataUrl}" class="company-logo" alt="logo" />` : ""}
              <div>
                <div>
                  <span class="company-name">${company.name || ""}</span>
                  <span class="verified-badge">Verified</span>
                </div>
                ${company.address ? `<div class="company-sub">${company.address}${company.city ? ", " + company.city : ""}</div>` : ""}
                ${company.phone ? `<div class="company-sub">${company.phone}${company.email ? " &middot; " + company.email : ""}</div>` : ""}
                ${company.gstNo ? `<div class="company-sub" style="color:#ea580c;font-weight:500;">GSTIN: ${company.gstNo}</div>` : ""}
                ${company.panNo ? `<div class="company-sub" style="color:#374151;font-weight:600;">PAN: ${company.panNo}</div>` : ""}
              </div>
            </div>
            <div class="header-right">
              <div class="tax-title">Tax Invoice</div>
              <div class="invoice-meta">
                <div><strong>Date :</strong> ${formattedDate}</div>
                <div><strong>Due Date :</strong> ${formattedValidTill}</div>
              </div>
            </div>
          </div>

          ${Object.keys(customer).length > 0
            ? `<div class="billed-to">
                 <div class="party-card">
                   <div class="party-label">Billed To</div>
                   <div class="party-name">${customer.name || ""}</div>
                   <div class="party-detail">
                     ${customer.address ? customer.address + "<br/>" : ""}
                     ${customer.city ? customer.city + "<br/>" : ""}
                     ${customer.phoneNumber || customer.phone || ""}${customer.email ? " &middot; " + customer.email : ""}
                   </div>
                   ${customer.gstNo ? `<div class="party-gst">GSTIN: ${customer.gstNo}</div>` : ""}
                 </div>
               </div>`
            : ""
          }

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th class="center" style="width:32px;">SL.</th>
                  <th>Description</th>
                  <th class="center">HSN</th>
                  <th class="center">Qty</th>
                  <th class="center">Unit</th>
                  <th class="right">Rate</th>
                  <th class="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${page1Products.map((p, i) => {
                  const amount = (p.price || 0) * (p.quantity || 0);
                  return `
                    <tr>
                      <td class="sl">${String(i + 1).padStart(2, "0")}</td>
                      <td class="prod-desc">${p.name || p.product || ""}</td>
                      <td class="center">${p.hsn || "-"}</td>
                      <td class="center">${p.quantity || 0}</td>
                      <td class="center">${p.unit || "-"}</td>
                      <td class="right">₹${Number(p.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td class="right" style="font-weight:600;color:#111827;">₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>`;
                }).join("")}
              </tbody>
            </table>
          </div>

          ${isMultiPage ? `
            <div class="continuation-bar">
              <span>Invoice Continuation</span>
              <span>Continued on Page 2 &rarr;</span>
            </div>` : ""
          }
        </div>

        <!-- PAGE 2 (If items > 5) -->
        ${isMultiPage ? `
          <div class="invoice-wrapper">
            <div class="top-banner">
              <div class="copy-badge">ORIGINAL FOR RECIPIENT</div>
              <div class="invoice-no-center">INVOICE NO: <span class="invoice-no-highlight">${invoiceIdDisplay}</span> <span class="page-tag">(Page 2 of 2)</span></div>
              <div></div>
            </div>

            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th class="center" style="width:32px;">SL.</th>
                    <th>Description (Continued)</th>
                    <th class="center">HSN</th>
                    <th class="center">Qty</th>
                    <th class="center">Unit</th>
                    <th class="right">Rate</th>
                    <th class="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${page2Products.map((p, i) => {
                    const amount = (p.price || 0) * (p.quantity || 0);
                    return `
                      <tr>
                        <td class="sl">${String(i + 6).padStart(2, "0")}</td>
                        <td class="prod-desc">${p.name || p.product || ""}</td>
                        <td class="center">${p.hsn || "-"}</td>
                        <td class="center">${p.quantity || 0}</td>
                        <td class="center">${p.unit || "-"}</td>
                        <td class="right">₹${Number(p.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="right" style="font-weight:600;color:#111827;">₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>`;
                  }).join("")}
                </tbody>
              </table>
            </div>` : ""
        }

        <!-- Totals & Amount in Words -->
        <div class="totals-flex">
          <div class="amount-words-box">
            <div class="words-label">Amount in Words:</div>
            <div class="words-content">${numberToWords(finalGrandTotal)}</div>
          </div>

          <div class="totals-table">
            <div class="totals-row">
              <span>Taxable Value</span>
              <span>₹ ${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            ${hasGST ? (
              isInterState ? `
                <div class="totals-row">
                  <span>IGST${gstRateLabel}</span>
                  <span>₹ ${igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>` : `
                <div class="totals-row">
                  <span>CGST${halfGstRateLabel}</span>
                  <span>₹ ${cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="totals-row">
                  <span>SGST${halfGstRateLabel}</span>
                  <span>₹ ${sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>`
            ) : ""}
            ${Math.abs(roundOff) > 0.0001 ? `
              <div class="totals-row">
                <span>Round Off</span>
                <span>₹ ${roundOff >= 0 ? "+" + roundOff.toFixed(2) : roundOff.toFixed(2)}</span>
              </div>` : ""
            }
            <div class="totals-row grand">
              <span>Total</span>
              <span>₹ ${finalGrandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <!-- HSN/SAC Tax Breakdown Table -->
        ${hasGST && hsnSummaryList.length > 0 ? `
          <div class="hsn-title">HSN/SAC Tax Breakdown</div>
          <table class="hsn-table">
            <thead>
              <tr>
                <th rowspan="2" style="vertical-align:middle;">HSN/SAC</th>
                <th rowspan="2" style="vertical-align:middle;text-align:right;">Taxable Value</th>
                ${isInterState ? `
                  <th colspan="2">Integrated Tax</th>` : `
                  <th colspan="2">Central Tax</th>
                  <th colspan="2">State Tax</th>`
                }
                <th rowspan="2" style="vertical-align:middle;text-align:right;">Total Tax Amount</th>
              </tr>
              <tr>
                ${isInterState ? `
                  <th>Rate</th><th style="text-align:right;">Amount</th>` : `
                  <th>Rate</th><th style="text-align:right;">Amount</th>
                  <th>Rate</th><th style="text-align:right;">Amount</th>`
                }
              </tr>
            </thead>
            <tbody>
              ${hsnSummaryList.map(item => `
                <tr>
                  <td style="text-align:center;font-weight:500;">${item.hsn}</td>
                  <td style="text-align:right;">₹${item.taxableValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  ${isInterState ? `
                    <td style="text-align:center;">${item.gstRate}%</td>
                    <td style="text-align:right;">₹${item.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>` : `
                    <td style="text-align:center;">${item.gstRate / 2}%</td>
                    <td style="text-align:right;">₹${item.centralTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align:center;">${item.gstRate / 2}%</td>
                    <td style="text-align:right;">₹${item.stateTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`
                  }
                  <td style="text-align:right;font-weight:600;">₹${item.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>`).join("")
              }
              <tr class="total-row">
                <td style="text-align:right;">Total</td>
                <td style="text-align:right;">₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                ${isInterState ? `
                  <td style="text-align:center;">—</td>
                  <td style="text-align:right;">₹${roundedGstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>` : `
                  <td style="text-align:center;">—</td>
                  <td style="text-align:right;">₹${cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style="text-align:center;">—</td>
                  <td style="text-align:right;">₹${sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`
                }
                <td style="text-align:right;">₹${roundedGstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>` : ""
        }

        <!-- Payment Info & QR -->
        ${company.upiId ? `
          <div class="payment-section">
            <div>
              <div class="payment-title">Payment Info</div>
              <div class="payment-detail">
                <div><strong>UPI ID :</strong> ${company.upiId}</div>
                <div><strong>Pay to :</strong> ${company.name || ""}</div>
              </div>
            </div>
            ${qrCodeDataUrl ? `
              <div class="qr-box">
                <img src="${qrCodeDataUrl}" class="qr-img" alt="UPI QR" />
                <div class="qr-sub">Scan to pay via UPI</div>
              </div>` : ""
            }
          </div>` : ""
        }

        <!-- Terms & Signature -->
        <div class="terms-section">
          <div class="terms-box">
            <div class="terms-title">Terms & Conditions</div>
            <div class="terms-text">Payment is due within 10 days of invoice date. Please include the invoice number in your payment reference.</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">Authorised Signature</div>
          </div>
        </div>

        ${isMultiPage ? '</div>' : ''}

        <!-- Footer -->
        <div class="footer">
          Thank you for your business
        </div>

      </body>
    </html>
  `;
};


