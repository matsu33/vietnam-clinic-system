
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput } from '../schema';
import { createPatient } from '../handlers/create_patient';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreatePatientInput = {
  full_name: 'John Doe',
  date_of_birth: new Date('1990-01-15'),
  gender: 'male',
  address: '123 Main Street, City, State 12345',
  phone_number: '+1234567890',
  insurance_information: 'Blue Cross Blue Shield - Policy #12345',
};

describe('createPatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a patient with all fields', async () => {
    const result = await createPatient(testInput);

    // Verify all fields are set correctly
    expect(result.full_name).toEqual('John Doe');
    expect(result.date_of_birth).toEqual(new Date('1990-01-15'));
    expect(result.gender).toEqual('male');
    expect(result.address).toEqual('123 Main Street, City, State 12345');
    expect(result.phone_number).toEqual('+1234567890');
    expect(result.insurance_information).toEqual('Blue Cross Blue Shield - Policy #12345');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a patient with nullable fields set to null', async () => {
    const inputWithNulls: CreatePatientInput = {
      full_name: 'Jane Smith',
      date_of_birth: new Date('1985-06-20'),
      gender: 'female',
      address: '456 Oak Avenue, Town, State 67890',
      phone_number: null,
      insurance_information: null,
    };

    const result = await createPatient(inputWithNulls);

    expect(result.full_name).toEqual('Jane Smith');
    expect(result.date_of_birth).toEqual(new Date('1985-06-20'));
    expect(result.gender).toEqual('female');
    expect(result.address).toEqual('456 Oak Avenue, Town, State 67890');
    expect(result.phone_number).toBeNull();
    expect(result.insurance_information).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save patient to database', async () => {
    const result = await createPatient(testInput);

    // Query the database to verify the patient was saved
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, result.id))
      .execute();

    expect(patients).toHaveLength(1);
    expect(patients[0].full_name).toEqual('John Doe');
    expect(patients[0].date_of_birth).toEqual('1990-01-15'); // Database stores as string
    expect(patients[0].gender).toEqual('male');
    expect(patients[0].address).toEqual('123 Main Street, City, State 12345');
    expect(patients[0].phone_number).toEqual('+1234567890');
    expect(patients[0].insurance_information).toEqual('Blue Cross Blue Shield - Policy #12345');
    expect(patients[0].created_at).toBeInstanceOf(Date);
    expect(patients[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different gender options', async () => {
    const testInputs = [
      { ...testInput, gender: 'male' as const },
      { ...testInput, gender: 'female' as const },
      { ...testInput, gender: 'other' as const },
    ];

    for (const input of testInputs) {
      const result = await createPatient(input);
      expect(result.gender).toEqual(input.gender);
    }
  });

  it('should set timestamps automatically', async () => {
    const beforeCreation = new Date();
    const result = await createPatient(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle date conversion correctly', async () => {
    const testDate = new Date('1995-12-25');
    const input: CreatePatientInput = {
      ...testInput,
      date_of_birth: testDate,
    };

    const result = await createPatient(input);

    // Check that the returned date matches the input date
    expect(result.date_of_birth).toEqual(testDate);
    expect(result.date_of_birth).toBeInstanceOf(Date);

    // Verify the database stores it as a string in correct format
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, result.id))
      .execute();

    expect(patients[0].date_of_birth).toEqual('1995-12-25');
  });
});
