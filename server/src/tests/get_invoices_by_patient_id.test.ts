
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, invoicesTable } from '../db/schema';
import { type GetInvoicesByPatientIdInput } from '../schema';
import { getInvoicesByPatientId } from '../handlers/get_invoices_by_patient_id';

// Test patient data - using string for date_of_birth to match database schema
const testPatient = {
  full_name: 'John Doe',
  date_of_birth: '1990-01-01',
  gender: 'male' as const,
  address: '123 Main St',
  phone_number: '555-0123',
  insurance_information: 'Health Insurance Co.'
};

describe('getInvoicesByPatientId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return invoices for a patient', async () => {
    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values(testPatient)
      .returning()
      .execute();
    const patient = patientResult[0];

    // Create test invoices
    await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-001',
          invoice_code: 'CODE-001',
          patient_id: patient.id,
          seller_clinic_name: 'Test Clinic',
          seller_tax_id: '123456789',
          seller_address: '456 Clinic St',
          seller_phone: '555-0456',
          buyer_full_name: 'John Doe',
          buyer_address: '123 Main St',
          buyer_tax_code: 'TAX123',
          total_amount_before_tax: '100.00',
          total_vat: '10.00',
          total_payable_amount: '110.00',
          payment_method: 'cash'
        },
        {
          invoice_number: 'INV-002',
          invoice_code: 'CODE-002',
          patient_id: patient.id,
          seller_clinic_name: 'Test Clinic',
          seller_tax_id: '123456789',
          seller_address: '456 Clinic St',
          seller_phone: '555-0456',
          buyer_full_name: 'John Doe',
          buyer_address: '123 Main St',
          buyer_tax_code: 'TAX123',
          total_amount_before_tax: '200.00',
          total_vat: '20.00',
          total_payable_amount: '220.00',
          payment_method: 'card'
        }
      ])
      .execute();

    const input: GetInvoicesByPatientIdInput = {
      patient_id: patient.id
    };

    const result = await getInvoicesByPatientId(input);

    expect(result).toHaveLength(2);
    
    // Verify first invoice
    expect(result[0].invoice_number).toEqual('INV-001');
    expect(result[0].patient_id).toEqual(patient.id);
    expect(result[0].total_amount_before_tax).toEqual(100.00);
    expect(result[0].total_vat).toEqual(10.00);
    expect(result[0].total_payable_amount).toEqual(110.00);
    expect(result[0].payment_method).toEqual('cash');
    expect(typeof result[0].total_amount_before_tax).toBe('number');

    // Verify second invoice
    expect(result[1].invoice_number).toEqual('INV-002');
    expect(result[1].patient_id).toEqual(patient.id);
    expect(result[1].total_amount_before_tax).toEqual(200.00);
    expect(result[1].total_vat).toEqual(20.00);
    expect(result[1].total_payable_amount).toEqual(220.00);
    expect(result[1].payment_method).toEqual('card');
    expect(typeof result[1].total_payable_amount).toBe('number');
  });

  it('should return empty array for patient with no invoices', async () => {
    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values(testPatient)
      .returning()
      .execute();
    const patient = patientResult[0];

    const input: GetInvoicesByPatientIdInput = {
      patient_id: patient.id
    };

    const result = await getInvoicesByPatientId(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent patient', async () => {
    const input: GetInvoicesByPatientIdInput = {
      patient_id: 999999
    };

    const result = await getInvoicesByPatientId(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return invoices for specified patient', async () => {
    // Create two test patients
    const patient1Result = await db.insert(patientsTable)
      .values({
        ...testPatient,
        full_name: 'Patient One'
      })
      .returning()
      .execute();
    const patient1 = patient1Result[0];

    const patient2Result = await db.insert(patientsTable)
      .values({
        ...testPatient,
        full_name: 'Patient Two'
      })
      .returning()
      .execute();
    const patient2 = patient2Result[0];

    // Create invoices for both patients
    await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-P1-001',
          invoice_code: 'CODE-P1-001',
          patient_id: patient1.id,
          seller_clinic_name: 'Test Clinic',
          seller_tax_id: '123456789',
          seller_address: '456 Clinic St',
          seller_phone: '555-0456',
          buyer_full_name: 'Patient One',
          buyer_address: '123 Main St',
          buyer_tax_code: 'TAX123',
          total_amount_before_tax: '100.00',
          total_vat: '10.00',
          total_payable_amount: '110.00',
          payment_method: 'cash'
        },
        {
          invoice_number: 'INV-P2-001',
          invoice_code: 'CODE-P2-001',
          patient_id: patient2.id,
          seller_clinic_name: 'Test Clinic',
          seller_tax_id: '123456789',
          seller_address: '456 Clinic St',
          seller_phone: '555-0456',
          buyer_full_name: 'Patient Two',
          buyer_address: '456 Oak Ave',
          buyer_tax_code: 'TAX456',
          total_amount_before_tax: '200.00',
          total_vat: '20.00',
          total_payable_amount: '220.00',
          payment_method: 'card'
        }
      ])
      .execute();

    const input: GetInvoicesByPatientIdInput = {
      patient_id: patient1.id
    };

    const result = await getInvoicesByPatientId(input);

    expect(result).toHaveLength(1);
    expect(result[0].invoice_number).toEqual('INV-P1-001');
    expect(result[0].patient_id).toEqual(patient1.id);
    expect(result[0].buyer_full_name).toEqual('Patient One');
  });
});
