"use client";

import { FormProvider } from "@/app/context/FormContext";
import ApplicantDetails from "./ApplicantDetails";
import BeneficiaryDetails from "./BeneficiaryDetails";
import NomineeDetails from "./NomineeDetails";
import { SubmitButton } from "./SubmitButton";
import Back from "@/app/components/Buttons/Back";
import DocumentUploadSection from "./ClientDocuments";
import Heading from "@/app/components/Heading";
import { useRef, useState } from "react";

const Page = () => {
  const [resetKey, setResetKey] = useState(0);

  const pendingFilesRef = useRef<Record<string, File | null>>({
    idFront: null, idBack: null, paymentSlip: null, proposal: null, agreement: null,
  });
  return (
    <FormProvider>
      <div className="max-w-7xl mx-auto sm:space-y-6 space-y-4 sm:p-4 md:p-8 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border/50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <Back />
              <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter">
                Register New Client
              </h1>
            </div>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Primary Details */}
          <div className="lg:col-span-2 space-y-6">
            <ApplicantDetails />
            <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 shadow-sm">
              <DocumentUploadSection key={resetKey} pendingFilesRef={pendingFilesRef} />
            </div>
          </div>

          {/* Right Column: Supporting Details */}
          <div className="lg:col-span-1 space-y-6">
            <BeneficiaryDetails />
            <NomineeDetails />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <SubmitButton
            pendingFilesRef={pendingFilesRef}
            onResetComplete={() => setResetKey(prev => prev + 1)}
          /></div>
      </div>
    </FormProvider>
  );
};

export default Page;
