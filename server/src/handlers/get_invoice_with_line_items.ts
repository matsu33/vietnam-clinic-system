
import { type GetInvoiceWithLineItemsInput, type Invoice, type InvoiceLineItem } from '../schema';

export interface InvoiceWithLineItems extends Invoice {
  lineItems: InvoiceLineItem[];
}

export declare function getInvoiceWithLineItems(input: GetInvoiceWithLineItemsInput): Promise<InvoiceWithLineItems | null>;
