
import { db } from '../db';
import { invoicesTable, invoiceLineItemsTable } from '../db/schema';
import { type GetInvoiceWithLineItemsInput, type Invoice, type InvoiceLineItem } from '../schema';
import { eq } from 'drizzle-orm';

export interface InvoiceWithLineItems extends Invoice {
  lineItems: InvoiceLineItem[];
}

export const getInvoiceWithLineItems = async (input: GetInvoiceWithLineItemsInput): Promise<InvoiceWithLineItems | null> => {
  try {
    // Get the invoice with its line items using a join
    const results = await db.select()
      .from(invoicesTable)
      .leftJoin(invoiceLineItemsTable, eq(invoicesTable.id, invoiceLineItemsTable.invoice_id))
      .where(eq(invoicesTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Extract invoice data from the first result
    const invoiceData = results[0].invoices;
    
    // Convert numeric fields back to numbers for the invoice
    const invoice: Invoice = {
      ...invoiceData,
      total_amount_before_tax: parseFloat(invoiceData.total_amount_before_tax),
      total_vat: parseFloat(invoiceData.total_vat),
      total_payable_amount: parseFloat(invoiceData.total_payable_amount),
    };

    // Extract and convert line items
    const lineItems: InvoiceLineItem[] = results
      .filter(result => result.invoice_line_items !== null)
      .map(result => {
        const lineItem = result.invoice_line_items!;
        return {
          ...lineItem,
          quantity: parseFloat(lineItem.quantity),
          unit_price: parseFloat(lineItem.unit_price),
          line_amount: parseFloat(lineItem.line_amount),
          vat_rate: parseFloat(lineItem.vat_rate),
          vat_amount: parseFloat(lineItem.vat_amount),
        };
      });

    return {
      ...invoice,
      lineItems,
    };
  } catch (error) {
    console.error('Get invoice with line items failed:', error);
    throw error;
  }
};
