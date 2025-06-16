
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { desc } from 'drizzle-orm';

export const generateInvoiceNumber = async (): Promise<string> => {
  try {
    // Get the latest invoice to determine the next number
    const latestInvoice = await db.select()
      .from(invoicesTable)
      .orderBy(desc(invoicesTable.id))
      .limit(1)
      .execute();

    let nextNumber = 1;
    
    if (latestInvoice.length > 0) {
      // Extract number from the latest invoice number (format: INV-YYYYMMDD-NNNN)
      const latestInvoiceNumber = latestInvoice[0].invoice_number;
      const numberMatch = latestInvoiceNumber.match(/-(\d{4})$/);
      
      if (numberMatch) {
        const currentNumber = parseInt(numberMatch[1], 10);
        nextNumber = currentNumber + 1;
      }
    }

    // Generate invoice number with current date and sequential number
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const sequentialNumber = String(nextNumber).padStart(4, '0');

    const invoiceNumber = `INV-${year}${month}${day}-${sequentialNumber}`;

    return invoiceNumber;
  } catch (error) {
    console.error('Invoice number generation failed:', error);
    throw error;
  }
};
