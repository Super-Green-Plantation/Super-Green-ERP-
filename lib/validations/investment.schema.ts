import { z } from "zod";

// ─── Create Investment (standalone, for existing client) ────────────────────

export const createInvestmentSchema = z.object({
  clientId: z.number().positive("Client is required"),
  branchId: z.number().positive("Branch is required"),
  planId: z.number().positive().optional(),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Investment amount must be a positive number",
    }),
  // Optional — server auto-generates the canonical value inside a DB transaction.
  // A client-supplied value is accepted for management overrides.
  proposalFormNo: z.string().optional(),
});

// ─── Investment beneficiary fields ───────────────────────────────────────────

export const beneficiaryFieldsSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  nic: z.string().optional(),
  phone: z.string().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  accountNo: z.string().min(1, "Account number is required"),
  relationship: z.string().optional(),
});

export type BeneficiaryFieldsInput = z.infer<typeof beneficiaryFieldsSchema>;

// ─── Investment nominee fields ────────────────────────────────────────────────

export const nomineeFieldsSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  nic: z.string().optional(),
  permanentAddress: z.string().optional(),
  postalAddress: z.string().optional(),
});

export type NomineeFieldsInput = z.infer<typeof nomineeFieldsSchema>;

// ─── Create Investment for Existing Client ───────────────────────────────────

export const createInvestmentForExistingClientSchema = z.object({
  clientId: z.number().positive("Client is required"),
  branchId: z.number().positive("Branch is required"),
  planId: z.number().positive().optional(),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Investment amount must be a positive number",
    }),
  // Optional — server generates the canonical number atomically in $transaction.
  proposalFormNo: z.string().optional(),
  investmentDate: z.date().optional(),
  investmentRates: z.array(z.number().min(0).max(100)).optional(),
  beneficiaryId: z.number().nullable().optional(),
  nomineeId: z.number().nullable().optional(),
  newBeneficiary: beneficiaryFieldsSchema.nullable().optional(),
  newNominee: nomineeFieldsSchema.nullable().optional(),
});

export type CreateInvestmentForExistingClientInput = z.infer<
  typeof createInvestmentForExistingClientSchema
>;

// ─── Update Investment ────────────────────────────────────────────────────────

export const updateInvestmentSchema = z.object({
  investmentId: z.number().positive("Investment ID is required"),
  planId: z.number().positive().optional(),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Investment amount must be a positive number",
    }),
  investmentDate: z.coerce.date().refine((d) => !!d, { message: "Investment date is required" }),
  investmentRates: z.array(z.number().min(0).max(100)).optional(),
  beneficiaryId: z.number().nullable(),
  nomineeId: z.number().nullable(),
  newBeneficiary: beneficiaryFieldsSchema.nullable().optional(),
  newNominee: nomineeFieldsSchema.nullable().optional(),
});

export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;

// ─── Client-side investment form (UI validation before submit) ───────────────

export const investmentFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
  // Read-only/auto-generated — no client-side validation needed.
  proposalFormNo: z.string().optional(),
  investmentDate: z
    .string()
    .min(1, "Investment date is required"),
});

export type InvestmentFormInput = z.infer<typeof investmentFormSchema>;
