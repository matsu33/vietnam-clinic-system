
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { invoicesTable, invoiceLineItemsTable, patientsTable } from '../db/schema';
import { type CreateInvoiceInput } from '../schema';
import { createInvoice } from '../handlers/create_invoice';
import { eq } from 'drizzle-orm';

// Test input for invoice creation
const testInput: CreateInvoiceInput = {
  invoice_code: 'TEST-001',
  patient_id: null,
  seller_clinic_name: 'Test Clinic',
  seller_tax_id: '1234567890',
  seller_address: '123 Clinic St, Medical City',
  seller_phone: '+1-555-0123',
  buyer_full_name: 'John Doe',
  buyer_address: '456 Patient Ave, Health Town',
  buyer_tax_code: '0987654321',
  payment_method: 'Cash',
  digital_signature: 'test-signature',
  line_items: [
    {
      description: 'Consultation Fee',
      quantity: 1,
      unit_price: 100.00,
      vat_rate: 0.10,
    },
    {
      description: 'Medication',
      quantity: 2,
      unit_price: 25.50,
      vat_rate: 0.05,
    },
  ],
};

describe('createInvoice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an invoice with calculated totals', async () => {
    const result = await createInvoice(testInput);

    // Basic field validation
    expect(result.invoice_code).toEqual('TEST-001');
    expect(result.seller_clinic_name).toEqual('Test Clinic');
    expect(result.buyer_full_name).toEqual('John Doe');
    expect(result.payment_method).toEqual('Cash');
    expect(result.id).toBeDefined();
    expect(result.invoice_number).toBeDefined();
    expect(result.invoice_issue_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Total calculations validation
    // Line 1: 1 * 100.00 = 100.00, VAT: 100.00 * 0.10 = 10.00
    // Line 2: 2 * 25.50 = 51.00, VAT: 51.00 * 0.05 = 2.55
    // Total before tax: 100.00 + 51.00 = 151.00
    // Total VAT: 10.00 + 2.55 = 12.55
    // Total payable: 151.00 + 12.55 = 163.55
    expect(result.total_amount_before_tax).toEqual(151.00);
    expect(result.total_vat).toEqual(12.55);
    expect(result.total_payable_amount).toEqual(163.55);

    // Verify numeric types
    expect(typeof result.total_amount_before_tax).toBe('number');
    expect(typeof result.total_vat).toBe('number');
    expect(typeof result.total_payable_amount).toBe('number');
  });

  it('should save invoice to database', async () => {
    const result = await createInvoice(testInput);

    // Query invoice from database
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, result.id))
      .execute();

    expect(invoices).toHaveLength(1);
    const savedInvoice = invoices[0];
    
    expect(savedInvoice.invoice_code).toEqual('TEST-001');
    expect(savedInvoice.seller_clinic_name).toEqual('Test Clinic');
    expect(parseFloat(savedInvoice.total_amount_before_tax)).toEqual(151.00);
    expect(parseFloat(savedInvoice.total_vat)).toEqual(12.55);
    expect(parseFloat(savedInvoice.total_payable_amount)).toEqual(163.55);
  });

  it('should create line items for the invoice', async () => {
    const result = await createInvoice(testInput);

    // Query line items from database
    const lineItems = await db.select()
      .from(invoiceLineItemsTable)
      .where(eq(invoiceLineItemsTable.invoice_id, result.id))
      .execute();

    expect(lineItems).toHaveLength(2);

    // Verify first line item
    const firstItem = lineItems.find(item => item.description === 'Consultation Fee');
    expect(firstItem).toBeDefined();
    expect(parseFloat(firstItem!.quantity)).toEqual(1);
    expect(parseFloat(firstItem!.unit_price)).toEqual(100.00);
    expect(parseFloat(firstItem!.line_amount)).toEqual(100.00);
    expect(parseFloat(firstItem!.vat_rate)).toEqual(0.10);
    expect(parseFloat(firstItem!.vat_amount)).toEqual(10.00);

    // Verify second line item
    const secondItem = lineItems.find(item => item.description === 'Medication');
    expect(secondItem).toBeDefined();
    expect(parseFloat(secondItem!.quantity)).toEqual(2);
    expect(parseFloat(secondItem!.unit_price)).toEqual(25.50);
    expect(parseFloat(secondItem!.line_amount)).toEqual(51.00);
    expect(parseFloat(secondItem!.vat_rate)).toEqual(0.05);
    expect(parseFloat(secondItem!.vat_amount)).toEqual(2.55);
  });

  it('should create invoice with patient reference', async () => {
    // Create a test patient first
    const patientResult = await db.insert(patientsTable)
      .values({
        full_name: 'Test Patient',
        date_of_birth: '1990-01-01',
        gender: 'male',
        address: '789 Test St',
        phone_number: '+1-555-9999',
        insurance_information: 'Test Insurance',
      })
      .returning()
      .execute();

    const patient = patientResult[0];

    const inputWithPatient = {
      ...testInput,
      patient_id: patient.id,
    };

    const result = await createInvoice(inputWithPatient);

    expect(result.patient_id).toEqual(patient.id);

    // Verify in database
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, result.id))
      .execute();

    expect(invoices[0].patient_id).toEqual(patient.id);
  });

  it('should generate unique invoice numbers', async () => {
    const result1 = await createInvoice(testInput);
    const result2 = await createInvoice({
      ...testInput,
      invoice_code: 'TEST-002',
    });

    expect(result1.invoice_number).toBeDefined();
    expect(result2.invoice_number).toBeDefined();
    expect(result1.invoice_number).not.toEqual(result2.invoice_number);
    
    // Both should start with 'INV-'
    expect(result1.invoice_number.startsWith('INV-')).toBe(true);
    expect(result2.invoice_number.startsWith('INV-')).toBe(true);
  });
});
