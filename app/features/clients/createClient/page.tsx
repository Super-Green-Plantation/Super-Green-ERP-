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
import { useSessionUser } from "@/app/hooks/useSessionUser";

const Page = () => {
  const [resetKey, setResetKey] = useState(0);
  const [lockedClient, setLockedClient] = useState<LockedClient | null>(null);

  const { data: userData } = useSessionUser();
  const isManager =
    userData &&
    (
      ["ADMIN", "HR", "DEV"].includes(userData.role) ||
      ["CHAIRMEN", "HR", "ACC", "PRO", "OPM"].includes(
        (userData as any).member?.position?.title ?? ""
      )
    );

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
    setResetKey((p) => p + 1);
    pendingFilesRef.current = {
      idFront: null,
      idBack: null,
      paymentSlip: null,
      proposal: null,
      agreement: null,
    };
    beneficiaryPhotosRef.current = {
      bankBookPhotoUrl: null,
      idCopyUrl: null,
    };
    nomineePhotosRef.current = {
      idCopyUrl: null,
    };
  };

  // ── Unified Registration / Investment flow ────────────────────────────────
  return (
    <FormProvider key={resetKey}>
      <div className="mx-auto min-h-screen w-full space-y-5 px-4 pb-10 pt-5 sm:px-7 sm:pt-8">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Back />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[30px]">
                {lockedClient ? "Add Investment" : "Register Client"}
              </h1>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {lockedClient
                  ? `Creating new investment for ${lockedClient.fullName}`
                  : "Search for an existing client or register a new one"}
              </p>
            </div>
          </div>
        </div>

        {/* Existing client banner (allows unlocking) */}
        {lockedClient && (
          <ExistingClientBanner
            client={lockedClient}
            onUnlock={handleUnlockClient}
          />
        )}

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-5 lg:col-span-2">
            <ApplicantDetails
              lockedClient={lockedClient}
              onClientLock={handleLockClient}
            />

            <DocumentUploadSection
              key={resetKey}
              pendingFilesRef={pendingFilesRef}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-5 lg:col-span-1">
            {isManager && <AdvisorHierarchy />}
            <BeneficiaryDetails
              lockedClient={lockedClient}
              beneficiaryPhotosRef={beneficiaryPhotosRef}
            />
            <NomineeDetails
              lockedClient={lockedClient}
              nomineePhotosRef={nomineePhotosRef}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-border/70 pt-5">
          <SubmitButton
            pendingFilesRef={pendingFilesRef}
            beneficiaryPhotosRef={beneficiaryPhotosRef}
            nomineePhotosRef={nomineePhotosRef}
            lockedClient={lockedClient}
            isManager={isManager || false}
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