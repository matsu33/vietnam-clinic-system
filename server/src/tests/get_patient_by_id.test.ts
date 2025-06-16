
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type GetPatientByIdInput } from '../schema';
import { getPatientById } from '../handlers/get_patient_by_id';

// Test patient data
const testPatientData = {
  full_name: 'John Doe',
  date_of_birth: '1990-05-15',
  gender: 'male' as const,
  address: '123 Main St, City, State',
  phone_number: '+1234567890',
  insurance_information: 'Health Insurance Co.',
};

describe('getPatientById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return patient when found', async () => {
    // Create a test patient
    const insertResult = await db.insert(patientsTable)
      .values(testPatientData)
      .returning()
      .execute();
    
    const createdPatient = insertResult[0];

    // Test the handler
    const input: GetPatientByIdInput = { id: createdPatient.id };
    const result = await getPatientById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPatient.id);
    expect(result!.full_name).toEqual('John Doe');
    expect(result!.gender).toEqual('male');
    expect(result!.address).toEqual('123 Main St, City, State');
    expect(result!.phone_number).toEqual('+1234567890');
    expect(result!.insurance_information).toEqual('Health Insurance Co.');
    
    // Verify date fields are properly converted to Date objects
    expect(result!.date_of_birth).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify date values are correct
    expect(result!.date_of_birth.toISOString().split('T')[0]).toEqual('1990-05-15');
  });

  it('should return null when patient not found', async () => {
    const input: GetPatientByIdInput = { id: 999 };
    const result = await getPatientById(input);

    expect(result).toBeNull();
  });

  it('should handle patient with null optional fields', async () => {
    // Create patient with minimal data (null optional fields)
    const minimalPatientData = {
      full_name: 'Jane Smith',
      date_of_birth: '1985-12-25',
      gender: 'female' as const,
      address: '456 Oak Ave, Town, State',
      phone_number: null,
      insurance_information: null,
    };

    const insertResult = await db.insert(patientsTable)
      .values(minimalPatientData)
      .returning()
      .execute();
    
    const createdPatient = insertResult[0];

    // Test the handler
    const input: GetPatientByIdInput = { id: createdPatient.id };
    const result = await getPatientById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPatient.id);
    expect(result!.full_name).toEqual('Jane Smith');
    expect(result!.gender).toEqual('female');
    expect(result!.address).toEqual('456 Oak Ave, Town, State');
    expect(result!.phone_number).toBeNull();
    expect(result!.insurance_information).toBeNull();
    
    // Verify date fields
    expect(result!.date_of_birth).toBeInstanceOf(Date);
    expect(result!.date_of_birth.toISOString().split('T')[0]).toEqual('1985-12-25');
  });
});
