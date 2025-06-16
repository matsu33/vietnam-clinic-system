
import { db } from '../db';
import { prescriptionsTable, medicationsTable, patientsTable } from '../db/schema';
import { type CreatePrescriptionInput, type Prescription } from '../schema';
import { eq } from 'drizzle-orm';

export const createPrescription = async (input: CreatePrescriptionInput): Promise<Prescription> => {
  try {
    // First, verify the patient exists
    const patient = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, input.patient_id))
      .execute();

    if (patient.length === 0) {
      throw new Error(`Patient with id ${input.patient_id} not found`);
    }

    const patientData = patient[0];

    // Calculate patient age from date of birth
    const today = new Date();
    const birthDate = new Date(patientData.date_of_birth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

    // Insert prescription record
    const prescriptionResult = await db.insert(prescriptionsTable)
      .values({
        patient_id: input.patient_id,
        patient_full_name: patientData.full_name,
        patient_date_of_birth: patientData.date_of_birth,
        patient_age: finalAge,
        gender: patientData.gender,
        address: patientData.address,
        diagnosis: input.diagnosis,
        icd_10_code: input.icd_10_code,
        doctor_name: input.doctor_name,
        doctor_qualification: input.doctor_qualification,
        clinic_name: input.clinic_name,
        clinic_code: input.clinic_code,
        digital_signature: input.digital_signature,
        additional_notes: input.additional_notes,
      })
      .returning()
      .execute();

    const prescription = prescriptionResult[0];

    // Insert medication records
    const medicationValues = input.medications.map(medication => ({
      prescription_id: prescription.id,
      medicine_name: medication.medicine_name,
      strength: medication.strength,
      dosage_form: medication.dosage_form,
      dosage: medication.dosage,
      frequency: medication.frequency,
      duration: medication.duration,
      quantity: medication.quantity,
      instruction: medication.instruction,
    }));

    await db.insert(medicationsTable)
      .values(medicationValues)
      .execute();

    // Convert date string to Date object for return type
    return {
      ...prescription,
      patient_date_of_birth: new Date(prescription.patient_date_of_birth),
    };
  } catch (error) {
    console.error('Prescription creation failed:', error);
    throw error;
  }
};
