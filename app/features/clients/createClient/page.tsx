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

  // KYC identity + paperwork docs (existing ref, unchanged)
  const pendingFilesRef = useRef<Record<string, File | null>>({
    idFront: null,
    idBack: null,
    paymentSlip: null,
    proposal: null,
    agreement: null,
  });

  // Beneficiary photo files
  const beneficiaryPhotosRef = useRef<Record<string, File | null>>({
    bankBookPhotoUrl: null,
    idCopyUrl: null,
  });

  // Nominee photo file
  const nomineePhotosRef = useRef<Record<string, File | null>>({
    idCopyUrl: null,
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
      <div className="mx-auto min-h-screen w-full max-w-[1120px] space-y-5 px-4 pb-10 pt-5 sm:px-7 sm:pt-8">
        {/* Page header */}
        <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Back />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[30px]">
                Add Investment
              </h1>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
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
      <div className="mx-auto min-h-screen w-full max-w-[1280px] space-y-5 px-4 pb-10 pt-5 sm:px-7 sm:pt-8">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Back />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[30px]">
                Register Client
              </h1>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Search for an existing client or register a new one
              </p>
            </div>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-5 lg:col-span-2">
            <ApplicantDetails
              lockedClient={null}
              onClientLock={handleLockClient}
            />

            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_10px_35px_rgba(34,43,72,0.05)] sm:p-6">
              <DocumentUploadSection
                key={resetKey}
                pendingFilesRef={pendingFilesRef}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5 lg:col-span-1">
            {/* <AdvisorHierarchy /> */}
            <BeneficiaryDetails
              lockedClient={null}
              beneficiaryPhotosRef={beneficiaryPhotosRef}
            />
            <NomineeDetails
              lockedClient={null}
              nomineePhotosRef={nomineePhotosRef}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-border/70 pt-5">
          <SubmitButton
            pendingFilesRef={pendingFilesRef}
            beneficiaryPhotosRef={beneficiaryPhotosRef}
            nomineePhotosRef={nomineePhotosRef}
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