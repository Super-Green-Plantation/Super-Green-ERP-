import { z } from "zod";

// Sri Lanka NIC: 9 digits + V/X (old) OR 12 digits (new)
const nicSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^(\d{9}[VXvx]|\d{12})$/.test(val.trim()),
    { message: "NIC must be 9 digits + V/X (old) or 12 digits (new)" }
  );

// Sri Lanka phone: 9–10 digits
const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^\d{9,10}$/.test(val.replace(/[\s\-+]/g, "")),
    { message: "Phone must be 9–10 digits" }
  );

// ─── Beneficiary ────────────────────────────────────────────────────────────

export const beneficiarySchema = z.object({
  fullName: z.string().optional(),
  nic: nicSchema,
  phone: z.string().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  accountNo: z.string().optional(),
  relationship: z.string().optional(),
});

// If beneficiary fullName is given, enforce banking fields
export const beneficiarySchemaFull = z
  .object({
    fullName: z.string().optional(),
    nic: nicSchema,
    phone: z.string().optional(),
    bankName: z.string().optional(),
    bankBranch: z.string().optional(),
    accountNo: z.string().optional(),
    relationship: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.fullName && val.fullName.trim().length > 0) {
      if (!val.bankName || val.bankName.trim().length === 0) {
        ctx.addIssue({ code: "custom", path: ["bankName"], message: "Bank name is required when beneficiary is provided" });
      }
      if (!val.accountNo || val.accountNo.trim().length === 0) {
        ctx.addIssue({ code: "custom", path: ["accountNo"], message: "Account number is required when beneficiary is provided" });
      }
    }
  });

// ─── Nominee ────────────────────────────────────────────────────────────────

export const nomineeSchema = z.object({
  fullName: z.string().optional(),
  nic: nicSchema,
  permanentAddress: z.string().optional(),
  postalAddress: z.string().optional(),
});

export const nomineeSchemaFull = z
  .object({
    fullName: z.string().optional(),
    nic: nicSchema,
    permanentAddress: z.string().optional(),
    postalAddress: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.fullName && val.fullName.trim().length > 0) {
      if (!val.permanentAddress || val.permanentAddress.trim().length === 0) {
        ctx.addIssue({ code: "custom", path: ["permanentAddress"], message: "Permanent address is required when nominee is provided" });
      }
    }
  });

// ─── Applicant (create) ─────────────────────────────────────────────────────

export const applicantSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters"),
  nic: nicSchema,
  drivingLicense: z.string().optional(),
  passportNo: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      { message: "Invalid email address" }
    ),
  phoneMobile: phoneSchema,
  phoneLand: phoneSchema,
  dateOfBirth: z.string().optional(), // optional
  occupation: z.string().optional(),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters"),
  branchId: z
    .union([z.string(), z.number()])
    .refine((val) => val !== "" && val !== undefined && val !== null, {
      message: "Branch is required",
    })
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Please select a valid branch",
    }),
  investmentAmount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Investment amount must be a positive number",
    }),
  investmentDate: z.string().optional(),
  proposalFormNo: z
    .string()
    .min(3, "Proposal form number must be at least 3 characters"),
  idFront: z.string().optional(),
  idBack: z.string().optional(),
  paymentSlip: z.string().optional(),
  proposal: z.string().optional(),
  agreement: z.string().optional(),
  signature: z.string().optional(),
  faId: z.number().nullable().optional(),
  fmId: z.number().nullable().optional(),
  bmId: z.number().nullable().optional(),
  rmId: z.number().nullable().optional(),
  zmId: z.number().nullable().optional(),
  agmId: z.number().nullable().optional(),
  ccoId: z.number().nullable().optional(),
});

// ─── Investment section (used in createClient form) ─────────────────────────

export const investmentSectionSchema = z.object({
  planId: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === "" || val === undefined ? undefined : Number(val))),
  investmentRates: z.array(z.number().min(0).max(100)).optional(),
});

// ─── Save Client (create) ────────────────────────────────────────────────────

export const saveClientSchema = z.object({
  applicant: applicantSchema,
  investment: investmentSectionSchema,
  beneficiary: beneficiarySchemaFull,
  nominee: nomineeSchemaFull,
});

export type SaveClientInput = z.infer<typeof saveClientSchema>;

// ─── Update Client (partial) ─────────────────────────────────────────────────

export const updateApplicantSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters"),
  nic: nicSchema,
  drivingLicense: z.string().optional(),
  passportNo: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      { message: "Invalid email address" }
    ),
  phoneMobile: phoneSchema,
  phoneLand: phoneSchema,
  dateOfBirth: z.string().optional(),
  occupation: z.string().optional(),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters"),
  investmentAmount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === "" || val === undefined ? undefined : Number(val)))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
      message: "Investment amount must be a positive number",
    }),
  proposalFormNo: z.string().optional(),
  idFront: z.string().optional(),
  idBack: z.string().optional(),
  paymentSlip: z.string().optional(),
  proposal: z.string().optional(),
  agreement: z.string().optional(),
});

export const updateClientSchema = z.object({
  applicant: updateApplicantSchema,
  investment: z.object({
    planId: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => (val === "" || val === undefined ? undefined : Number(val))),
    investmentDate: z.string().optional(),
  }).optional(),
  beneficiary: beneficiarySchema.optional(),
  nominee: nomineeSchema.optional(),
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// ─── Update Beneficiary standalone ──────────────────────────────────────────

export const updateBeneficiarySchema = z.object({
  id: z.number().optional(),
  fullName: z.string().min(1, "Full name is required"),
  nic: nicSchema,
  phone: z.string().optional(),
  bankName: z.string().min(1, "Bank name is required"),
  bankBranch: z.string().optional(),
  accountNo: z.string().min(1, "Account number is required"),
  relationship: z.string().optional(),
});

export type UpdateBeneficiaryInput = z.infer<typeof updateBeneficiarySchema>;

// ─── Update Nominee standalone ───────────────────────────────────────────────

export const updateNomineeSchema = z.object({
  id: z.number().optional(),
  fullName: z.string().min(1, "Full name is required"),
  nic: nicSchema,
  permanentAddress: z.string().min(1, "Permanent address is required"),
  postalAddress: z.string().optional(),
});

export type UpdateNomineeInput = z.infer<typeof updateNomineeSchema>;
