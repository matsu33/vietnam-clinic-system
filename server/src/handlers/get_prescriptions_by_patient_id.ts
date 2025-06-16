
import { db } from '../db';
import { prescriptionsTable } from '../db/schema';
import { type GetPrescriptionsByPatientIdInput, type Prescription } from '../schema';
import { eq } from 'drizzle-orm';

export const getPrescriptionsByPatientId = async (input: GetPrescriptionsByPatientIdInput): Promise<Prescription[]> => {
  try {
    const results = await db.select()
      .from(prescriptionsTable)
      .where(eq(prescriptionsTable.patient_id, input.patient_id))
      .execute();

    return results.map(prescription => ({
      ...prescription,
      patient_date_of_birth: new Date(prescription.patient_date_of_birth),
      date_of_issue: prescription.date_of_issue,
      created_at: prescription.created_at,
      updated_at: prescription.updated_at
    }));
  } catch (error) {
    console.error('Failed to get prescriptions by patient ID:', error);
    throw error;
  }
};
