
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);

// Patients table
export const patientsTable = pgTable('patients', {
  id: serial('id').primaryKey(),
  full_name: text('full_name').notNull(),
  date_of_birth: date('date_of_birth').notNull(),
  gender: genderEnum('gender').notNull(),
  address: text('address').notNull(),
  phone_number: text('phone_number'),
  insurance_information: text('insurance_information'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Prescriptions table
export const prescriptionsTable = pgTable('prescriptions', {
  id: serial('id').primaryKey(),
  patient_id: integer('patient_id').references(() => patientsTable.id).notNull(),
  patient_full_name: text('patient_full_name').notNull(),
  patient_date_of_birth: date('patient_date_of_birth').notNull(),
  patient_age: integer('patient_age'),
  gender: genderEnum('gender').notNull(),
  address: text('address').notNull(),
  diagnosis: text('diagnosis').notNull(),
  icd_10_code: text('icd_10_code'),
  doctor_name: text('doctor_name').notNull(),
  doctor_qualification: text('doctor_qualification').notNull(),
  clinic_name: text('clinic_name').notNull(),
  clinic_code: text('clinic_code').notNull(),
  date_of_issue: timestamp('date_of_issue').defaultNow().notNull(),
  digital_signature: text('digital_signature'),
  additional_notes: text('additional_notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Medications table (for prescription line items)
export const medicationsTable = pgTable('medications', {
  id: serial('id').primaryKey(),
  prescription_id: integer('prescription_id').references(() => prescriptionsTable.id).notNull(),
  medicine_name: text('medicine_name').notNull(),
  strength: text('strength').notNull(),
  dosage_form: text('dosage_form').notNull(),
  dosage: text('dosage').notNull(),
  frequency: text('frequency').notNull(),
  duration: text('duration').notNull(),
  quantity: text('quantity').notNull(),
  instruction: text('instruction').notNull(),
});

// Invoices table
export const invoicesTable = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoice_number: text('invoice_number').notNull().unique(),
  invoice_code: text('invoice_code').notNull(),
  invoice_issue_date: timestamp('invoice_issue_date').defaultNow().notNull(),
  patient_id: integer('patient_id').references(() => patientsTable.id),
  seller_clinic_name: text('seller_clinic_name').notNull(),
  seller_tax_id: text('seller_tax_id').notNull(),
  seller_address: text('seller_address').notNull(),
  seller_phone: text('seller_phone').notNull(),
  buyer_full_name: text('buyer_full_name').notNull(),
  buyer_address: text('buyer_address'),
  buyer_tax_code: text('buyer_tax_code'),
  total_amount_before_tax: numeric('total_amount_before_tax', { precision: 12, scale: 2 }).notNull(),
  total_vat: numeric('total_vat', { precision: 12, scale: 2 }).notNull(),
  total_payable_amount: numeric('total_payable_amount', { precision: 12, scale: 2 }).notNull(),
  payment_method: text('payment_method').notNull(),
  digital_signature: text('digital_signature'),
  qr_code: text('qr_code'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Invoice line items table
export const invoiceLineItemsTable = pgTable('invoice_line_items', {
  id: serial('id').primaryKey(),
  invoice_id: integer('invoice_id').references(() => invoicesTable.id).notNull(),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unit_price: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  line_amount: numeric('line_amount', { precision: 12, scale: 2 }).notNull(),
  vat_rate: numeric('vat_rate', { precision: 5, scale: 4 }).notNull(),
  vat_amount: numeric('vat_amount', { precision: 12, scale: 2 }).notNull(),
});

// Relations
export const patientsRelations = relations(patientsTable, ({ many }) => ({
  prescriptions: many(prescriptionsTable),
  invoices: many(invoicesTable),
}));

export const prescriptionsRelations = relations(prescriptionsTable, ({ one, many }) => ({
  patient: one(patientsTable, {
    fields: [prescriptionsTable.patient_id],
    references: [patientsTable.id],
  }),
  medications: many(medicationsTable),
}));

export const medicationsRelations = relations(medicationsTable, ({ one }) => ({
  prescription: one(prescriptionsTable, {
    fields: [medicationsTable.prescription_id],
    references: [prescriptionsTable.id],
  }),
}));

export const invoicesRelations = relations(invoicesTable, ({ one, many }) => ({
  patient: one(patientsTable, {
    fields: [invoicesTable.patient_id],
    references: [patientsTable.id],
  }),
  lineItems: many(invoiceLineItemsTable),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItemsTable, ({ one }) => ({
  invoice: one(invoicesTable, {
    fields: [invoiceLineItemsTable.invoice_id],
    references: [invoicesTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  patients: patientsTable,
  prescriptions: prescriptionsTable,
  medications: medicationsTable,
  invoices: invoicesTable,
  invoiceLineItems: invoiceLineItemsTable,
};
