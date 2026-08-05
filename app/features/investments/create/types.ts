import { createClient as createSupabaseClient } from "@/lib/supabase/client";

export const BUCKET = "kyc-documents";

export const uploadToSupabase = async (key: string, file: File): Promise<string> => {
  const supabase = createSupabaseClient();
  const ext = file.name.split(".").pop();
  const path = `${key}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(`Upload failed for ${key}: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

export type BeneficiaryMode = "existing" | "new" | "none";
export type NomineeMode = "existing" | "new" | "none";

export type BeneficiaryFields = {
  fullName: string; nic: string; phone: string;
  bankName: string; bankBranch: string; accountNo: string; relationship: string;
  // ── new photo fields ──
  bankBookPhotoUrl: string | null;
  idCopyUrl: string | null;
};
export type NomineeFields = {
  fullName: string; nic: string;
  contact: string;
  permanentAddress: string; postalAddress: string;
  // ── new photo field ──
  idCopyUrl: string | null;
};

export const EMPTY_BENEFICIARY: BeneficiaryFields = {
  fullName: "", nic: "", phone: "", bankName: "", bankBranch: "", accountNo: "", relationship: "",
  bankBookPhotoUrl: null,
  idCopyUrl: null,
};
export const EMPTY_NOMINEE: NomineeFields = {
  fullName: "", nic: "", contact: "", permanentAddress: "", postalAddress: "",
  idCopyUrl: null,
};

export function beneficiaryFromRecord(b: any): BeneficiaryFields {
  return {
    fullName: b.fullName ?? "", nic: b.nic ?? "", phone: b.phone ?? "",
    bankName: b.bankName ?? "", bankBranch: b.bankBranch ?? "",
    accountNo: b.accountNo ?? "", relationship: b.relationship ?? "",
    bankBookPhotoUrl: b.bankBookPhotoUrl ?? null,
    idCopyUrl: b.idCopyUrl ?? null,
  };
}
export function nomineeFromRecord(n: any): NomineeFields {
  return {
    fullName: n.fullName ?? "", nic: n.nic ?? "", contact: n.contact ?? "",
    permanentAddress: n.permanentAddress ?? "", postalAddress: n.postalAddress ?? "",
    idCopyUrl: n.idCopyUrl ?? null,
  };
}
export function isEqual<T extends object>(a: T, b: T) {
  return Object.keys(a).every(k => (a as any)[k] === (b as any)[k]);
}

export type HierarchyState = {
  faId: number | null;
  fmId: number | null;
  bmId: number | null;
  rmId: number | null;
  zmId: number | null;
  agmId: number | null;
  ccoId: number | null;
};

export type InitialData = {
  planId?: number;
  amount: number;
  investmentDate: string;
  investmentRates?: number[];
  beneficiary?: any;   // full record
  nominee?: any;       // full record
  proposalFormNo?: string;
  faId?: number | null;
  fmId?: number | null;
  bmId?: number | null;
  rmId?: number | null;
  zmId?: number | null;
  agmId?: number | null;
  ccoId?: number | null;
  fa?: any; fm?: any; bm?: any; rm?: any; zm?: any; agm?: any; cco?: any;
  approvalStatus?: string;
  reviewNote?: string;
  reviewedBy?: string;
};