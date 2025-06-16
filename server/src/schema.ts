
import { z } from 'zod';

// User role schema
export const userRoleSchema = z.enum(['admin', 'doctor', 'receptionist']);

// User schema (excluding password_hash)
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Login input schema
export const loginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Register input schema
export const registerInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  role: userRoleSchema.default('doctor'),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

// Patient schema
export const patientSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  date_of_birth: z.coerce.date(),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string(),
  phone_number: z.string().nullable(),
  insurance_information: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Patient = z.infer<typeof patientSchema>;

// Input schema for creating patients
export const createPatientInputSchema = z.object({
  full_name: z.string().min(1),
  date_of_birth: z.coerce.date(),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().min(1),
  phone_number: z.string().nullable(),
  insurance_information: z.string().nullable(),
});

export type CreatePatientInput = z.infer<typeof createPatientInputSchema>;

// Input schema for updating patients
export const updatePatientInputSchema = z.object({
  id: z.number(),
  full_name: z.string().min(1).optional(),
  date_of_birth: z.coerce.date().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().min(1).optional(),
  phone_number: z.string().nullable().optional(),
  insurance_information: z.string().nullable().optional(),
});

export type UpdatePatientInput = z.infer<typeof updatePatientInputSchema>;

// Medication schema for prescriptions
export const medicationSchema = z.object({
  id: z.number(),
  prescription_id: z.number(),
  medicine_name: z.string(),
  strength: z.string(),
  dosage_form: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  quantity: z.string(),
  instruction: z.string(),
});

export type Medication = z.infer<typeof medicationSchema>;

// Prescription schema
export const prescriptionSchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  patient_full_name: z.string(),
  patient_date_of_birth: z.coerce.date(),
  patient_age: z.number().nullable(),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string(),
  diagnosis: z.string(),
  icd_10_code: z.string().nullable(),
  doctor_name: z.string(),
  doctor_qualification: z.string(),
  clinic_name: z.string(),
  clinic_code: z.string(),
  date_of_issue: z.coerce.date(),
  digital_signature: z.string().nullable(),
  additional_notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Prescription = z.infer<typeof prescriptionSchema>;

// Input schema for creating prescriptions (patient details auto-populated from patient_id)
export const createPrescriptionInputSchema = z.object({
  patient_id: z.number(),
  diagnosis: z.string().min(1),
  icd_10_code: z.string().nullable(),
  doctor_name: z.string().min(1),
  doctor_qualification: z.string().min(1),
  clinic_name: z.string().min(1),
  clinic_code: z.string().min(1),
  digital_signature: z.string().nullable(),
  additional_notes: z.string().nullable(),
  medications: z.array(z.object({
    medicine_name: z.string().min(1),
    strength: z.string().min(1),
    dosage_form: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    quantity: z.string().min(1),
    instruction: z.string().min(1),
  })).min(1),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionInputSchema>;

// Invoice line item schema
export const invoiceLineItemSchema = z.object({
  id: z.number(),
  invoice_id: z.number(),
  description: z.string(),
  quantity: z.number(),
  unit_price: z.number(),
  line_amount: z.number(),
  vat_rate: z.number(),
  vat_amount: z.number(),
});

export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>;

// Invoice schema
export const invoiceSchema = z.object({
  id: z.number(),
  invoice_number: z.string(),
  invoice_code: z.string(),
  invoice_issue_date: z.coerce.date(),
  patient_id: z.number().nullable(),
  seller_clinic_name: z.string(),
  seller_tax_id: z.string(),
  seller_address: z.string(),
  seller_phone: z.string(),
  buyer_full_name: z.string(),
  buyer_address: z.string().nullable(),
  buyer_tax_code: z.string().nullable(),
  total_amount_before_tax: z.number(),
  total_vat: z.number(),
  total_payable_amount: z.number(),
  payment_method: z.string(),
  digital_signature: z.string().nullable(),
  qr_code: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Invoice = z.infer<typeof invoiceSchema>;

// Input schema for creating invoices (buyer details auto-populated from patient_id if provided)
export const createInvoiceInputSchema = z.object({
  invoice_code: z.string().min(1),
  patient_id: z.number().nullable(),
  seller_clinic_name: z.string().min(1),
  seller_tax_id: z.string().min(1),
  seller_address: z.string().min(1),
  seller_phone: z.string().min(1),
  // buyer_full_name and buyer_address will be auto-populated from patient if patient_id provided
  buyer_full_name: z.string().min(1).optional(), // Optional for manual override
  buyer_address: z.string().nullable().optional(), // Optional for manual override
  buyer_tax_code: z.string().nullable(),
  payment_method: z.string().min(1),
  digital_signature: z.string().nullable(),
  line_items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
    vat_rate: z.number().min(0).max(1),
  })).min(1),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;

// Query schemas
export const getPatientByIdSchema = z.object({
  id: z.number(),
});

export type GetPatientByIdInput = z.infer<typeof getPatientByIdSchema>;

export const getPrescriptionsByPatientIdSchema = z.object({
  patient_id: z.number(),
});

export type GetPrescriptionsByPatientIdInput = z.infer<typeof getPrescriptionsByPatientIdSchema>;

export const getInvoicesByPatientIdSchema = z.object({
  patient_id: z.number(),
});

export type GetInvoicesByPatientIdInput = z.infer<typeof getInvoicesByPatientIdSchema>;

export const getPrescriptionWithMedicationsSchema = z.object({
  id: z.number(),
});

export type GetPrescriptionWithMedicationsInput = z.infer<typeof getPrescriptionWithMedicationsSchema>;

export const getInvoiceWithLineItemsSchema = z.object({
  id: z.number(),
});

export type GetInvoiceWithLineItemsInput = z.infer<typeof getInvoiceWithLineItemsSchema>;
