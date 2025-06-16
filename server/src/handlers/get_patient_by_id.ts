
import { type GetPatientByIdInput, type Patient } from '../schema';

export declare function getPatientById(input: GetPatientByIdInput): Promise<Patient | null>;
