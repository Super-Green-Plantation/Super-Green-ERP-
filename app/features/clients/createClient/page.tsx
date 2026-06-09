"use client";

import { FormProvider } from "@/app/context/FormContext";
import ApplicantDetails from "./ApplicantDetails";
import BeneficiaryDetails from "./BeneficiaryDetails";
import NomineeDetails from "./NomineeDetails";
import { SubmitButton } from "./SubmitButton";
import Back from "@/app/components/Buttons/Back";
import DocumentUploadSection from "./ClientDocuments";
import AdvisorHierarchy from "./MemberSearchInput";
import { useRef, useState } from "react";
import { ExistingClientBanner } from "./ExistingClientBanner";
import { LockedClient } from "@/app/types/client";
import CreateInvestmentForm from "@/app/features/investments/create/page";

const Page = () => {
  const [resetKey, setResetKey] = useState(0);
  const [lockedClient, setLockedClient] = useState<LockedClient | null>(null);

  const pendingFilesRef = useRef<Record<string, File | null>>({
    idFront: null,
    idBack: null,
    paymentSlip: null,
    proposal: null,
    agreement: null,
  });

  const handleLockClient = (client: LockedClient) => {
    setLockedClient(client);
  };

  const handleUnlockClient = () => {
    setLockedClient(null);
  };

  // ── When adding an investment to an existing client, use the same
  //    clean form as /features/investments/create
  if (lockedClient) {
    return (
      <div className="max-w-5xl mx-auto sm:space-y-6 space-y-4 sm:p-4 md:p-8 min-h-screen">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <Back />
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter">
                Add Investment
              </h1>
              <p className="text-sm text-muted-foreground font-semibold mt-1">
                Creating new investment for {lockedClient.fullName}
              </p>
            </div>
          </div>
        </div>

        {/* Existing client banner */}
        <ExistingClientBanner
          client={lockedClient}
          onUnlock={handleUnlockClient}
        />

        {/* Same investment form UI as /features/investments/create */}
        <CreateInvestmentForm
          key={resetKey}
          hideHeader
          lockedClient={lockedClient}
          onSuccess={() => {
            setResetKey((p) => p + 1);
            setLockedClient(null);
          }}
        />
      </div>
    );
  }

  // ── New-client registration flow ─────────────────────────────────────────
  return (
    <FormProvider>
      <div className="max-w-7xl mx-auto sm:space-y-6 space-y-4 sm:p-4 md:p-8 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border/50">
          <div className="flex items-center gap-4">
            <Back />
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter">
                Register Client
              </h1>
              <p className="text-sm text-muted-foreground font-semibold mt-1">
                Search for an existing client or register a new one
              </p>
            </div>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <ApplicantDetails
              lockedClient={null}
              onClientLock={handleLockClient}
            />

            <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 shadow-sm">
              <DocumentUploadSection
                key={resetKey}
                pendingFilesRef={pendingFilesRef}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* <AdvisorHierarchy /> */}
            <BeneficiaryDetails lockedClient={null} />
            <NomineeDetails lockedClient={null} />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <SubmitButton
            pendingFilesRef={pendingFilesRef}
            lockedClient={null}
            onResetComplete={() => {
              setResetKey((p) => p + 1);
            }}
          />
        </div>
      </div>
    </FormProvider>
  );
};

export default Page;