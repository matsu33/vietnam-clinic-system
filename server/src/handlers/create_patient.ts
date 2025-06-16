
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput, type Patient } from '../schema';

export const createPatient = async (input: CreatePatientInput): Promise<Patient> => {
  try {
    // Insert patient record - convert Date to string for date column
    const result = await db.insert(patientsTable)
      .values({
        full_name: input.full_name,
        date_of_birth: input.date_of_birth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        gender: input.gender,
        address: input.address,
        phone_number: input.phone_number,
        insurance_information: input.insurance_information,
      })
      .returning()
      .execute();

    // Convert date string back to Date object for return
    const patient = result[0];
    return {
      ...patient,
      date_of_birth: new Date(patient.date_of_birth), // Convert string back to Date
    };
  } catch (error) {
    console.error('Patient creation failed:', error);
    throw error;
  }
};
