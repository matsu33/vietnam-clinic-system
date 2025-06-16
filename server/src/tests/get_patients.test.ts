
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { getPatients } from '../handlers/get_patients';

describe('getPatients', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no patients exist', async () => {
    const result = await getPatients();
    
    expect(result).toEqual([]);
  });

  it('should return all patients', async () => {
    // Create test patients
    await db.insert(patientsTable)
      .values([
        {
          full_name: 'John Doe',
          date_of_birth: '1990-01-15',
          gender: 'male',
          address: '123 Main St',
          phone_number: '555-0101',
          insurance_information: 'Health Insurance Co'
        },
        {
          full_name: 'Jane Smith',
          date_of_birth: '1985-05-20',
          gender: 'female',
          address: '456 Oak Ave',
          phone_number: null,
          insurance_information: null
        }
      ])
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(2);
    
    // Verify first patient
    expect(result[0].full_name).toEqual('John Doe');
    expect(result[0].date_of_birth).toBeInstanceOf(Date);
    expect(result[0].date_of_birth.getFullYear()).toEqual(1990);
    expect(result[0].gender).toEqual('male');
    expect(result[0].address).toEqual('123 Main St');
    expect(result[0].phone_number).toEqual('555-0101');
    expect(result[0].insurance_information).toEqual('Health Insurance Co');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second patient
    expect(result[1].full_name).toEqual('Jane Smith');
    expect(result[1].date_of_birth).toBeInstanceOf(Date);
    expect(result[1].date_of_birth.getFullYear()).toEqual(1985);
    expect(result[1].gender).toEqual('female');
    expect(result[1].address).toEqual('456 Oak Ave');
    expect(result[1].phone_number).toBeNull();
    expect(result[1].insurance_information).toBeNull();
  });

  it('should handle multiple patients with different data types', async () => {
    // Create patient with all nullable fields set to null
    await db.insert(patientsTable)
      .values({
        full_name: 'Test Patient',
        date_of_birth: '2000-12-31',
        gender: 'other',
        address: '789 Test Blvd',
        phone_number: null,
        insurance_information: null
      })
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toEqual('Test Patient');
    expect(result[0].gender).toEqual('other');
    expect(result[0].phone_number).toBeNull();
    expect(result[0].insurance_information).toBeNull();
    expect(result[0].date_of_birth).toBeInstanceOf(Date);
    expect(result[0].date_of_birth.getDate()).toEqual(31);
    expect(result[0].date_of_birth.getMonth()).toEqual(11); // December is month 11
  });
});
