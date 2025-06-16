
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type UpdatePatientInput } from '../schema';
import { updatePatient } from '../handlers/update_patient';
import { eq } from 'drizzle-orm';

// Test data for creating a patient first
const testPatientData = {
  full_name: 'John Doe',
  date_of_birth: '1990-01-01', // Use string for date column
  gender: 'male' as const,
  address: '123 Main St',
  phone_number: '555-1234',
  insurance_information: 'Insurance ABC'
};

describe('updatePatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a patient with all fields', async () => {
    // Create initial patient
    const createdPatient = await db.insert(patientsTable)
      .values(testPatientData)
      .returning()
      .execute();

    const patientId = createdPatient[0].id;

    // Update input
    const updateInput: UpdatePatientInput = {
      id: patientId,
      full_name: 'Jane Smith',
      date_of_birth: new Date('1985-05-15'),
      gender: 'female',
      address: '456 Oak Ave',
      phone_number: '555-9876',
      insurance_information: 'Insurance XYZ'
    };

    const result = await updatePatient(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(patientId);
    expect(result.full_name).toEqual('Jane Smith');
    expect(result.date_of_birth).toEqual(new Date('1985-05-15'));
    expect(result.gender).toEqual('female');
    expect(result.address).toEqual('456 Oak Ave');
    expect(result.phone_number).toEqual('555-9876');
    expect(result.insurance_information).toEqual('Insurance XYZ');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create initial patient
    const createdPatient = await db.insert(patientsTable)
      .values(testPatientData)
      .returning()
      .execute();

    const patientId = createdPatient[0].id;

    // Update only name and phone
    const updateInput: UpdatePatientInput = {
      id: patientId,
      full_name: 'Updated Name',
      phone_number: '555-0000'
    };

    const result = await updatePatient(updateInput);

    // Verify updated fields
    expect(result.full_name).toEqual('Updated Name');
    expect(result.phone_number).toEqual('555-0000');
    
    // Verify unchanged fields
    expect(result.date_of_birth).toEqual(new Date('1990-01-01'));
    expect(result.gender).toEqual('male');
    expect(result.address).toEqual('123 Main St');
    expect(result.insurance_information).toEqual('Insurance ABC');
  });

  it('should update nullable fields to null', async () => {
    // Create initial patient
    const createdPatient = await db.insert(patientsTable)
      .values(testPatientData)
      .returning()
      .execute();

    const patientId = createdPatient[0].id;

    // Update nullable fields to null
    const updateInput: UpdatePatientInput = {
      id: patientId,
      phone_number: null,
      insurance_information: null
    };

    const result = await updatePatient(updateInput);

    // Verify nullable fields are set to null
    expect(result.phone_number).toBeNull();
    expect(result.insurance_information).toBeNull();
    
    // Verify other fields unchanged
    expect(result.full_name).toEqual('John Doe');
    expect(result.address).toEqual('123 Main St');
  });

  it('should save updated patient to database', async () => {
    // Create initial patient
    const createdPatient = await db.insert(patientsTable)
      .values(testPatientData)
      .returning()
      .execute();

    const patientId = createdPatient[0].id;

    // Update patient
    const updateInput: UpdatePatientInput = {
      id: patientId,
      full_name: 'Database Test',
      address: 'New Address'
    };

    await updatePatient(updateInput);

    // Query database to verify changes
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, patientId))
      .execute();

    expect(patients).toHaveLength(1);
    expect(patients[0].full_name).toEqual('Database Test');
    expect(patients[0].address).toEqual('New Address');
    expect(patients[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when patient not found', async () => {
    const updateInput: UpdatePatientInput = {
      id: 99999,
      full_name: 'Non-existent Patient'
    };

    await expect(updatePatient(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update the updated_at timestamp', async () => {
    // Create initial patient
    const createdPatient = await db.insert(patientsTable)
      .values(testPatientData)
      .returning()
      .execute();

    const patientId = createdPatient[0].id;
    const originalUpdatedAt = createdPatient[0].updated_at;

    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update patient
    const updateInput: UpdatePatientInput = {
      id: patientId,
      full_name: 'Updated Name'
    };

    const result = await updatePatient(updateInput);

    // Verify updated_at timestamp changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
