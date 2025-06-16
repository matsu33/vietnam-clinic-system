
import { db } from '../db';
import { invoicesTable, invoiceLineItemsTable } from '../db/schema';
import { type CreateInvoiceInput, type Invoice } from '../schema';

export const createInvoice = async (input: CreateInvoiceInput): Promise<Invoice> => {
  try {
    // Calculate totals from line items
    let totalAmountBeforeTax = 0;
    let totalVat = 0;

    const processedLineItems = input.line_items.map(item => {
      const lineAmount = item.quantity * item.unit_price;
      const vatAmount = lineAmount * item.vat_rate;
      
      totalAmountBeforeTax += lineAmount;
      totalVat += vatAmount;

      return {
        description: item.description,
        quantity: item.quantity.toString(),
        unit_price: item.unit_price.toString(),
        line_amount: lineAmount.toString(),
        vat_rate: item.vat_rate.toString(),
        vat_amount: vatAmount.toString(),
      };
    });

    const totalPayableAmount = totalAmountBeforeTax + totalVat;

    // Generate unique invoice number (timestamp-based)
    const invoiceNumber = `INV-${Date.now()}`;

    // Insert invoice record
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: invoiceNumber,
        invoice_code: input.invoice_code,
        patient_id: input.patient_id,
        seller_clinic_name: input.seller_clinic_name,
        seller_tax_id: input.seller_tax_id,
        seller_address: input.seller_address,
        seller_phone: input.seller_phone,
        buyer_full_name: input.buyer_full_name,
        buyer_address: input.buyer_address,
        buyer_tax_code: input.buyer_tax_code,
        total_amount_before_tax: totalAmountBeforeTax.toString(),
        total_vat: totalVat.toString(),
        total_payable_amount: totalPayableAmount.toString(),
        payment_method: input.payment_method,
        digital_signature: input.digital_signature,
      })
      .returning()
      .execute();

    const invoice = invoiceResult[0];

    // Insert line items
    await db.insert(invoiceLineItemsTable)
      .values(processedLineItems.map(item => ({
        invoice_id: invoice.id,
        ...item,
      })))
      .execute();

    // Convert numeric fields back to numbers before returning
    return {
      ...invoice,
      total_amount_before_tax: parseFloat(invoice.total_amount_before_tax),
      total_vat: parseFloat(invoice.total_vat),
      total_payable_amount: parseFloat(invoice.total_payable_amount),
    };
  } catch (error) {
    console.error('Invoice creation failed:', error);
    throw error;
  }
};
