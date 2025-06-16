
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type UpdatePatientInput, type Patient } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePatient = async (input: UpdatePatientInput): Promise<Patient> => {
  try {
    // Extract id and build update data
    const { id, ...updateData } = input;
    
    // Only include defined fields in the update
    const fieldsToUpdate: any = {};
    if (updateData.full_name !== undefined) fieldsToUpdate.full_name = updateData.full_name;
    if (updateData.date_of_birth !== undefined) {
      // Convert Date to string for date column
      fieldsToUpdate.date_of_birth = updateData.date_of_birth.toISOString().split('T')[0];
    }
    if (updateData.gender !== undefined) fieldsToUpdate.gender = updateData.gender;
    if (updateData.address !== undefined) fieldsToUpdate.address = updateData.address;
    if (updateData.phone_number !== undefined) fieldsToUpdate.phone_number = updateData.phone_number;
    if (updateData.insurance_information !== undefined) fieldsToUpdate.insurance_information = updateData.insurance_information;
    
    // Always update the updated_at timestamp
    fieldsToUpdate.updated_at = new Date();

    // Update patient record
    const result = await db.update(patientsTable)
      .set(fieldsToUpdate)
      .where(eq(patientsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Patient with id ${id} not found`);
    }

    // Convert date string back to Date object for return
    const patient = result[0];
    return {
      ...patient,
      date_of_birth: new Date(patient.date_of_birth)
    };
  } catch (error) {
    console.error('Patient update failed:', error);
    throw error;
  }
};
