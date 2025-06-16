
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, prescriptionsTable, medicationsTable } from '../db/schema';
import { type GetPrescriptionWithMedicationsInput } from '../schema';
import { getPrescriptionWithMedications } from '../handlers/get_prescription_with_medications';

// Test data - using string format for date_of_birth to match database schema
const testPatient = {
  full_name: 'John Doe',
  date_of_birth: '1990-01-01',
  gender: 'male' as const,
  address: '123 Main St',
  phone_number: '555-0123',
  insurance_information: 'Health Insurance Co.'
};

describe('getPrescriptionWithMedications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return prescription with medications', async () => {
    // Create patient first
    const patientResult = await db.insert(patientsTable)
      .values(testPatient)
      .returning()
      .execute();
    const patient = patientResult[0];

    // Create prescription
    const prescriptionResult = await db.insert(prescriptionsTable)
      .values({
        patient_id: patient.id,
        patient_full_name: patient.full_name,
        patient_date_of_birth: patient.date_of_birth,
        patient_age: 34,
        gender: patient.gender,
        address: patient.address,
        diagnosis: 'Common cold',
        icd_10_code: 'J00',
        doctor_name: 'Dr. Smith',
        doctor_qualification: 'MD',
        clinic_name: 'Health Clinic',
        clinic_code: 'HC001',
        digital_signature: 'digital_sig_123',
        additional_notes: 'Take with food'
      })
      .returning()
      .execute();
    const prescription = prescriptionResult[0];

    // Create medications
    await db.insert(medicationsTable)
      .values([
        {
          prescription_id: prescription.id,
          medicine_name: 'Paracetamol',
          strength: '500mg',
          dosage_form: 'Tablet',
          dosage: '1 tablet',
          frequency: 'Twice daily',
          duration: '5 days',
          quantity: '10 tablets',
          instruction: 'Take after meals'
        },
        {
          prescription_id: prescription.id,
          medicine_name: 'Ibuprofen',
          strength: '200mg',
          dosage_form: 'Tablet',
          dosage: '1 tablet',
          frequency: 'Three times daily',
          duration: '3 days',
          quantity: '9 tablets',
          instruction: 'Take with water'
        }
      ])
      .execute();

    const input: GetPrescriptionWithMedicationsInput = { id: prescription.id };
    const result = await getPrescriptionWithMedications(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(prescription.id);
    expect(result!.patient_id).toEqual(patient.id);
    expect(result!.diagnosis).toEqual('Common cold');
    expect(result!.medications).toHaveLength(2);

    // Check medications
    const paracetamol = result!.medications.find(med => med.medicine_name === 'Paracetamol');
    expect(paracetamol).toBeDefined();
    expect(paracetamol!.strength).toEqual('500mg');
    expect(paracetamol!.frequency).toEqual('Twice daily');

    const ibuprofen = result!.medications.find(med => med.medicine_name === 'Ibuprofen');
    expect(ibuprofen).toBeDefined();
    expect(ibuprofen!.strength).toEqual('200mg');
    expect(ibuprofen!.frequency).toEqual('Three times daily');
  });

  it('should return prescription with empty medications array when no medications exist', async () => {
    // Create patient first
    const patientResult = await db.insert(patientsTable)
      .values(testPatient)
      .returning()
      .execute();
    const patient = patientResult[0];

    // Create prescription without medications
    const prescriptionResult = await db.insert(prescriptionsTable)
      .values({
        patient_id: patient.id,
        patient_full_name: patient.full_name,
        patient_date_of_birth: patient.date_of_birth,
        patient_age: 34,
        gender: patient.gender,
        address: patient.address,
        diagnosis: 'Routine checkup',
        doctor_name: 'Dr. Smith',
        doctor_qualification: 'MD',
        clinic_name: 'Health Clinic',
        clinic_code: 'HC001'
      })
      .returning()
      .execute();
    const prescription = prescriptionResult[0];

    const input: GetPrescriptionWithMedicationsInput = { id: prescription.id };
    const result = await getPrescriptionWithMedications(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(prescription.id);
    expect(result!.diagnosis).toEqual('Routine checkup');
    expect(result!.medications).toHaveLength(0);
  });

  it('should return null when prescription does not exist', async () => {
    const input: GetPrescriptionWithMedicationsInput = { id: 999 };
    const result = await getPrescriptionWithMedications(input);

    expect(result).toBeNull();
  });

  it('should include all prescription fields correctly', async () => {
    // Create patient first
    const patientResult = await db.insert(patientsTable)
      .values(testPatient)
      .returning()
      .execute();
    const patient = patientResult[0];

    // Create prescription with all fields
    const prescriptionResult = await db.insert(prescriptionsTable)
      .values({
        patient_id: patient.id,
        patient_full_name: patient.full_name,
        patient_date_of_birth: patient.date_of_birth,
        patient_age: 34,
        gender: patient.gender,
        address: patient.address,
        diagnosis: 'Hypertension',
        icd_10_code: 'I10',
        doctor_name: 'Dr. Johnson',
        doctor_qualification: 'MD, Cardiologist',
        clinic_name: 'Heart Health Clinic',
        clinic_code: 'HHC001',
        digital_signature: 'dr_johnson_sig_456',
        additional_notes: 'Monitor blood pressure regularly'
      })
      .returning()
      .execute();
    const prescription = prescriptionResult[0];

    const input: GetPrescriptionWithMedicationsInput = { id: prescription.id };
    const result = await getPrescriptionWithMedications(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(prescription.id);
    expect(result!.patient_id).toEqual(patient.id);
    expect(result!.patient_full_name).toEqual('John Doe');
    expect(result!.patient_date_of_birth).toEqual(new Date('1990-01-01'));
    expect(result!.patient_age).toEqual(34);
    expect(result!.gender).toEqual('male');
    expect(result!.address).toEqual('123 Main St');
    expect(result!.diagnosis).toEqual('Hypertension');
    expect(result!.icd_10_code).toEqual('I10');
    expect(result!.doctor_name).toEqual('Dr. Johnson');
    expect(result!.doctor_qualification).toEqual('MD, Cardiologist');
    expect(result!.clinic_name).toEqual('Heart Health Clinic');
    expect(result!.clinic_code).toEqual('HHC001');
    expect(result!.digital_signature).toEqual('dr_johnson_sig_456');
    expect(result!.additional_notes).toEqual('Monitor blood pressure regularly');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.date_of_issue).toBeInstanceOf(Date);
  });
});
