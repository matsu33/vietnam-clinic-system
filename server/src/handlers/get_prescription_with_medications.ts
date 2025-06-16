
import { db } from '../db';
import { prescriptionsTable, medicationsTable } from '../db/schema';
import { type GetPrescriptionWithMedicationsInput, type Prescription, type Medication } from '../schema';
import { eq } from 'drizzle-orm';

export interface PrescriptionWithMedications extends Prescription {
  medications: Medication[];
}

export const getPrescriptionWithMedications = async (input: GetPrescriptionWithMedicationsInput): Promise<PrescriptionWithMedications | null> => {
  try {
    // Get prescription with medications using join
    const results = await db.select()
      .from(prescriptionsTable)
      .leftJoin(medicationsTable, eq(prescriptionsTable.id, medicationsTable.prescription_id))
      .where(eq(prescriptionsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Group medications by prescription
    const prescriptionData = results[0].prescriptions;
    const medications: Medication[] = results
      .filter(result => result.medications !== null)
      .map(result => result.medications!);

    // Convert date strings to Date objects for the schema
    return {
      ...prescriptionData,
      patient_date_of_birth: new Date(prescriptionData.patient_date_of_birth),
      medications
    };
  } catch (error) {
    console.error('Failed to get prescription with medications:', error);
    throw error;
  }
};
