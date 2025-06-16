
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { 
  createPatientInputSchema,
  updatePatientInputSchema,
  getPatientByIdSchema,
  createPrescriptionInputSchema,
  getPrescriptionsByPatientIdSchema,
  getPrescriptionWithMedicationsSchema,
  createInvoiceInputSchema,
  getInvoicesByPatientIdSchema,
  getInvoiceWithLineItemsSchema
} from './schema';

import { createPatient } from './handlers/create_patient';
import { getPatients } from './handlers/get_patients';
import { getPatientById } from './handlers/get_patient_by_id';
import { updatePatient } from './handlers/update_patient';
import { createPrescription } from './handlers/create_prescription';
import { getPrescriptionsByPatientId } from './handlers/get_prescriptions_by_patient_id';
import { getPrescriptionWithMedications } from './handlers/get_prescription_with_medications';
import { createInvoice } from './handlers/create_invoice';
import { getInvoicesByPatientId } from './handlers/get_invoices_by_patient_id';
import { getInvoiceWithLineItems } from './handlers/get_invoice_with_line_items';
import { generateInvoiceNumber } from './handlers/generate_invoice_number';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Patient Management
  createPatient: publicProcedure
    .input(createPatientInputSchema)
    .mutation(({ input }) => createPatient(input)),
  
  getPatients: publicProcedure
    .query(() => getPatients()),
  
  getPatientById: publicProcedure
    .input(getPatientByIdSchema)
    .query(({ input }) => getPatientById(input)),
  
  updatePatient: publicProcedure
    .input(updatePatientInputSchema)
    .mutation(({ input }) => updatePatient(input)),

  // Prescription Management
  createPrescription: publicProcedure
    .input(createPrescriptionInputSchema)
    .mutation(({ input }) => createPrescription(input)),
  
  getPrescriptionsByPatientId: publicProcedure
    .input(getPrescriptionsByPatientIdSchema)
    .query(({ input }) => getPrescriptionsByPatientId(input)),
  
  getPrescriptionWithMedications: publicProcedure
    .input(getPrescriptionWithMedicationsSchema)
    .query(({ input }) => getPrescriptionWithMedications(input)),

  // Invoice Management
  createInvoice: publicProcedure
    .input(createInvoiceInputSchema)
    .mutation(({ input }) => createInvoice(input)),
  
  getInvoicesByPatientId: publicProcedure
    .input(getInvoicesByPatientIdSchema)
    .query(({ input }) => getInvoicesByPatientId(input)),
  
  getInvoiceWithLineItems: publicProcedure
    .input(getInvoiceWithLineItemsSchema)
    .query(({ input }) => getInvoiceWithLineItems(input)),

  // Utilities
  generateInvoiceNumber: publicProcedure
    .query(() => generateInvoiceNumber()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Medical Software TRPC server listening at port: ${port}`);
}

start();
