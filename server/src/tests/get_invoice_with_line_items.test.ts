
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, invoicesTable, invoiceLineItemsTable } from '../db/schema';
import { type GetInvoiceWithLineItemsInput } from '../schema';
import { getInvoiceWithLineItems } from '../handlers/get_invoice_with_line_items';

describe('getInvoiceWithLineItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent invoice', async () => {
    const input: GetInvoiceWithLineItemsInput = { id: 999 };
    const result = await getInvoiceWithLineItems(input);
    expect(result).toBeNull();
  });

  it('should return invoice with line items', async () => {
    // Create a patient first
    const patientResult = await db.insert(patientsTable)
      .values({
        full_name: 'John Doe',
        date_of_birth: '1990-01-01',
        gender: 'male',
        address: '123 Main St',
        phone_number: '555-0123',
        insurance_information: 'Insurance ABC',
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create an invoice
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        invoice_code: 'CODE-001',
        patient_id: patientId,
        seller_clinic_name: 'Health Clinic',
        seller_tax_id: 'TAX123',
        seller_address: '456 Clinic St',
        seller_phone: '555-0456',
        buyer_full_name: 'John Doe',
        buyer_address: '123 Main St',
        buyer_tax_code: 'BUYER123',
        total_amount_before_tax: '100.00',
        total_vat: '10.00',
        total_payable_amount: '110.00',
        payment_method: 'cash',
        digital_signature: 'signature123',
        qr_code: 'qr123',
      })
      .returning()
      .execute();

    const invoiceId = invoiceResult[0].id;

    // Create line items
    await db.insert(invoiceLineItemsTable)
      .values([
        {
          invoice_id: invoiceId,
          description: 'Medical Consultation',
          quantity: '1.00',
          unit_price: '50.00',
          line_amount: '50.00',
          vat_rate: '0.1000',
          vat_amount: '5.00',
        },
        {
          invoice_id: invoiceId,
          description: 'Medicine',
          quantity: '2.00',
          unit_price: '25.00',
          line_amount: '50.00',
          vat_rate: '0.1000',
          vat_amount: '5.00',
        },
      ])
      .execute();

    const input: GetInvoiceWithLineItemsInput = { id: invoiceId };
    const result = await getInvoiceWithLineItems(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(invoiceId);
    expect(result!.invoice_number).toEqual('INV-001');
    expect(result!.invoice_code).toEqual('CODE-001');
    expect(result!.patient_id).toEqual(patientId);
    expect(result!.seller_clinic_name).toEqual('Health Clinic');
    expect(result!.total_amount_before_tax).toEqual(100.00);
    expect(result!.total_vat).toEqual(10.00);
    expect(result!.total_payable_amount).toEqual(110.00);
    expect(result!.payment_method).toEqual('cash');
    expect(result!.digital_signature).toEqual('signature123');
    expect(result!.qr_code).toEqual('qr123');

    // Verify line items
    expect(result!.lineItems).toHaveLength(2);
    
    const firstLineItem = result!.lineItems[0];
    expect(firstLineItem.description).toEqual('Medical Consultation');
    expect(firstLineItem.quantity).toEqual(1.00);
    expect(firstLineItem.unit_price).toEqual(50.00);
    expect(firstLineItem.line_amount).toEqual(50.00);
    expect(firstLineItem.vat_rate).toEqual(0.1000);
    expect(firstLineItem.vat_amount).toEqual(5.00);

    const secondLineItem = result!.lineItems[1];
    expect(secondLineItem.description).toEqual('Medicine');
    expect(secondLineItem.quantity).toEqual(2.00);
    expect(secondLineItem.unit_price).toEqual(25.00);
    expect(secondLineItem.line_amount).toEqual(50.00);
    expect(secondLineItem.vat_rate).toEqual(0.1000);
    expect(secondLineItem.vat_amount).toEqual(5.00);
  });

  it('should return invoice with empty line items array when no line items exist', async () => {
    // Create a patient first
    const patientResult = await db.insert(patientsTable)
      .values({
        full_name: 'Jane Smith',
        date_of_birth: '1985-05-15',
        gender: 'female',
        address: '789 Oak Ave',
        phone_number: '555-0789',
        insurance_information: null,
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create an invoice without line items
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-002',
        invoice_code: 'CODE-002',
        patient_id: patientId,
        seller_clinic_name: 'Another Clinic',
        seller_tax_id: 'TAX456',
        seller_address: '789 Clinic Ave',
        seller_phone: '555-0789',
        buyer_full_name: 'Jane Smith',
        buyer_address: null,
        buyer_tax_code: null,
        total_amount_before_tax: '0.00',
        total_vat: '0.00',
        total_payable_amount: '0.00',
        payment_method: 'credit_card',
        digital_signature: null,
        qr_code: null,
      })
      .returning()
      .execute();

    const invoiceId = invoiceResult[0].id;

    const input: GetInvoiceWithLineItemsInput = { id: invoiceId };
    const result = await getInvoiceWithLineItems(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(invoiceId);
    expect(result!.invoice_number).toEqual('INV-002');
    expect(result!.lineItems).toHaveLength(0);
    expect(result!.total_amount_before_tax).toEqual(0.00);
    expect(result!.total_vat).toEqual(0.00);
    expect(result!.total_payable_amount).toEqual(0.00);
  });
});
