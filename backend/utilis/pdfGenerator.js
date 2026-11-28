// utils/pdfGenerator.js
import puppeteer from "puppeteer";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { generateQuotationHTML, generateInvoiceHTML } from "./htmlTemplates.js";

export const generateQuotationPDF = async (res, quotation) => {
  try {
    const company = quotation.company_id?.[0] || {};
    const customer = quotation.customers?.[0] || {};
    const products = quotation.products || [];
    const hasGST = products.some((p) => p.gst && p.gst > 0);
    const fileName = quotation.estimateID ? `quotation-${quotation.estimateID}.pdf` : `quotation-${quotation._id}.pdf`;
    const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const gstTotal = products.reduce((sum, p) => sum + (p.price * p.quantity * (p.gst || 0)) / 100, 0);
    const grandTotal = subtotal + gstTotal;
    const formatCard = (entity, requiredFields, fallback = "N/A") => {
      const values = requiredFields
        .map((f) => entity[f])
        .filter((val) => val && val.toString().trim());
      return values.length > 0 ? values.join("<br/>") : fallback;
    };
    const docDate = quotation.createdAt ? new Date(quotation.createdAt) : new Date();
    const formattedDate = docDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    const formattedTime = docDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata"
    });

    // Generate company logo data URL
    let logoDataUrl = null;
    if (company.logo) {
      try {
        const logoPath = path.isAbsolute(company.logo)
          ? company.logo
          : path.join(process.cwd(), company.logo);
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          const ext = path.extname(company.logo).slice(1).toLowerCase();
          const mimeMap = { png: "image/png", svg: "image/svg+xml", avif: "image/avif", webp: "image/webp", gif: "image/gif" };
          const mime = mimeMap[ext] || "image/jpeg";
          logoDataUrl = `data:${mime};base64,${logoBuffer.toString("base64")}`;
        }
      } catch (e) { /* skip logo on error */ }
    }

    const html = generateQuotationHTML({ quotation, company, customer, products, hasGST, subtotal, gstTotal, grandTotal, formatCard, formattedDate, formattedTime, logoDataUrl });
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluateHandle("document.fonts.ready");
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" }, });
    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: "Error generating PDF" });
  }
};

export const generateInvoicePDF = async (res, invoice) => {
  try {
    const company = invoice.company_id?.[0] || {};
    const customer = invoice.customers?.[0] || {};
    const products = invoice.products || [];
    const hasGST = products.some(p => p.gst && p.gst > 0);
    const hasHSN = products.some(p => p.hsn && p.hsn.trim() && p.hsn !== "0");
    const fileName = invoice.invoiceID ? `invoice-${invoice.invoiceID}.pdf` : `invoice-${invoice._id}.pdf`;
    const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const gstTotal = products.reduce((sum, p) => sum + (p.price * p.quantity * (p.gst || 0)) / 100, 0);
    const grandTotal = subtotal + gstTotal;
    const formatCard = (entity, fields, fallback = "N/A") => {
      const values = fields.map(f => entity[f]).filter(v => v && v.toString().trim());
      return values.length > 0 ? values.join("<br/>") : fallback;
    };
    const docDate = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
    const formattedDate = docDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    const formattedTime = docDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata"
    });

    // Generate company logo data URL
    let logoDataUrl = null;
    if (company.logo) {
      try {
        const logoPath = path.isAbsolute(company.logo)
          ? company.logo
          : path.join(process.cwd(), company.logo);
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          const ext = path.extname(company.logo).slice(1).toLowerCase();
          const mimeMap = { png: "image/png", svg: "image/svg+xml", avif: "image/avif", webp: "image/webp", gif: "image/gif" };
          const mime = mimeMap[ext] || "image/jpeg";
          logoDataUrl = `data:${mime};base64,${logoBuffer.toString("base64")}`;
        }
      } catch (e) { /* skip logo on error */ }
    }

    // Generate UPI QR code data URL
    let qrCodeDataUrl = null;
    if (company.upiId) {
      const upiString = `upi://pay?pa=${encodeURIComponent(company.upiId)}&pn=${encodeURIComponent(company.name || "")}&cu=INR`;
      qrCodeDataUrl = await QRCode.toDataURL(upiString, { width: 180, margin: 1 });
    }

    const html = generateInvoiceHTML({ invoice, company, customer, products, hasGST, hasHSN, subtotal, gstTotal, grandTotal, formatCard, formattedDate, formattedTime, logoDataUrl, qrCodeDataUrl });
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluateHandle("document.fonts.ready");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10px", bottom: "10px", left: "10px", right: "10px" },
    });
    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error generating PDF" });
  }
};
