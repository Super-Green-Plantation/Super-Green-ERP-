"use client";

import { FormProvider } from "@/app/context/FormContext";
import ApplicantDetails from "./ApplicantDetails";
import BeneficiaryDetails from "./BeneficiaryDetails";
import NomineeDetails from "./NomineeDetails";
import { SubmitButton } from "./SubmitButto";
import Back from "@/app/components/Back";
import DocumentUploadSection from "./ClientDocuments";
import Heading from "@/app/components/Heading";

const Page = () => {
  return (
    <FormProvider>
      <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="sm:flex-col items-center gap-4">
            <div className="flex gap-3">
              <Back />
              <Heading>
                Create New Client
              </Heading>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              Complete all sections to finalize client investment onboarding.
            </p>
          </div>

        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Primary Details */}
          <div className="lg:col-span-2 space-y-8">
            <ApplicantDetails />
            <DocumentUploadSection />
          </div>

          {/* Right Column: Supporting Details */}
          <div className="lg:col-span-1 space-y-8">
            <BeneficiaryDetails />
            <NomineeDetails />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <SubmitButton />
        </div>
      </div>
    </FormProvider>
  );
};

export default Page;