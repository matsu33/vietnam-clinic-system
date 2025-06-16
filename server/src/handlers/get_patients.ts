
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type Patient } from '../schema';

export const getPatients = async (): Promise<Patient[]> => {
  try {
    const results = await db.select()
      .from(patientsTable)
      .execute();

    return results.map(patient => ({
      ...patient,
      date_of_birth: new Date(patient.date_of_birth),
      created_at: patient.created_at,
      updated_at: patient.updated_at
    }));
  } catch (error) {
    console.error('Failed to get patients:', error);
    throw error;
  }
};
