
import { type GetPrescriptionWithMedicationsInput, type Prescription, type Medication } from '../schema';

export interface PrescriptionWithMedications extends Prescription {
  medications: Medication[];
}

export declare function getPrescriptionWithMedications(input: GetPrescriptionWithMedicationsInput): Promise<PrescriptionWithMedications | null>;
