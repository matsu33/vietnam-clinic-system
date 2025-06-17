
import { initTRPC, TRPCError } from '@trpc/server';
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
  getInvoiceWithLineItemsSchema,
  loginInputSchema,
  registerInputSchema
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
import { login, register, verifyToken } from './handlers/auth';

interface Context {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Protected procedure that requires authentication
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Create context function
const createContext = ({ req }: { req: any }): Context => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {};
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return {};
    }
    return {
      user: {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      },
    };
  } catch (error) {
    return {};
  }
};

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication
  auth: router({
    login: publicProcedure
      .input(loginInputSchema)
      .mutation(({ input }) => login(input)),
    
    register: publicProcedure
      .input(registerInputSchema)
      .mutation(({ input }) => register(input)),
  }),

  // Patient Management (now protected)
  createPatient: protectedProcedure
    .input(createPatientInputSchema)
    .mutation(({ input }) => createPatient(input)),
  
  getPatients: protectedProcedure
    .query(() => getPatients()),
  
  getPatientById: protectedProcedure
    .input(getPatientByIdSchema)
    .query(({ input }) => getPatientById(input)),
  
  updatePatient: protectedProcedure
    .input(updatePatientInputSchema)
    .mutation(({ input }) => updatePatient(input)),

  // Prescription Management (now protected)
  createPrescription: protectedProcedure
    .input(createPrescriptionInputSchema)
    .mutation(({ input }) => createPrescription(input)),
  
  getPrescriptionsByPatientId: protectedProcedure
    .input(getPrescriptionsByPatientIdSchema)
    .query(({ input }) => getPrescriptionsByPatientId(input)),
  
  getPrescriptionWithMedications: protectedProcedure
    .input(getPrescriptionWithMedicationsSchema)
    .query(({ input }) => getPrescriptionWithMedications(input)),

  // Invoice Management (now protected)
  createInvoice: protectedProcedure
    .input(createInvoiceInputSchema)
    .mutation(({ input }) => createInvoice(input)),
  
  getInvoicesByPatientId: protectedProcedure
    .input(getInvoicesByPatientIdSchema)
    .query(({ input }) => getInvoicesByPatientId(input)),
  
  getInvoiceWithLineItems: protectedProcedure
    .input(getInvoiceWithLineItemsSchema)
    .query(({ input }) => getInvoiceWithLineItems(input)),

  // Utilities (now protected)
  generateInvoiceNumber: protectedProcedure
    .query(() => generateInvoiceNumber()),
});

export type AppRouter = typeof appRouter;

async function start() {
  try {
    // Seed the admin user on startup
    const { seedAdmin } = await import('./handlers/seed_admin');
    await seedAdmin();
    
    const port = process.env['SERVER_PORT'] || 2022;
    const server = createHTTPServer({
      middleware: (req, res, next) => {
        cors()(req, res, next);
      },
      router: appRouter,
      createContext: ({ req, res }) => createContext({ req }),
    });
    server.listen(port);
    console.log(`🏥 Medical Software TRPC server listening at port: ${port}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
