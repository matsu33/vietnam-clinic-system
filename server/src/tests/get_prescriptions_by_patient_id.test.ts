
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, prescriptionsTable } from '../db/schema';
import { type GetPrescriptionsByPatientIdInput, type CreatePatientInput } from '../schema';
import { getPrescriptionsByPatientId } from '../handlers/get_prescriptions_by_patient_id';

const testPatient: CreatePatientInput = {
  full_name: 'John Doe',
  date_of_birth: new Date('1990-01-01'),
  gender: 'male',
  address: '123 Main St',
  phone_number: '555-0123',
  insurance_information: 'Insurance ABC'
};

const createTestPrescription = async (patientId: number, diagnosis: string) => {
  return await db.insert(prescriptionsTable)
    .values({
      patient_id: patientId,
      patient_full_name: testPatient.full_name,
      patient_date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0], // Convert Date to string
      patient_age: 33,
      gender: testPatient.gender,
      address: testPatient.address,
      diagnosis,
      icd_10_code: 'Z00.00',
      doctor_name: 'Dr. Smith',
      doctor_qualification: 'MD',
      clinic_name: 'Test Clinic',
      clinic_code: 'TC001',
      digital_signature: 'test_signature',
      additional_notes: 'Test notes'
    })
    .returning()
    .execute();
};

describe('getPrescriptionsByPatientId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return prescriptions for a patient', async () => {
    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        ...testPatient,
        date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0] // Convert Date to string
      })
      .returning()
      .execute();
    const patient = patientResult[0];

    // Create test prescriptions
    await createTestPrescription(patient.id, 'Hypertension');
    await createTestPrescription(patient.id, 'Diabetes');

    const input: GetPrescriptionsByPatientIdInput = {
      patient_id: patient.id
    };

    const result = await getPrescriptionsByPatientId(input);

    expect(result).toHaveLength(2);
    expect(result[0].patient_id).toEqual(patient.id);
    expect(result[0].patient_full_name).toEqual('John Doe');
    expect(result[0].diagnosis).toEqual('Hypertension');
    expect(result[0].doctor_name).toEqual('Dr. Smith');
    expect(result[0].clinic_name).toEqual('Test Clinic');
    expect(result[0].date_of_issue).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].patient_date_of_birth).toBeInstanceOf(Date);

    expect(result[1].patient_id).toEqual(patient.id);
    expect(result[1].diagnosis).toEqual('Diabetes');
  });

  it('should return empty array for patient with no prescriptions', async () => {
    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        ...testPatient,
        date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0] // Convert Date to string
      })
      .returning()
      .execute();
    const patient = patientResult[0];

    const input: GetPrescriptionsByPatientIdInput = {
      patient_id: patient.id
    };

    const result = await getPrescriptionsByPatientId(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent patient', async () => {
    const input: GetPrescriptionsByPatientIdInput = {
      patient_id: 999
    };

    const result = await getPrescriptionsByPatientId(input);

    expect(result).toHaveLength(0);
  });

  it('should only return prescriptions for specified patient', async () => {
    // Create two test patients
    const patient1Result = await db.insert(patientsTable)
      .values({
        ...testPatient,
        date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0] // Convert Date to string
      })
      .returning()
      .execute();
    const patient1 = patient1Result[0];

    const patient2Data = {
      ...testPatient,
      full_name: 'Jane Smith',
      phone_number: '555-0456'
    };
    const patient2Result = await db.insert(patientsTable)
      .values({
        ...patient2Data,
        date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0] // Convert Date to string
      })
      .returning()
      .execute();
    const patient2 = patient2Result[0];

    // Create prescriptions for both patients
    await createTestPrescription(patient1.id, 'Hypertension');
    await createTestPrescription(patient2.id, 'Diabetes');
    await createTestPrescription(patient1.id, 'Asthma');

    const input: GetPrescriptionsByPatientIdInput = {
      patient_id: patient1.id
    };

    const result = await getPrescriptionsByPatientId(input);

    expect(result).toHaveLength(2);
    result.forEach(prescription => {
      expect(prescription.patient_id).toEqual(patient1.id);
      expect(prescription.patient_full_name).toEqual('John Doe');
    });
  });
});
