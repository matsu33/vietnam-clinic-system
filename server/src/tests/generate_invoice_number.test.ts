
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { generateInvoiceNumber } from '../handlers/generate_invoice_number';

describe('generateInvoiceNumber', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate first invoice number when no invoices exist', async () => {
    const invoiceNumber = await generateInvoiceNumber();

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const expectedPattern = `INV-${year}${month}${day}-0001`;

    expect(invoiceNumber).toEqual(expectedPattern);
  });

  it('should generate sequential invoice numbers', async () => {
    // Create first invoice manually
    await db.insert(invoicesTable).values({
      invoice_number: 'INV-20241201-0001',
      invoice_code: 'TEST001',
      patient_id: null,
      seller_clinic_name: 'Test Clinic',
      seller_tax_id: '123456789',
      seller_address: 'Test Address',
      seller_phone: '123456789',
      buyer_full_name: 'Test Buyer',
      buyer_address: null,
      buyer_tax_code: null,
      total_amount_before_tax: '100.00',
      total_vat: '10.00',
      total_payable_amount: '110.00',
      payment_method: 'cash',
      digital_signature: null,
      qr_code: null,
    }).execute();

    // Create second invoice manually
    await db.insert(invoicesTable).values({
      invoice_number: 'INV-20241201-0002',
      invoice_code: 'TEST002',
      patient_id: null,
      seller_clinic_name: 'Test Clinic',
      seller_tax_id: '123456789',
      seller_address: 'Test Address',
      seller_phone: '123456789',
      buyer_full_name: 'Test Buyer',
      buyer_address: null,
      buyer_tax_code: null,
      total_amount_before_tax: '100.00',
      total_vat: '10.00',
      total_payable_amount: '110.00',
      payment_method: 'cash',
      digital_signature: null,
      qr_code: null,
    }).execute();

    const nextInvoiceNumber = await generateInvoiceNumber();

    // Should increment from the latest invoice
    expect(nextInvoiceNumber).toMatch(/INV-\d{8}-0003$/);
  });

  it('should handle date format correctly in invoice number', async () => {
    const invoiceNumber = await generateInvoiceNumber();

    // Check format: INV-YYYYMMDD-NNNN
    const formatRegex = /^INV-\d{8}-\d{4}$/;
    expect(invoiceNumber).toMatch(formatRegex);

    // Extract and validate date part
    const datePart = invoiceNumber.substring(4, 12); // Extract YYYYMMDD
    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6));
    const day = parseInt(datePart.substring(6, 8));

    const currentDate = new Date();
    expect(year).toEqual(currentDate.getFullYear());
    expect(month).toEqual(currentDate.getMonth() + 1);
    expect(day).toEqual(currentDate.getDate());
  });

  it('should pad sequential number with zeros', async () => {
    const invoiceNumber = await generateInvoiceNumber();

    // Sequential number should be 4 digits with leading zeros
    const sequentialPart = invoiceNumber.substring(13); // Extract NNNN part
    expect(sequentialPart).toEqual('0001');
    expect(sequentialPart).toHaveLength(4);
  });
});
