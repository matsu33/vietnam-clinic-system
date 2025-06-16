
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { prescriptionsTable, medicationsTable, patientsTable } from '../db/schema';
import { type CreatePrescriptionInput } from '../schema';
import { createPrescription } from '../handlers/create_prescription';
import { eq } from 'drizzle-orm';

describe('createPrescription', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPatientId: number;

  beforeEach(async () => {
    // Create a test patient first
    const patientResult = await db.insert(patientsTable)
      .values({
        full_name: 'John Doe',
        date_of_birth: '1985-06-15',
        gender: 'male',
        address: '123 Main St, City, State',
        phone_number: '555-1234',
        insurance_information: 'Insurance ABC',
      })
      .returning()
      .execute();

    testPatientId = patientResult[0].id;
  });

  const testInput: CreatePrescriptionInput = {
    patient_id: 0, // Will be set in tests
    diagnosis: 'Hypertension',
    icd_10_code: 'I10',
    doctor_name: 'Dr. Smith',
    doctor_qualification: 'MD, Cardiology',
    clinic_name: 'City Medical Center',
    clinic_code: 'CMC001',
    digital_signature: 'digital_signature_hash',
    additional_notes: 'Follow up in 2 weeks',
    medications: [
      {
        medicine_name: 'Lisinopril',
        strength: '10mg',
        dosage_form: 'tablet',
        dosage: '1 tablet',
        frequency: 'once daily',
        duration: '30 days',
        quantity: '30',
        instruction: 'Take with water in the morning',
      },
      {
        medicine_name: 'Metformin',
        strength: '500mg',
        dosage_form: 'tablet',
        dosage: '1 tablet',
        frequency: 'twice daily',
        duration: '30 days',
        quantity: '60',
        instruction: 'Take with meals',
      },
    ],
  };

  it('should create a prescription with patient data', async () => {
    const input = { ...testInput, patient_id: testPatientId };
    const result = await createPrescription(input);

    // Basic field validation
    expect(result.patient_id).toEqual(testPatientId);
    expect(result.patient_full_name).toEqual('John Doe');
    expect(result.patient_date_of_birth).toBeInstanceOf(Date);
    expect(result.patient_age).toBeGreaterThan(0);
    expect(result.gender).toEqual('male');
    expect(result.address).toEqual('123 Main St, City, State');
    expect(result.diagnosis).toEqual('Hypertension');
    expect(result.icd_10_code).toEqual('I10');
    expect(result.doctor_name).toEqual('Dr. Smith');
    expect(result.doctor_qualification).toEqual('MD, Cardiology');
    expect(result.clinic_name).toEqual('City Medical Center');
    expect(result.clinic_code).toEqual('CMC001');
    expect(result.digital_signature).toEqual('digital_signature_hash');
    expect(result.additional_notes).toEqual('Follow up in 2 weeks');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save prescription to database', async () => {
    const input = { ...testInput, patient_id: testPatientId };
    const result = await createPrescription(input);

    const prescriptions = await db.select()
      .from(prescriptionsTable)
      .where(eq(prescriptionsTable.id, result.id))
      .execute();

    expect(prescriptions).toHaveLength(1);
    expect(prescriptions[0].patient_id).toEqual(testPatientId);
    expect(prescriptions[0].diagnosis).toEqual('Hypertension');
    expect(prescriptions[0].doctor_name).toEqual('Dr. Smith');
  });

  it('should create associated medications', async () => {
    const input = { ...testInput, patient_id: testPatientId };
    const result = await createPrescription(input);

    const medications = await db.select()
      .from(medicationsTable)
      .where(eq(medicationsTable.prescription_id, result.id))
      .execute();

    expect(medications).toHaveLength(2);
    
    // Check first medication
    const lisinopril = medications.find(m => m.medicine_name === 'Lisinopril');
    expect(lisinopril).toBeDefined();
    expect(lisinopril!.strength).toEqual('10mg');
    expect(lisinopril!.dosage_form).toEqual('tablet');
    expect(lisinopril!.frequency).toEqual('once daily');
    expect(lisinopril!.instruction).toEqual('Take with water in the morning');

    // Check second medication
    const metformin = medications.find(m => m.medicine_name === 'Metformin');
    expect(metformin).toBeDefined();
    expect(metformin!.strength).toEqual('500mg');
    expect(metformin!.frequency).toEqual('twice daily');
    expect(metformin!.instruction).toEqual('Take with meals');
  });

  it('should calculate patient age correctly', async () => {
    const input = { ...testInput, patient_id: testPatientId };
    const result = await createPrescription(input);

    // Patient born in 1985, should be around 38-39 years old
    expect(result.patient_age).toBeGreaterThan(35);
    expect(result.patient_age).toBeLessThan(45);
  });

  it('should throw error for non-existent patient', async () => {
    const input = { ...testInput, patient_id: 99999 };
    
    await expect(createPrescription(input)).rejects.toThrow(/Patient with id 99999 not found/i);
  });

  it('should handle nullable fields correctly', async () => {
    const inputWithNulls = {
      ...testInput,
      patient_id: testPatientId,
      icd_10_code: null,
      digital_signature: null,
      additional_notes: null,
    };

    const result = await createPrescription(inputWithNulls);

    expect(result.icd_10_code).toBeNull();
    expect(result.digital_signature).toBeNull();
    expect(result.additional_notes).toBeNull();
  });
});
