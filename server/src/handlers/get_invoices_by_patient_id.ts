
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type GetInvoicesByPatientIdInput, type Invoice } from '../schema';
import { eq } from 'drizzle-orm';

export const getInvoicesByPatientId = async (input: GetInvoicesByPatientIdInput): Promise<Invoice[]> => {
  try {
    const results = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.patient_id, input.patient_id))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(invoice => ({
      ...invoice,
      total_amount_before_tax: parseFloat(invoice.total_amount_before_tax),
      total_vat: parseFloat(invoice.total_vat),
      total_payable_amount: parseFloat(invoice.total_payable_amount)
    }));
  } catch (error) {
    console.error('Failed to get invoices by patient ID:', error);
    throw error;
  }
};
