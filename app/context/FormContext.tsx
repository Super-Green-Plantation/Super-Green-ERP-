"use client";

import { createContext, useContext, ReactNode } from "react";
import { useForm, UseFormReturn } from "react-hook-form";

export interface FormData {
  applicant: {
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

    idFront?: string;
    idBack?: string;
    proposal?: string;
    agreement?: string;
    signature?: string;
  };
  investment: {
    planId?: string;
  };

  beneficiary: {
    fullName?: string;
    nic?: string;
    phone?: string;
    bankName?: string;
    bankBranch?: string;
    accountNo?: string;
    relationship?: string;
  };
  nominee: {
    fullName?: string;
    permanentAddress?: string;
    postalAddress?: string;
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
    defaultValues: {
      applicant: {},
      beneficiary: {},
      nominee: {},
      investment: {},
    },
  });

  return (
    <FormContext.Provider value={{ form }}>{children}</FormContext.Provider>
  );
};
