"use client";

import { createContext, useContext, ReactNode } from "react";
import { useForm, UseFormReturn } from "react-hook-form";

export interface FormData {
  applicant: {
    id?: number;
    fullName?: string;
    nic?: string;
    drivingLicense?: string;
    passportNo?: string;
    email?: string;
    phoneMobile?: string;
    phoneLand?: string;
    dateOfBirth?: string;
    occupation?: string;
    address?: string;
    branchId?: string;
    investmentAmount?: number;
    investmentDate?: string;
    idFront?: string;
    idBack?: string;
    paymentSlip?: string;
    proposal?: string;
    agreement?: string;
    signature?: string;
    proposalFormNo?: string;
    faId?: number | null;
    fmId?: number | null;
    bmId?: number | null;
    rmId?: number | null;
    zmId?: number | null;
    agmId?: number | null;
    ccoId?: number | null;
  };
  investment: {
    planId?: string;
    investmentRates?: number[];
  };
  beneficiary: {
    fullName?: string;
    nic?: string;
    phone?: string;
    bankName?: string;
    bankBranch?: string;
    accountNo?: string;
    relationship?: string;
    _existingId?: number | string; // For tracking if user picked an existing beneficiary
  };
  nominee: {
    fullName?: string;
    permanentAddress?: string;
    postalAddress?: string;
    nic?: string;

    _existingId?: number | string; // For tracking if user picked an existing nominee
  };
}

interface FormContextProps {
  form: UseFormReturn<FormData>;
}

const FormContext = createContext<FormContextProps | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context)
    throw new Error("useFormContext must be used within FormProvider");
  return context;
};

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const form = useForm<FormData>({
    defaultValues,
    mode: "onTouched",
  });

  return (
    <FormContext.Provider value={{ form }}>{children}</FormContext.Provider>
  );
};

export const defaultValues: FormData = {
  applicant: {
    fullName: "",
    nic: "",
    drivingLicense: "",
    passportNo: "",
    email: "",
    phoneMobile: "",
    phoneLand: "",
    dateOfBirth: "",
    occupation: "",
    address: "",
    branchId: "",
    investmentAmount: 0,
    investmentDate: "",
    idFront: "",
    idBack: "",
    paymentSlip: "",
    proposal: "",
    agreement: "",
    signature: "",
    proposalFormNo: "",
    faId: null,
    fmId: null,
    bmId: null,
    rmId: null,
    zmId: null,
    agmId: null,
    ccoId: null,
  },
  beneficiary: {
    fullName: "",
    nic: "",
    phone: "",
    bankName: "",
    bankBranch: "",
    accountNo: "",
    relationship: "",
    _existingId: "",
  },
  nominee: {
    fullName: "",
    permanentAddress: "",
    postalAddress: "",
    nic: "",
    _existingId: "",
  },
  investment: {
    planId: "",
  },
};
